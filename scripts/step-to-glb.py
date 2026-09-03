"""
STEP → GLB converter for CAD that lives outside the Rhino model.

Writes one GLB per sub-assembly into a versioned folder under frontend/public/,
with an export_manifest.json in the same shape export-layers-glb.py produces.
Run ./optimize-glb.sh afterwards to meshopt-compress the result.

    python step-to-glb.py --list      # print each STEP's top-level parts
"""

import argparse
import json
import math
import os
import re
import shutil
import time
from typing import Dict, List, Optional, Set, Tuple

from OCP.BRep import BRep_Builder
from OCP.BRepBndLib import BRepBndLib
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.Bnd import Bnd_Box
from OCP.Message import Message_ProgressRange
from OCP.RWGltf import RWGltf_CafWriter, RWGltf_WriterTrsfFormat_TRS
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_AsciiString, TCollection_ExtendedString
from OCP.TColStd import (
    TColStd_IndexedDataMapOfStringString,
    TColStd_MapOfAsciiString,
)
from OCP.TDataStd import TDataStd_Name
from OCP.Interface import Interface_Static
from OCP.Quantity import Quantity_Color, Quantity_TOC_RGB
from OCP.TDF import TDF_Label, TDF_LabelSequence
from OCP.TDocStd import TDocStd_Document
from OCP.TopAbs import TopAbs_ShapeEnum
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS_Compound, TopoDS_Shape
from OCP.XCAFDoc import XCAFDoc_ColorType
from OCP.XCAFApp import XCAFApp_Application
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.XCAFPrs import (
    XCAFPrs_DocumentExplorer,
    XCAFPrs_DocumentExplorerFlags_None,
)

from pygltflib import GLTF2

# One GLB per distinct leaf part, named for its whole path through the assembly
# — "BATTERY MODULE V2__SPINE__ROD.glb". The front end splits on "__", so hover
# reports the leaf rather than the whole sub-assembly.
#
# Every setting below is per model. A source overrides what it needs, DEFAULTS
# covers the rest, and a command-line flag beats both. Run with --list to see
# the layer paths a change produces before writing any files.
DEFAULTS = {
    # relabels a STEP component wherever it appears in a path; anything not
    # listed falls back to clean_name()
    "rename": {},
    # solid bodies whose names are SolidWorks feature noise rather than part
    # names, so the part is not split by body
    "skip_bodies": r"^(brep_\d+(\[\d+\])?"
                   r"|(Cut-|Boss-|Base-)?(Extrude|Revolve|Sweep|Loft|Fillet|Chamfer)\d*"
                   r"|End[A-Z]\w*|.*Diameter Hole\d*)$",
    # tessellation: chord tolerance in inches, angular tolerance in radians
    "linear_deflection": 0.01,
    "angular_deflection": 0.3,
    # cap on layer path depth; deeper parts collapse into their ancestor
    "depth": None,
    # up axis of the STEP file — SolidWorks writes z
    "up": "z",
    # one glTF primitive per BRep face, or merged per material
    "merge_faces": True,
}

SOURCES = [
    {
        "key": "v1",
        "step": "../step/module-asm-v1.stp",
        "system": "BATTERY MODULE V1",
        "rename": {
            "battery-cell": "CELLS",
            "busbar_16A": "BUSBAR",
            "spine-assembly": "SPINE",
            "clamp-assembly": "CLAMP ASSEMBLY",
        },
    },
    {
        "key": "v2",
        "step": "../step/module-asm-v2.stp",
        "system": "BATTERY MODULE V2",
        "rename": {
            "battery-cell-base": "CELLS",
            "spine_asm": "SPINE",
            "spine_asm_front-stop": "SPINE FRONT STOP",
        },
    },
]


def setting(source: Dict, key: str, override=None):
    """Per-model value for `key`: a command-line flag wins, then the source."""
    if override is not None:
        return override
    return source.get(key, DEFAULTS[key])

# STEP records colors but no material identity, so materials are left unnamed
# and given one neutral dielectric response rather than an inferred material.
NEUTRAL_METALLIC = 0.0
NEUTRAL_ROUGHNESS = 0.45

