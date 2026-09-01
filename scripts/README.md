# Scripts

Post-processing pipeline for 3D model exports and technical drawings.

## Setup
```bash
cd scripts
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pdf2image pypdf pillow  # for pdf_to_png.py
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

#### 1b. `optimize-glb.sh`

Compresses all GLBs using [gltfpack](https://github.com/zeux/meshoptimizer). Reads `models_folder` from both manifests to find the current versioned GLB directories, processes main and jig files together, and updates `file_size` entries in both manifests after completion. Downloads `gltfpack` automatically on first run. Typically, this reduces file size ~90%.

Run immediately after `export-layers-glb.py`, before `main.py`.

```bash
./optimize-glb.sh               # optimize all GLBs (main + jig)
./optimize-glb.sh --dry-run     # preview which files would be processed
./optimize-glb.sh --simplify=0.85  # triangle retention ratio (default 0.92)
```

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

#### 2a. `pdf_to_png.py`

Called by `main.py`. Converts drawing PDFs in `frontend/public/drawings/` to PNGs under `frontend/public/drawings/output_images/`. Maintains a `conversion_manifest.json` with UUIDs, filenames, and metadata used by the Sanity drawings dropdowns.

Skips PDFs whose output PNG is already newer than the source file — only new or modified PDFs are converted. Use `--full-pdf` in `main.py` to force a clean rebuild (e.g. after changing DPI). UUIDs are derived from image content so they remain stable across incremental runs.

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
