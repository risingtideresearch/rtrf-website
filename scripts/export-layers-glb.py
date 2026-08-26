import rhinoscriptsyntax as rs
import scriptcontext as sc
import Rhino
import os
import re
import time
import json
import shutil
import gc

MESH_OBJECT_TYPE = 32


def sanitize_filename(name):
    sanitized = re.sub(r'[<>:"/\\|?*#]', '_', name)
    sanitized = sanitized.strip(' .')

    if not sanitized:
        sanitized = "unnamed_layer"

    return sanitized


def should_skip_layer(layer):
    """Skip centerline (CL as a whole word) and baseline layers."""
    if re.search(r'\bCL\b', layer):
        return True
    return "baseline" in layer.lower()


def get_bounding_box_info(objs):
    """Calculate world-aligned bounding box for a list of objects."""
    if not objs:
        return None

    bbox = rs.BoundingBox(objs)
    if not bbox:
        return None

    min_pt = bbox[0]  # Bottom corner (min x, min y, min z)
    max_pt = bbox[6]  # Top opposite corner (max x, max y, max z)

    width = max_pt[0] - min_pt[0]
    depth = max_pt[1] - min_pt[1]
    height = max_pt[2] - min_pt[2]

    return {
        "min": {"x": min_pt[0], "y": min_pt[1], "z": min_pt[2]},
        "max": {"x": max_pt[0], "y": max_pt[1], "z": max_pt[2]},
        "center": {
            "x": (min_pt[0] + max_pt[0]) / 2,
            "y": (min_pt[1] + max_pt[1]) / 2,
            "z": (min_pt[2] + max_pt[2]) / 2
        },
        "dimensions": {
            "width": width,
            "depth": depth,
            "height": height
        }
    }


def get_sorted_dimensions(bbox_info):
    """
    World-aligned bounding box dimensions sorted largest to smallest.
    NOTE: these are NOT rotation-independent — a rotated part reports the
    dimensions of its world-aligned box, not its true length/width/height.
    """
    if not bbox_info:
        return None

    dims = bbox_info["dimensions"]
    ordered = sorted([dims["width"], dims["depth"], dims["height"]], reverse=True)

    return {
        "length": ordered[0],
        "width": ordered[1],
        "height": ordered[2],
        "world_aligned": {
            "x": dims["width"],
            "y": dims["depth"],
            "z": dims["height"]
        }
    }


def unique_export_name(layer, used_names):
    """Sanitize the layer name and de-collide it against names already used."""
    base = sanitize_filename(layer)
    name = base
    counter = 2
    while name in used_names:
        name = f"{base}_{counter}"
        counter += 1
    used_names.add(name)
    return name


def remove_backup_file(filename):
    root, _ = os.path.splitext(filename)
    backup_file = root + ".glbbak"
    if os.path.exists(backup_file):
        try:
            os.remove(backup_file)
        except OSError:
            pass


def find_recent_export(base_filename, search_dirs, since):
    """
    Look for an export that Rhino wrote somewhere other than the requested
    path. Only shallow-scans the given directories, and only accepts a file
    modified after the export started — never a stale file from a previous
    export run.
    """
    for search_dir in search_dirs:
        if not search_dir or not os.path.isdir(search_dir):
            continue
        candidate = os.path.join(search_dir, base_filename)
        if os.path.isfile(candidate) and os.path.getmtime(candidate) >= since:
            return candidate
    return None


def print_recent_command_history(lines=6):
    """Echo Rhino's last few command-line messages so export errors are visible."""
    try:
        history = rs.CommandHistory() or ""
    except Exception:
        return
    tail = [line for line in history.splitlines() if line.strip()][-lines:]
    for line in tail:
        print(f"    rhino> {line}")


def write_selected_with_rhinocommon(filename):
    """
    Export the current selection through RhinoCommon (RhinoDoc.WriteFile).
    Rhino picks the exporter from the extension. This bypasses the scripted
    -Export command line and its option prompts, which have proven brittle.
    """
    try:
        options = Rhino.FileIO.FileWriteOptions()
        options.WriteSelectedObjectsOnly = True
        options.SuppressDialogBoxes = True
        options.SuppressAllInput = True
        return bool(sc.doc.WriteFile(filename, options))
    except Exception as e:
        print(f"  RhinoCommon WriteFile raised: {e}")
        return False


