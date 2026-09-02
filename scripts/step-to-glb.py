"""
STEP → GLB converter for the battery module assemblies.

Reads SolidWorks STEP (AP214) assemblies with OpenCASCADE, tessellates them,
and writes one meshopt-ready GLB per sub-assembly into a versioned folder under
frontend/public/, alongside an export_manifest.json in the same shape the Rhino
exporter produces (see export-layers-glb.py).

Unlike the Rhino pipeline this runs headless, so re-converting an updated
SolidWorks export is a single command.

Usage (from scripts/):
    python step-to-glb.py                       # convert everything in SOURCES
    python step-to-glb.py --only v2             # one source
    python step-to-glb.py --linear-deflection 0.05
    python step-to-glb.py --keep-folder         # reuse the current versioned folder

Then run ./optimize-glb.sh to meshopt-compress the result.
"""

import argparse
import json
import math
import os
import shutil
import time
from collections import Counter
from typing import Dict, List, Optional

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
from OCP.TDF import TDF_Label, TDF_LabelSequence
from OCP.TDocStd import TDocStd_Document
from OCP.TopoDS import TopoDS_Compound
from OCP.XCAFApp import XCAFApp_Application
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.XCAFPrs import (
    XCAFPrs_DocumentExplorer,
    XCAFPrs_DocumentExplorerFlags_None,
)

from pygltflib import GLTF2

# ---------------------------------------------------------------------------
# Configuration
#
# `groups` maps the STEP's top-level component names (as authored in
# SolidWorks) onto one output GLB each. Re-running against a renamed export is
# a one-line edit here. Run with --list to print the tree of a STEP file.
# ---------------------------------------------------------------------------

SOURCES = [
    {
        "key": "v1",
        "step": "../step/module-asm-v1.stp",
        "system": "BATTERY MODULE V1",
        "groups": [
            {"name": "CELLS", "parts": ["battery-cell"]},
            {"name": "BUSBAR", "parts": ["busbar_16A"]},
            {"name": "SPINE", "parts": ["spine-assembly", "spine_M"]},
        ],
    },
    {
        "key": "v2",
        "step": "../step/module-asm-v2.stp",
        "system": "BATTERY MODULE V2",
        "groups": [
            {"name": "CELLS", "parts": ["battery-cell-base"]},
            {"name": "SPINE", "parts": ["spine_asm"]},
            {"name": "SPINE FRONT STOP", "parts": ["spine_asm_front-stop"]},
        ],
    },
]

# Leaf part name → (material name, metallicFactor, roughnessFactor).
#
# STEP colour entities are unnamed, but the front end keys off material *names*:
# Model3D.tsx tunes metalness/roughness by name and HoverDisplay lists the names
# harvested by extract_materials.py. Names are matched against the existing
# vocabulary in script-output/material_index_simple.json where one fits.
#
# Avoid "Plastic" and "Wood" — Model3D.tsx force-overrides those (Plastic is
# recoloured orange).
MATERIALS: Dict[str, tuple] = {
    "battery-cell": ("Lithium Cell", 0.0, 0.55),
    "battery-cell-base": ("Lithium Cell", 0.0, 0.55),
    "busbar_16A": ("Copper", 1.0, 0.35),
    "clamp": ("Aluminum 6061", 1.0, 0.30),
    "compression-plate": ("Aluminum 6061", 1.0, 0.30),
    "front_bar": ("Aluminum 6061", 1.0, 0.30),
    "spine_L": ("Aluminum 6061", 1.0, 0.30),
    "spine_M": ("Aluminum 6061", 1.0, 0.30),
    "spine_R": ("Aluminum 6061", 1.0, 0.30),
    "spine_base": ("Aluminum 6061", 1.0, 0.30),
    "spine_side_simple": ("Aluminum 6061", 1.0, 0.30),
    "spine_side_simple_front-stop-a": ("Aluminum 6061", 1.0, 0.30),
    "spine_side_simple_front-stop-b": ("Aluminum 6061", 1.0, 0.30),
    "nut": ("Stainless Steel", 1.0, 0.25),
    "pan-head-screw": ("Stainless Steel", 1.0, 0.25),
    "rod": ("Stainless Steel", 1.0, 0.25),
    "tension-rod": ("Stainless Steel", 1.0, 0.25),
    "flat washer type a narrow_ai_Preferred Narrow FW 0.3125": ("Stainless Steel", 1.0, 0.25),
    "hex nut_ai_HNUT 0.3125-18-D-N": ("Stainless Steel", 1.0, 0.25),
}