PUBLIC_DIR = "../frontend/public"
MANIFEST_DIR = PUBLIC_DIR + "/models-battery"
FOLDER_PREFIX = "models-battery"

MM_PER_INCH = 25.4

# OpenCASCADE reads mm and its glTF writer emits meters, so geometry needs no
# scaling — but it does not rotate. Geometry ends up Y-up meters and manifest
# boxes stay Z-up inches, which is the split util.ts expects.
ZUP_TO_YUP_QUAT = [-math.sqrt(0.5), 0.0, 0.0, math.sqrt(0.5)]


def label_name(label) -> str:
    """Read the TDataStd_Name off an XCAF label, or '?' when it has none."""
    attr = TDataStd_Name()
    if label.FindAttribute(TDataStd_Name.GetID_s(), attr):
        return attr.Get().ToExtString()
    return "?"


def clean_name(part: str) -> str:
    """
    A SolidWorks component name as a layer segment: "pan-head-screw" → "PAN HEAD
    SCREW". Toolbox parts carry a configuration after "_ai_" ("hex nut_ai_HNUT
    0.3125-18-D-N") which is dropped — it is a size code, not a name.
    """
    name = part.split("_ai_")[0]
    # solid bodies repeat as "pos-studs[1]", "pos-studs[2]" — one layer each
    name = re.sub(r"\[\d+\]\s*$", "", name)
    name = name.replace("_", " ").replace("-", " ")
    # "__" separates path segments and "." would break the .glb suffix
    name = name.replace("__", " ").replace(".", " ")
    return " ".join(name.split()).upper() or "PART"


def named_bodies(shape_tool, part_label, skip: "re.Pattern") -> List[Tuple[str, TopoDS_Shape]]:
    """
    Named solid bodies of a multi-body part, as (name, shape).

    Empty for a single-body part, whose one body is just the part itself, and
    Bodies whose names match `skip` are ignored — SolidWorks names an unnamed
    body after the feature that made it ("brep_3[1]", "Cut-Extrude1").
    """
    subs = TDF_LabelSequence()
    if not shape_tool.GetSubShapes_s(part_label, subs):
        return []

    bodies = []
    for i in range(1, subs.Length() + 1):
        label = subs.Value(i)
        name = label_name(label)
        if name in ("?", "NONE") or skip.match(name):
            continue
        shape = shape_tool.GetShape_s(label)
        if shape.ShapeType() == TopAbs_ShapeEnum.TopAbs_SOLID:
            bodies.append((name, shape))

    # Deliberately not skipped when there is only one body, even though the
    # segment is then redundant ("CELLS::CELL"): naming a second body later
    # would otherwise rename the first one and break every link to it. A part's
    # layer path depends only on that part, never on its siblings.
    return bodies


def body_color(color_tool, solid: TopoDS_Shape) -> Optional[Quantity_Color]:
    """
    A solid body's own color.

    Face styles are checked before the solid's, because a solid with no style of
    its own inherits the part's — which paints a steel stud with the blue of the
    cell it sits in. Bodies here carry at most one face color; where a body had
    several, the dominant one stands in for the rest.
    """
    counts: Dict[Tuple[float, float, float], int] = {}
    explorer = TopExp_Explorer(solid, TopAbs_ShapeEnum.TopAbs_FACE)
    while explorer.More():
        face_color = Quantity_Color()
        if color_tool.GetColor(
            explorer.Current(), XCAFDoc_ColorType.XCAFDoc_ColorSurf, face_color
        ):
            rgb = (face_color.Red(), face_color.Green(), face_color.Blue())
            counts[rgb] = counts.get(rgb, 0) + 1
        explorer.Next()

    if counts:
        red, green, blue = max(counts, key=lambda rgb: counts[rgb])
        return Quantity_Color(red, green, blue, Quantity_TOC_RGB)

    color = Quantity_Color()
    if color_tool.GetColor(solid, XCAFDoc_ColorType.XCAFDoc_ColorSurf, color):
        return color
    return None