def export_with_command(filename):
    """Export the current selection via the scripted -Export command."""
    export_command = '_-Export "{}" _Enter'.format(filename.replace('\\', '/'))
    return bool(rs.Command(export_command, echo=False))


def export_selected_to_glb(filename, fallback_dirs):
    """
    Export the current selection to filename. Returns the actual file path on
    success (normally filename itself), or None on failure.
    """
    export_started = time.time() - 1  # 1s slack for filesystem timestamp granularity

    attempts = [
        ("RhinoCommon WriteFile", write_selected_with_rhinocommon),
        ("-Export command", export_with_command),
    ]

    for label, attempt in attempts:
        reported_ok = attempt(filename)
        remove_backup_file(filename)

        if os.path.exists(filename):
            if not reported_ok:
                print(f"  {label} reported failure but the file exists — continuing")
            return filename

        print(f"  {label} did not create the file (reported {'success' if reported_ok else 'failure'})")
        print_recent_command_history()

    # Rhino occasionally writes the file to the working folder instead of the
    # requested path — check likely locations for a freshly written file.
    base_filename = os.path.basename(filename)
    print(f"  File not found at expected location, searching for: {base_filename}")
    found_path = find_recent_export(base_filename, fallback_dirs, export_started)
    if not found_path:
        return None

    print(f"  Found file at: {found_path}")
    remove_backup_file(found_path)
    try:
        shutil.move(found_path, filename)
        print("  Moved file to correct location")
        return filename
    except OSError as e:
        print(f"  Could not move file: {e}")
        return found_path