FALLBACK_MATERIAL = ("Aluminum 6061", 1.0, 0.30)

PUBLIC_DIR = "../frontend/public"
MANIFEST_DIR = PUBLIC_DIR + "/models-battery"
FOLDER_PREFIX = "models-battery"

MM_PER_INCH = 25.4

# OpenCASCADE reads this STEP as millimetres and RWGltf_CafWriter emits metres,
# so geometry needs no scaling — only the Z-up → Y-up swap that Rhino's glTF
# exporter also performs. See util.ts INCHES_TO_METERS and its "Rhino Z →
# Three.js Y" mapping: manifest boxes stay Z-up inches, geometry is Y-up metres.
ZUP_TO_YUP_QUAT = [-math.sqrt(0.5), 0.0, 0.0, math.sqrt(0.5)]


# ---------------------------------------------------------------------------
# OpenCASCADE helpers
# ---------------------------------------------------------------------------


def label_name(label) -> str:
    """Read the TDataStd_Name off an XCAF label, or '?' when it has none."""
    attr = TDataStd_Name()
    if label.FindAttribute(TDataStd_Name.GetID_s(), attr):
        return attr.Get().ToExtString()
    return "?"


def read_step(path: str) -> TDocStd_Document:
    """Read a STEP file into an XCAF document, preserving names and colours."""
    app = XCAFApp_Application.GetApplication_s()
    doc = TDocStd_Document(TCollection_ExtendedString("BinXCAF"))
    app.NewDocument(TCollection_ExtendedString("BinXCAF"), doc)

    reader = STEPCAFControl_Reader()
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


def index_assembly(doc: TDocStd_Document, roots: TDF_LabelSequence):
    """
    Walk the tree once, rename instance labels to their part names, and bucket
    every node id under the top-level component it belongs to.

    STEP instances are named NAUO1, NAUO2, … — renaming the instance label to
    the referenced product name is what makes RWGltf_CafWriter emit useful glTF
    node names, which RaycastHandler shows on hover.

    Returns (root_id, {top_level_part_name: [node ids]}, {node id: part name}).
    """
    buckets: Dict[str, List[str]] = {}
    part_of: Dict[str, str] = {}
    root_id: Optional[str] = None
    current: Optional[str] = None

    for depth, node in explore(doc, roots):
        part = label_name(node.RefLabel)
        node_id = node.Id.ToCString()
        TDataStd_Name.Set_s(node.Label, TCollection_ExtendedString(part))
        part_of[node_id] = part

        if depth == 0:
            root_id = node_id
            continue
        if depth == 1:
            current = part
        if current is not None:
            buckets.setdefault(current, []).append(node_id)

    if root_id is None:
        raise RuntimeError("no root node found")
    return root_id, buckets, part_of


def group_compound(shape_tool, roots: TDF_LabelSequence, parts: List[str]) -> TopoDS_Compound:
    """Build a compound of the located top-level components named in `parts`."""
    builder = BRep_Builder()
    compound = TopoDS_Compound()
    builder.MakeCompound(compound)
    for i in range(1, roots.Length() + 1):
        comps = TDF_LabelSequence()
        shape_tool.GetComponents_s(roots.Value(i), comps)
        for j in range(1, comps.Length() + 1):
            comp = comps.Value(j)
            ref = TDF_Label()
            target = ref if shape_tool.GetReferredShape_s(comp, ref) else comp
            if label_name(target) in parts:
                builder.Add(compound, shape_tool.GetShape_s(comp))
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


# ---------------------------------------------------------------------------
# glTF post-processing
# ---------------------------------------------------------------------------