def read_step(path: str) -> TDocStd_Document:
    """Read a STEP file into an XCAF document, preserving names and colors."""
    app = XCAFApp_Application.GetApplication_s()
    doc = TDocStd_Document(TCollection_ExtendedString("BinXCAF"))
    app.NewDocument(TCollection_ExtendedString("BinXCAF"), doc)

    reader = STEPCAFControl_Reader()
    # solid body names (MANIFOLD_SOLID_BREP) come in as sub-shape labels, which
    # is the only place a multi-body part names its pieces. The STEP statics are
    # not registered until a reader exists, so setting this earlier silently
    # no-ops — it has to come after the constructor above.
    Interface_Static.SetIVal_s("read.stepcaf.subshapes.name", 1)
    reader.SetColorMode(True)
    reader.SetNameMode(True)
    reader.SetLayerMode(True)
    reader.ReadFile(path)
    if not reader.Transfer(doc):
        raise RuntimeError("STEP transfer failed: " + path)
    return doc


def explore(doc: TDocStd_Document, roots: TDF_LabelSequence):
    """Yield (depth, node) for every node in the assembly tree, root first."""
    it = XCAFPrs_DocumentExplorer(doc, roots, XCAFPrs_DocumentExplorerFlags_None)
    while it.More():
        yield it.CurrentDepth(), it.Current()
        it.Next()


class Group:
    """The leaf parts sharing one assembly path — one output GLB."""

    def __init__(self, path: Tuple[str, ...]):
        self.path = path
        self.node_ids: Set[str] = set()
        self.shapes: List[TopoDS_Shape] = []
        # a body group is a slice of a multi-body part, so it cannot be selected
        # with the writer's node filter and is written from its own document
        self.color: Optional[Quantity_Color] = None
        self.is_body = False


def index_assembly(doc: TDocStd_Document, roots: TDF_LabelSequence,
                   shape_tool, color_tool, rename: Dict[str, str],
                   skip_bodies: "re.Pattern", depth_cap: Optional[int]):
    """
    Walk the tree and group every leaf part by its path through the assembly,
    returning (root_id, {path: Group}).

    Also renames instance labels, which STEP calls NAUO1, NAUO2, …, to their
    referenced product name — that is what makes the writer emit useful glTF
    node names, which RaycastHandler shows on hover.
    """
    groups: Dict[Tuple[str, ...], Group] = {}
    root_id: Optional[str] = None
    stack: List[Tuple[str, str]] = []  # (node id, segment name) per depth

    for depth, node in explore(doc, roots):
        part = label_name(node.RefLabel)
        node_id = node.Id.ToCString()

        if depth == 0:
            root_id = node_id
            TDataStd_Name.Set_s(node.Label, TCollection_ExtendedString(clean_name(part)))
            continue

        TDataStd_Name.Set_s(node.Label, TCollection_ExtendedString(clean_name(part)))

        # ancestors of this node are the entries shallower than it
        stack = stack[: depth - 1]
        stack.append((node_id, rename.get(part) or clean_name(part)))
        if node.IsAssembly:
            continue

        path = tuple(name for _, name in stack)
        if depth_cap:
            path = path[:depth_cap]

        bodies = [] if depth_cap and len(path) >= depth_cap else named_bodies(
            shape_tool, node.RefLabel, skip_bodies
        )
        if bodies:
            # a multi-body part: one layer per named body rather than one for
            # the whole part, so hover reports "POS TERMINAL STUD" not "CELLS"
            for body_name, body in bodies:
                body_path = path + (clean_name(body_name),)
                group = groups.setdefault(body_path, Group(body_path))
                group.is_body = True
                group.shapes.append(body.Moved(node.Location))
                if group.color is None:
                    group.color = body_color(color_tool, body)
            continue

        group = groups.setdefault(path, Group(path))
        # every ancestor has to be written too, or the leaf has no parent chain
        group.node_ids.update(nid for nid, _ in stack)
        group.shapes.append(shape_tool.GetShape_s(node.RefLabel).Moved(node.Location))

    if root_id is None:
        raise RuntimeError("no root node found")
    return root_id, groups


