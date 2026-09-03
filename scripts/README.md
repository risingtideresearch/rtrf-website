# Scripts

Post-processing pipeline for 3D model exports and technical drawings.

## Setup
```bash
cd scripts
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pdf2image pypdf pillow  # for transform_drawings.py
```

---

#### 1. `export-layers-glb.py`

Rhino Python script — run from within Rhino via `RunPythonScript`/`ScriptEditor`.

**Restore the `WEBSITE` layer state before running.** This is what determines which layers reach the web.

Iterates all layers and exports each as a GLB into a **versioned subfolder** named `{folder}-{unix-timestamp}/` (e.g. `models-1749200000/`). The manifest is written to the selected folder at the fixed path `models/export_manifest.json`, keeping that path stable while GLB URLs change each run — this drives cache busting on Netlify (`Cache-Control: immutable`).

When prompted, select the manifest folder:
- Main hull → `frontend/public/models/`
- Deck jig → `frontend/public/models-jig/`

The versioned GLB folder is created as a sibling automatically. `export_info.models_folder` in the manifest records which versioned folder was used.

~1-3 minutes to complete for the full model set.

Objects are exported as-is (via `RhinoDoc.WriteFile`); the glTF exporter meshes breps/surfaces with their render meshes. The script deliberately does **not** run `_-Mesh` first — see below.

#### 1a. `cleanup-leftover-meshes.py`

Older versions of the export script ran `_-Mesh` on every object before exporting and tried to delete the meshes afterwards, but Rhino didn't leave them selected, so they were never deleted. Each export run added another mesh copy on every layer, and subsequent exports included all copies (GLBs ~6× larger). If the `.3dm` was saved after such a run, run this script in Rhino: first with `DRY_RUN = True` to review the report (expect a whole-number count of leftovers per source object), then with `DRY_RUN = False` to delete them.

---

#### 1b. `step-to-glb.py`

Converts SolidWorks STEP assemblies to GLB, for geometry that lives outside the Rhino model — currently the battery modules in `step/`. Unlike the Rhino export this runs headless, so re-converting an updated SolidWorks file is one command.

Reads the STEP with OpenCASCADE (`cadquery-ocp`, in `requirements.txt`), which preserves the assembly tree, part names and per-part colors, then writes **one GLB per leaf part** into `frontend/public/models-battery-{unix-timestamp}/`, with the manifest at the stable `models-battery/export_manifest.json` — the same versioning scheme as the Rhino export.

Layer names mirror the whole assembly path, so they nest as deeply as the CAD does and hover reports the actual part:

```
BATTERY MODULE V2__SPINE__PAN HEAD SCREW.glb
BATTERY MODULE V1__SPINE__CLAMP ASSEMBLY__COMPRESSION PLATE.glb
```

```bash
python step-to-glb.py                     # convert everything in SOURCES
python step-to-glb.py --list              # print each STEP's layer paths
python step-to-glb.py --only v2           # one source
python step-to-glb.py --depth 2           # collapse deeper parts into their ancestor
python step-to-glb.py --linear-deflection 0.005   # finer tessellation (inches)
```

**Every setting is per model.** `DEFAULTS` at the top of the script lists them; a `SOURCES` entry overrides what it needs and a command-line flag beats both. Expect to tune these per STEP file:

| Setting | Purpose |
|--|--|
| `rename` | relabel a STEP component wherever it appears in a path (`spine_asm` → `SPINE`). Anything unlisted falls back to `clean_name()`, which upper-cases the name and drops the `_ai_…` configuration suffix toolbox parts carry |
| `skip_bodies` | regex for solid bodies whose names are feature noise (`Cut-Extrude1`, `brep_3[1]`) rather than part names, so the part is not split by body |
| `linear_deflection` / `angular_deflection` | tessellation tolerances, in inches and radians |
| `depth` | cap on layer path depth; deeper parts collapse into their ancestor |
| `up` | up axis of the STEP file — SolidWorks writes `z` |
| `merge_faces` | one glTF primitive per BRep face, or merged per material |

Run `--list` to see the layer paths a change produces before writing any files.

**Layer names are the link.** Sanity stores plain filenames, so a rename silently unlinks whatever pointed at the old one. A part's path therefore depends only on that part — never on its siblings or on how many bodies happen to be named — so editing one part cannot rename another. Names change only when the CAD component name, the `rename` map, or `--depth` changes. Run `audit-sanity-refs.py` after any of those; it checks `relatedModels` and `inlineModel` blocks against all three manifests and suggests replacements.