def postprocess(path: str, group_label: str, rotate: bool) -> None:
    """
    Fix up what OpenCASCADE's writer leaves out:

    * wrap the scene in a node carrying the Z-up → Y-up rotation
    * name the materials and give them sane metallic/roughness values (STEP
      colours arrive unnamed, and glTF defaults both factors to 1.0, which
      renders every part as rough metal)
    """
    gltf = GLTF2().load(path)
    scene = gltf.scenes[gltf.scene or 0]

    # Materials are shared across parts, so attribute each one to the part name
    # that uses it most and take that part's material definition.
    users: Dict[int, Counter] = {}
    for node in gltf.nodes:
        if node.mesh is None:
            continue
        for prim in gltf.meshes[node.mesh].primitives:
            if prim.material is None:
                continue
            users.setdefault(prim.material, Counter())[node.name or "?"] += 1

    unknown = set()
    for index, material in enumerate(gltf.materials or []):
        counts = users.get(index)
        part = counts.most_common(1)[0][0] if counts else None
        if part not in MATERIALS:
            if part:
                unknown.add(part)
            name, metallic, roughness = FALLBACK_MATERIAL
        else:
            name, metallic, roughness = MATERIALS[part]
        material.name = name
        if material.pbrMetallicRoughness is not None:
            material.pbrMetallicRoughness.metallicFactor = metallic
            material.pbrMetallicRoughness.roughnessFactor = roughness
    if unknown:
        print("     ! no MATERIALS entry for: " + ", ".join(sorted(unknown)))

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
    """Convert one STEP file into one GLB per configured group."""
    step_path = source["step"]
    if not os.path.exists(step_path):
        print("⚠️  missing STEP file: " + step_path)
        return []

    print("\n📐 " + os.path.basename(step_path) + "  →  " + source["system"])
    doc = read_step(step_path)
    shape_tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    roots = TDF_LabelSequence()
    shape_tool.GetFreeShapes(roots)

    root_id, buckets, part_of = index_assembly(doc, roots)

    if args.list:
        for part, ids in buckets.items():
            leaves = Counter(part_of[i] for i in ids if part_of[i] != part)
            print("   - %-24s %d node(s)  %s" % (part, len(ids), dict(leaves) or "leaf"))
        return []

    # Tessellate once — every group reuses the triangulation stored on the faces.
    for i in range(1, roots.Length() + 1):
        BRepMesh_IncrementalMesh(
            shape_tool.GetShape_s(roots.Value(i)),
            args.linear_deflection * MM_PER_INCH,
            False,
            args.angular_deflection,
            True,
        )

    entries = []
    for group in source["groups"]:
        missing = [p for p in group["parts"] if p not in buckets]
        if missing:
            print("   ⚠️  %s: no such top-level part(s): %s" % (group["name"], ", ".join(missing)))
        node_ids = [i for p in group["parts"] for i in buckets.get(p, [])]
        if not node_ids:
            continue

        filename = "%s__%s.glb" % (source["system"], group["name"])
        out_path = os.path.join(out_dir, filename)

        # The filter is matched against full path ids, and the assembly root has
        # to be in it too — otherwise the writer emits orphan nodes and an empty
        # scene.
        label_filter = TColStd_MapOfAsciiString()
        label_filter.Add(TCollection_AsciiString(root_id))
        for node_id in node_ids:
            label_filter.Add(TCollection_AsciiString(node_id))

        writer = RWGltf_CafWriter(TCollection_AsciiString(out_path), True)
        writer.SetTransformationFormat(RWGltf_WriterTrsfFormat_TRS)
        writer.SetMergeFaces(args.merge_faces)
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

        postprocess(out_path, "%s %s" % (source["system"], group["name"]), args.up == "z")

        compound = group_compound(shape_tool, roots, group["parts"])
        bbox = bounding_box(compound)
        leaf_count = len([i for i in node_ids if part_of[i] not in group["parts"]]) or len(node_ids)

        entries.append(
            {
                "layer_name": "%s::%s" % (source["system"], group["name"]),
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
            "   ✅ %-40s %6.0fK  %d part(s)  %.1f × %.1f × %.1f in"
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
                        help="print each STEP's top-level parts and exit")
    parser.add_argument("--linear-deflection", type=float, default=0.01,
                        help="tessellation chord tolerance in inches (default: 0.01)")
    parser.add_argument("--angular-deflection", type=float, default=0.3,
                        help="tessellation angular tolerance in radians (default: 0.3)")
    parser.add_argument("--up", choices=["z", "y"], default="z",
                        help="up axis of the STEP file (default: z, matching SolidWorks)")
    parser.add_argument("--no-merge-faces", dest="merge_faces", action="store_false",
                        help="keep one glTF primitive per BRep face")
    parser.add_argument("--keep-folder", action="store_true",
                        help="write into the folder the current manifest points at")
    parser.set_defaults(merge_faces=True)
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

    # The versioned folder is served with an immutable Cache-Control, so it is
    # replaced wholesale rather than merged into.
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