def export_all_layers_to_glb():
    rs.UnselectAllObjects()

    export_path = rs.BrowseForFolder(rs.WorkingFolder(), 'Select models folder (GLBs will go to a versioned subfolder)', 'Export GLB')
    if not export_path:
        print("Export path not selected.")
        return

    # Create a timestamped sibling folder for GLBs; write manifest to the selected folder
    folder_name = os.path.basename(export_path)
    parent_path = os.path.dirname(export_path)
    timestamp = int(time.time())
    versioned_folder = os.path.join(parent_path, f"{folder_name}-{timestamp}")
    os.makedirs(versioned_folder, exist_ok=True)
    print(f"GLBs: {versioned_folder}")
    print(f"Manifest: {export_path}")

    fallback_dirs = [rs.WorkingFolder(), export_path, parent_path]

    layers = rs.LayerNames()
    if not layers:
        print("No layers found.")
        return

    print(f"Found {len(layers)} layers to process...")

    manifest = {
        "exported_layers": [],
        "failed_layers": [],
        "skipped_layers": [],
        "export_info": {
            "total_layers_found": len(layers),
            "timestamp_start": time.strftime("%Y-%m-%d %H:%M:%S"),
            "format": "GLB"
        }
    }

    used_export_names = set()

    for i, layer in enumerate(layers):
        print(f"Processing layer {i+1}/{len(layers)}: {layer}")

        if should_skip_layer(layer):
            print(f"  Skipping layer '{layer}' (CL or baseline)")
            manifest["skipped_layers"].append({
                "layer_name": layer,
                "export_method": "skipped",
                "notes": "Skipped - contains CL or baseline"
            })
            continue

        # Ensure we start clean for each layer
        rs.UnselectAllObjects()

        objs = rs.ObjectsByLayer(layer)
        if not objs:
            print(f"  No objects in layer '{layer}', skipping...")
            manifest["skipped_layers"].append({
                "layer_name": layer,
                "export_method": "skipped",
                "notes": "Skipped - no objects on layer"
            })
            continue

        print(f"  Found {len(objs)} objects in layer")

        # Calculate bounding box BEFORE any mesh conversion
        bbox_info = get_bounding_box_info(objs)
        normalized_size = get_sorted_dimensions(bbox_info)

        if bbox_info:
            print(f"  Bounding box: [{bbox_info['min']['x']:.2f}, {bbox_info['min']['y']:.2f}, {bbox_info['min']['z']:.2f}] to [{bbox_info['max']['x']:.2f}, {bbox_info['max']['y']:.2f}, {bbox_info['max']['z']:.2f}]")
            print(f"  Dimensions: {bbox_info['dimensions']['width']:.2f} x {bbox_info['dimensions']['depth']:.2f} x {bbox_info['dimensions']['height']:.2f}")

        rs.SelectObjects(objs)
        selected = rs.SelectedObjects()
        if not selected:
            print(f"  Failed to select objects in layer '{layer}', skipping...")
            manifest["skipped_layers"].append({
                "layer_name": layer,
                "export_method": "skipped",
                "notes": "Skipped - objects could not be selected (hidden/locked layer?)"
            })
            continue

        # Export the layer's objects as-is. The glTF exporter meshes breps,
        # surfaces, extrusions and SubDs itself using their render meshes.
        #
        # Do NOT run _-Mesh here: on this Rhino version the command does not
        # leave the new meshes selected, so a script cannot find them to delete
        # afterwards. They pile up on the layer, and every later run exports
        # the accumulated duplicates (~6x larger GLBs). See
        # cleanup-leftover-meshes.py for removing meshes left by older versions.
        currently_selected = selected
        mesh_count = sum(1 for obj in selected if rs.ObjectType(obj) == MESH_OBJECT_TYPE)
        print(f"  Selected {len(selected)} objects ({mesh_count} already meshes)")

        layer_export_name = unique_export_name(layer, used_export_names)
        filename = os.path.abspath(os.path.join(versioned_folder, layer_export_name + ".glb"))
        print(f"  Exporting {len(currently_selected)} objects to: {filename}")

        exported_path = export_selected_to_glb(filename, fallback_dirs)

        if exported_path:
            file_size = os.path.getsize(exported_path)
            print(f"  ✅ Successfully exported: {os.path.basename(exported_path)} ({file_size} bytes)")
            manifest["exported_layers"].append({
                "layer_name": layer,
                "filename": os.path.basename(exported_path),
                "file_size": file_size,
                "object_count": len(currently_selected),
                "bounding_box": bbox_info,
                "normalized_size": normalized_size,
                "export_method": "standard",
                "notes": ""
            })
        else:
            print(f"  ❌ Export failed for layer: {layer}")
            manifest["failed_layers"].append({
                "layer_name": layer,
                "notes": "Export failed - no file created"
            })
            for obj in currently_selected:
                print(f"    - Object type {rs.ObjectType(obj)}: {rs.ObjectDescription(obj)}")

        gc.collect()
        rs.UnselectAllObjects()

    # Final cleanup
    rs.UnselectAllObjects()
    rs.Redraw()

    manifest["export_info"]["timestamp_end"] = time.strftime("%Y-%m-%d %H:%M:%S")
    manifest["export_info"]["models_folder"] = f"{folder_name}-{timestamp}"
    manifest["export_info"]["units"] = {
        "id": rs.UnitSystem(),
        "name": rs.UnitSystemName(abbreviate=False)
    }
    manifest["export_info"]["successful_exports"] = len(manifest["exported_layers"])
    manifest["export_info"]["failed_exports"] = len(manifest["failed_layers"])
    manifest["export_info"]["skipped_exports"] = len(manifest["skipped_layers"])
    manifest["export_info"]["total_file_size"] = sum(layer["file_size"] for layer in manifest["exported_layers"])

    manifest_filename = os.path.join(export_path, "export_manifest.json")
    try:
        with open(manifest_filename, 'w') as f:
            json.dump(manifest, f, indent=2)
        print(f"\n📄 Manifest saved: {manifest_filename}")
    except OSError as e:
        print(f"⚠️  Failed to save manifest: {e}")

    # Final sweep for any backup files left in the export folder
    for root, _dirs, files in os.walk(versioned_folder):
        for file in files:
            if file.endswith('.glbbak'):
                try:
                    os.remove(os.path.join(root, file))
                    print(f"  Removed backup: {file}")
                except OSError as e:
                    print(f"  Could not remove {file}: {e}")

    exported = manifest["export_info"]["successful_exports"]
    failed = manifest["export_info"]["failed_exports"]
    skipped = manifest["export_info"]["skipped_exports"]
    print(f"Summary: {exported} exported, {failed} failed, {skipped} skipped")
    if exported == 0 and failed > 0:
        print("❌ Nothing was exported. Scroll up to the 'rhino>' lines to see what Rhino reported.")
    else:
        print("✅ GLB export completed.")


if __name__ == '__main__':
    export_all_layers_to_glb()