def document_unit() -> float:
    """
    The length unit the reader gives shapes, in meters.

    `xstep.cascade.unit` is left at its default, so STEP arrives as millimeters
    whatever the file declares — these assemblies are authored in inches and
    read as mm. Reading it back off the document would be tidier, but
    FindAttribute on XCAFDoc_LengthUnit segfaults in these bindings.
    """
    unit = Interface_Static.CVal_s("xstep.cascade.unit") or "MM"
    return {"MM": 0.001, "M": 1.0, "CM": 0.01, "INCH": 0.0254}.get(unit.upper(), 0.001)


def write_body_glb(group: "Group", label: str, out_path: str, merge_faces: bool,
                   unit: float) -> bool:
    """
    Write a group of solid bodies to GLB via a document of its own.

    The writer's label filter matches assembly node ids, and bodies are
    sub-shapes rather than nodes, so they cannot be selected out of the source
    document. Their triangulation is shared with it, so this needs no remeshing.
    """
    app = XCAFApp_Application.GetApplication_s()
    doc = TDocStd_Document(TCollection_ExtendedString("BinXCAF"))
    app.NewDocument(TCollection_ExtendedString("BinXCAF"), doc)
    # the writer scales to meters using the document's unit; without it a fresh
    # document emits raw millimeters while the filtered path emits meters
    XCAFDoc_DocumentTool.SetLengthUnit_s(doc, unit)
    shape_tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    color_tool = XCAFDoc_DocumentTool.ColorTool_s(doc.Main())

    # one node per instance rather than one compound, so hover can name the
    # individual body — "CELL 3" out of a stack of eight
    for index, shape in enumerate(group.shapes, start=1):
        shape_label = shape_tool.AddShape(shape, False)
        name = label if len(group.shapes) == 1 else "%s %d" % (label, index)
        TDataStd_Name.Set_s(shape_label, TCollection_ExtendedString(name))
        if group.color is not None:
            color_tool.SetColor(
                shape_label, group.color, XCAFDoc_ColorType.XCAFDoc_ColorSurf
            )

    writer = RWGltf_CafWriter(TCollection_AsciiString(out_path), True)
    writer.SetTransformationFormat(RWGltf_WriterTrsfFormat_TRS)
    writer.SetMergeFaces(merge_faces)
    writer.SetParallel(True)
    return writer.Perform(
        doc, TColStd_IndexedDataMapOfStringString(), Message_ProgressRange()
    )


def compound_of(shapes: List[TopoDS_Shape]) -> TopoDS_Compound:
    builder = BRep_Builder()
    compound = TopoDS_Compound()
    builder.MakeCompound(compound)
    for shape in shapes:
        builder.Add(compound, shape)
    return compound


def bounding_box(shape) -> Dict:
    """Axis-aligned box in Z-up inches, matching the Rhino manifest convention."""
    box = Bnd_Box()
    BRepBndLib.Add_s(shape, box)
    x0, y0, z0, x1, y1, z1 = box.Get()
    lo = [v / MM_PER_INCH for v in (x0, y0, z0)]
    hi = [v / MM_PER_INCH for v in (x1, y1, z1)]
    dims = [hi[k] - lo[k] for k in range(3)]
    return {
        "min": {"x": lo[0], "y": lo[1], "z": lo[2]},
        "max": {"x": hi[0], "y": hi[1], "z": hi[2]},
        "center": {"x": (lo[0] + hi[0]) / 2, "y": (lo[1] + hi[1]) / 2, "z": (lo[2] + hi[2]) / 2},
        "dimensions": {"width": dims[0], "depth": dims[1], "height": dims[2]},
    }


def normalized_size(bbox: Dict) -> Dict:
    """Dimensions sorted longest-first, plus the raw world-aligned extents."""
    dims = bbox["dimensions"]
    ordered = sorted([dims["width"], dims["depth"], dims["height"]], reverse=True)
    return {
        "length": ordered[0],
        "width": ordered[1],
        "height": ordered[2],
        "world_aligned": {"x": dims["width"], "y": dims["depth"], "z": dims["height"]},
    }