STEP records per-part colors but no material identity (its `COLOUR_RGB` entities are unnamed), so the converter keeps the colors, leaves materials unnamed, and gives them one neutral dielectric response. Nothing infers a material the CAD file never stated: `extract_materials.py` skips unnamed materials, so these models stay out of the material index and `HoverDisplay` lists no materials for them. If they need materials later, name them in `postprocess()` and add the folder back to the index merge in `main.py`.

Two conversion details worth knowing, both verified against the Rhino output:
- OpenCASCADE reads the file as millimeters and its glTF writer emits meters, so geometry needs no scaling. It does **not** rotate, so the script adds the Z-up → Y-up turn Rhino's exporter also applies. Geometry ends up Y-up meters; manifest boxes stay Z-up inches, which is what `util.ts` expects.
- The writer's label filter is matched against full path ids and needs the assembly root included, or it emits orphan nodes and an empty scene.

---

#### 1c. `optimize-glb.sh`

Compresses all GLBs using [gltfpack](https://github.com/zeux/meshoptimizer). Reads `models_folder` from each collection's manifest to find the current versioned GLB directories, processes them together, and updates `file_size` entries in every manifest after completion. Downloads `gltfpack` automatically on first run. Typically, this reduces file size ~90%.

Run immediately after `export-layers-glb.py` or `step-to-glb.py`, before `main.py`.

```bash
./optimize-glb.sh               # optimize all GLBs (main + jig + battery)
./optimize-glb.sh --dry-run     # preview which files would be processed
./optimize-glb.sh --simplify=0.85  # triangle retention ratio (default 0.92)
./optimize-glb.sh --only=models-battery   # one collection
```

It is destructive and in-place: a second pass simplifies an already simplified mesh again. After re-exporting one collection, use `--only=` so the others are left alone.

The front end uses `useGLTF(..., undefined, true)` to decompress meshopt files automatically via `meshoptimizer`.

---

#### 2. `main.py`

Orchestrator — runs material extraction, PDF conversion, manifest copying, and Sanity audit.

```bash
python main.py                  # full pipeline (skips unchanged PDFs)
python main.py --skip-pdf       # skip PDF conversion entirely
python main.py --full-pdf       # force reconvert all PDFs (clear output first)
python main.py --skip-audit     # skip Sanity reference audit
```

Steps:
1. Reads `models_folder` from `models/export_manifest.json` and extracts material info from the versioned GLB folder → `frontend/public/script-output/material_index_simple.json`
2. Copies model manifest to `studio/script_output/`
3. Converts new/changed PDFs in `frontend/public/drawings/` to PNGs; skips unchanged ones
4. Copies drawing and material manifests to `studio/script_output/`
5. Runs `audit-sanity-refs.py` to check Sanity references (skippable with `--skip-audit`)

Requires `NEXT_PUBLIC_SANITY_PROJECT_ID` and `SANITY_API_READ_TOKEN` in `frontend/.env` for the audit step.

---

#### 2a. `transform_drawings.py`

Called by `main.py`. Turns source drawings in `frontend/public/drawings/` into web assets under `frontend/public/drawings/output_images/`: PDFs are rasterised to PNG (one per page) and SVGs are copied as-is. Maintains a `conversion_manifest.json` with UUIDs, titles, authors, and metadata used by the Sanity drawings dropdowns.

Source files live at `drawings/<INITIALS>/<SYSTEM>/...`, where the top-level initials folder identifies the author (see `AUTHOR_FOLDERS`). That folder is dropped on output, so every author's drawings for a system land in one folder together. A file under an unrecognised initials folder is reported as `unattributed` at the end of the run rather than being credited to anyone.

Skips files whose output is already newer than the source — only new or modified drawings are processed. Use `--full-pdf` in `main.py` to force a clean rebuild (e.g. after changing DPI). UUIDs are derived from content so they remain stable across incremental runs.

---

#### 2b. `extract_materials.py`

Called by `main.py`. Reads GLB files and builds a material index (which materials appear in which models). Output is used by the anatomy page hover display and Materials table in Stories (dynamically displayed from related models).

---

#### 2c. `audit-sanity-refs.py`

Queries Sanity and cross-references against local manifests to find stale links. Also runs automatically at the end of `main.py`.

Checks:
- **`relatedModels`** on articles — GLB filenames against both `models/` and `models-jig/` manifests
- **Drawing references** in image sets — UUIDs against the drawings conversion manifest

Prints stale references with fuzzy suggestions for renamed files.

```bash
python audit-sanity-refs.py
```

---

#### 3. Model stills

The homepage crossfade tiles and the story preview/Open Graph images are renders
of the same models, so they go stale when the model changes. Regenerate them
last, once the new GLBs are in place:

```bash
cd ../frontend && npm run stills
```

See [frontend/README](../frontend/README.md#regenerating-model-stills).