def postprocess(path: str, group_label: str, rotate: bool) -> None:
    """
    Wrap the scene in a node carrying the Z-up → Y-up rotation, and set the
    metallic/roughness factors glTF would otherwise default to 1.0 — which
    renders every part as rough metal.
    """
    gltf = GLTF2().load(path)
    scene = gltf.scenes[gltf.scene or 0]

    # Number repeated nodes so every name in the file is unique. A sub-assembly
    # shares one set of labels across its instances, so the writer emits the
    # same name several times; left alone, GLTFLoader appends a suffix of its
    # own and hover reads "CLAMP 5 1".
    totals: Dict[str, int] = {}
    for node in gltf.nodes:
        if node.name:
            totals[node.name] = totals.get(node.name, 0) + 1
    numbered: Dict[str, int] = {}
    for node in gltf.nodes:
        if node.name and totals[node.name] > 1:
            numbered[node.name] = numbered.get(node.name, 0) + 1
            node.name = "%s %d" % (node.name, numbered[node.name])

    for material in gltf.materials or []:
        material.name = None
        if material.pbrMetallicRoughness is not None:
            material.pbrMetallicRoughness.metallicFactor = NEUTRAL_METALLIC
            material.pbrMetallicRoughness.roughnessFactor = NEUTRAL_ROUGHNESS

    if rotate:
        from pygltflib import Node

        wrapper = Node(name=group_label, children=list(scene.nodes), rotation=ZUP_TO_YUP_QUAT)
        gltf.nodes.append(wrapper)
        scene.nodes = [len(gltf.nodes) - 1]

    gltf.save(path)


# ---------------------------------------------------------------------------
# Conversion
# ---------------------------------------------------------------------------


def convert_source(source: Dict, out_dir: str, args) -> List[Dict]:
    """Convert one STEP file into one GLB per leaf part path."""
    step_path = source["step"]
    if not os.path.exists(step_path):
        print("⚠️  missing STEP file: " + step_path)
        return []

    print("\n📐 " + os.path.basename(step_path) + "  →  " + source["system"])
    doc = read_step(step_path)
    shape_tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    roots = TDF_LabelSequence()
    shape_tool.GetFreeShapes(roots)

    color_tool = XCAFDoc_DocumentTool.ColorTool_s(doc.Main())
    doc_unit = document_unit()
    depth_cap = setting(source, "depth", args.depth)
    merge_faces = setting(source, "merge_faces", args.merge_faces)
    root_id, groups = index_assembly(
        doc, roots, shape_tool, color_tool,
        setting(source, "rename"),
        re.compile(setting(source, "skip_bodies"), re.IGNORECASE),
        depth_cap,
    )

    if args.list:
        for path, group in groups.items():
            print("   - %-52s %d part(s)" % ("::".join(path), len(group.shapes)))
        return []

    # Once for the whole doc — groups reuse the triangulation stored on the faces.
    for i in range(1, roots.Length() + 1):
        BRepMesh_IncrementalMesh(
            shape_tool.GetShape_s(roots.Value(i)),
            setting(source, "linear_deflection", args.linear_deflection) * MM_PER_INCH,
            False,
            setting(source, "angular_deflection", args.angular_deflection),
            True,
        )

    entries = []
    for path, group in groups.items():
        segments = (source["system"],) + path
        filename = "__".join(segments) + ".glb"
        out_path = os.path.join(out_dir, filename)

        if group.is_body:
            ok = write_body_glb(group, path[-1], out_path, merge_faces, doc_unit)
        else:
            # Matched against full path ids, and the root has to be in it too or
            # the writer emits orphan nodes and an empty scene.
            label_filter = TColStd_MapOfAsciiString()
            label_filter.Add(TCollection_AsciiString(root_id))
            for node_id in group.node_ids:
                label_filter.Add(TCollection_AsciiString(node_id))

            writer = RWGltf_CafWriter(TCollection_AsciiString(out_path), True)
            writer.SetTransformationFormat(RWGltf_WriterTrsfFormat_TRS)
            writer.SetMergeFaces(merge_faces)
            writer.SetParallel(True)
            ok = writer.Perform(
                doc,
                roots,
                label_filter,
                TColStd_IndexedDataMapOfStringString(),
                Message_ProgressRange(),
            )
        if not ok:
            print("   ❌ %s — writer failed" % filename)
            continue

        postprocess(out_path, " ".join(segments), setting(source, "up", args.up) == "z")

        bbox = bounding_box(compound_of(group.shapes))
        leaf_count = len(group.shapes)

        entries.append(
            {
                "layer_name": "::".join(segments),
                "filename": filename,
                "file_size": os.path.getsize(out_path),
                "object_count": leaf_count,
                "bounding_box": bbox,
                "normalized_size": normalized_size(bbox),
                "export_method": "step",
                "notes": "converted from %s" % os.path.basename(step_path),
            }
        )
        dims = bbox["dimensions"]
        print(
            "   ✅ %-56s %6.0fK  %2d part(s)  %.1f × %.1f × %.1f in"
            % (
                filename,
                os.path.getsize(out_path) / 1024,
                leaf_count,
                dims["width"],
                dims["depth"],
                dims["height"],
            )
        )

    return entries


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert STEP assemblies to web GLB")
    parser.add_argument("--only", help="convert a single source by key (e.g. v2)")
    parser.add_argument("--list", action="store_true",
                        help="print each STEP's layer paths and exit")
    parser.add_argument("--depth", type=int,
                        help="override the per-model layer path depth cap")
    parser.add_argument("--linear-deflection", type=float,
                        help="override the per-model chord tolerance, in inches")
    parser.add_argument("--angular-deflection", type=float,
                        help="override the per-model angular tolerance, in radians")
    parser.add_argument("--up", choices=["z", "y"],
                        help="override the per-model up axis")
    parser.add_argument("--no-merge-faces", dest="merge_faces", action="store_false",
                        help="keep one glTF primitive per BRep face")
    parser.add_argument("--keep-folder", action="store_true",
                        help="write into the folder the current manifest points at")
    parser.set_defaults(merge_faces=None)
    args = parser.parse_args()

    sources = [s for s in SOURCES if not args.only or s["key"] == args.only]
    if not sources:
        raise SystemExit("no source matches --only " + str(args.only))

    if args.list:
        for source in sources:
            convert_source(source, "", args)
        return

    manifest_path = os.path.join(MANIFEST_DIR, "export_manifest.json")
    if args.keep_folder and os.path.exists(manifest_path):
        with open(manifest_path) as f:
            folder = json.load(f)["export_info"].get("models_folder", FOLDER_PREFIX)
    else:
        folder = "%s-%d" % (FOLDER_PREFIX, int(time.time()))
    out_dir = os.path.join(PUBLIC_DIR, folder)

    if os.path.exists(out_dir) and not args.keep_folder:
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(MANIFEST_DIR, exist_ok=True)

    started = time.strftime("%Y-%m-%d %H:%M:%S")
    entries: List[Dict] = []
    for source in sources:
        entries.extend(convert_source(source, out_dir, args))

    # Preserve entries from sources this run skipped, so --only stays additive.
    if args.only and os.path.exists(manifest_path):
        with open(manifest_path) as f:
            previous = json.load(f)
        kept = {e["filename"] for e in entries}
        for entry in previous.get("exported_layers", []):
            if entry["filename"] not in kept and os.path.exists(
                os.path.join(out_dir, entry["filename"])
            ):
                entries.append(entry)

    entries.sort(key=lambda e: e["filename"])
    manifest = {
        "exported_layers": entries,
        "failed_layers": [],
        "skipped_layers": [],
        "export_info": {
            "total_layers_found": len(entries),
            "timestamp_start": started,
            "timestamp_end": time.strftime("%Y-%m-%d %H:%M:%S"),
            "format": "GLB",
            "models_folder": folder,
            "units": {"id": 8, "name": "inch"},
            "successful_exports": len(entries),
            "failed_exports": 0,
            "skipped_exports": 0,
            "total_file_size": sum(e["file_size"] for e in entries),
            "source": "step-to-glb.py",
        },
    }
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print("\n✅ %d GLB(s) → %s" % (len(entries), out_dir))
    print("   manifest → " + manifest_path)
    print("   next: ./optimize-glb.sh && python main.py --skip-pdf")


if __name__ == "__main__":
    main()
