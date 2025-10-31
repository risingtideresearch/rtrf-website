import rhinoscriptsyntax as rs
import os
import re
import time
import json
import shutil

def sanitize_filename(name):
    sanitized = re.sub(r'[<>:"/\\|?*#]', '_', name)
    sanitized = sanitized.strip(' .')
    
    if not sanitized:
        sanitized = "unnamed_layer"
    
    return sanitized

def get_bounding_box_info(objs):
    """Calculate bounding box for a list of objects with min/max for each dimension"""
    if not objs:
        return None
    
    bbox = rs.BoundingBox(objs)
    if not bbox:
        return None
    
    # Get min and max points
    min_pt = bbox[0]  # Bottom corner (min x, min y, min z)
    max_pt = bbox[6]  # Top opposite corner (max x, max y, max z)
    
    # Calculate dimensions
    width = max_pt[0] - min_pt[0]
    depth = max_pt[1] - min_pt[1]
    height = max_pt[2] - min_pt[2]
    
    # Calculate center
    center = [
        (min_pt[0] + max_pt[0]) / 2,
        (min_pt[1] + max_pt[1]) / 2,
        (min_pt[2] + max_pt[2]) / 2
    ]
    
    return {
        "min": {
            "x": min_pt[0],
            "y": min_pt[1],
            "z": min_pt[2]
        },
        "max": {
            "x": max_pt[0],
            "y": max_pt[1],
            "z": max_pt[2]
        },
        "center": {
            "x": center[0],
            "y": center[1],
            "z": center[2]
        },
        "dimensions": {
            "width": width,
            "depth": depth,
            "height": height
        }
    }

def export_all_layers_to_glb():
    rs.UnselectAllObjects()
    
    export_path = rs.BrowseForFolder(rs.WorkingFolder(), 'Destination', 'Export GLB')
    if not export_path:
        print("Export path not selected.")
        return
    
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
            "export_path": export_path,
            "timestamp_start": time.strftime("%Y-%m-%d %H:%M:%S"),
            "format": "GLB"
        }
    }
    
    for i, layer in enumerate(layers):
        print(f"Processing layer {i+1}/{len(layers)}: {layer}")
        
        # Skip layers with "CL" or "baseline" in the name
        if "CL" in layer or "baseline" in layer.lower():
            print(f"  Skipping layer '{layer}' (contains CL or baseline)")
            manifest["skipped_layers"].append({
                "layer_name": layer,
                "export_method": "skipped",
                "notes": "Skipped - contains CL or baseline"
            })
            continue
        
        # Ensure we start clean for each layer
        rs.UnselectAllObjects()
        rs.Redraw()
        
        objs = rs.ObjectsByLayer(layer)
        if not objs:
            print(f"  No objects in layer '{layer}', skipping...")
            continue
        
        print(f"  Found {len(objs)} objects in layer")
        
        # Calculate bounding box BEFORE any mesh conversion
        bbox_info = get_bounding_box_info(objs)
        if bbox_info:
            print(f"  Bounding box: [{bbox_info['min']['x']:.2f}, {bbox_info['min']['y']:.2f}, {bbox_info['min']['z']:.2f}] to [{bbox_info['max']['x']:.2f}, {bbox_info['max']['y']:.2f}, {bbox_info['max']['z']:.2f}]")
            print(f"  Dimensions: {bbox_info['dimensions']['width']:.2f} x {bbox_info['dimensions']['depth']:.2f} x {bbox_info['dimensions']['height']:.2f}")
        
        # Select objects
        rs.SelectObjects(objs)
        selected = rs.SelectedObjects()
        if not selected:
            print(f"  Failed to select objects in layer '{layer}', skipping...")
            continue
        
        print(f"  Selected {len(selected)} objects")
        
        # Try different approaches based on object types
        mesh_objs = []
        
        # First, check if objects are already meshes
        already_meshes = [obj for obj in selected if rs.ObjectType(obj) == 32]  # 32 = mesh
        if already_meshes:
            print(f"  Found {len(already_meshes)} objects that are already meshes")
            mesh_objs.extend(already_meshes)
        
        # For non-mesh objects, try to convert them with better error handling
        non_meshes = [obj for obj in selected if rs.ObjectType(obj) != 32]
        if non_meshes:
            print(f"  Converting {len(non_meshes)} non-mesh objects...")
            rs.UnselectAllObjects()
            rs.SelectObjects(non_meshes)
            
            # Try meshing with safer parameters to avoid crashes
            try:
                print("  Attempting mesh conversion with default settings...")
                result = rs.Command("_-Mesh _Pause _Enter", echo=False)
                print(f"  Mesh command result: {result}")
                
                # Wait longer for mesh calculation to complete
                time.sleep(0.5)
                rs.Redraw()
                new_meshes = rs.SelectedObjects()
                
                if new_meshes:
                    print(f"  Mesh command created {len(new_meshes)} new objects")
                    mesh_objs.extend(new_meshes)
                else:
                    print("  Mesh command didn't create new objects, trying simpler approach...")
                    # Try with simplified mesh settings
                    rs.UnselectAllObjects()
                    rs.SelectObjects(non_meshes)
                    
                    # Use simpler mesh command
                    result2 = rs.Command("_-Mesh _Simple _Enter", echo=False)
                    time.sleep(1.0)
                    rs.Redraw()
                    simple_meshes = rs.SelectedObjects()
                    
                    if simple_meshes:
                        print(f"  Simple mesh created {len(simple_meshes)} objects")
                        mesh_objs.extend(simple_meshes)
                    else:
                        print("  Mesh conversion failed, using original objects for export...")
                        # As last resort, try to export the original objects
                        rs.SelectObjects(non_meshes)
                        mesh_objs.extend(non_meshes)
                        
            except Exception as e:
                print(f"  Mesh conversion error: {e}")
                print("  Using original objects for export...")
                rs.SelectObjects(non_meshes)
                mesh_objs.extend(non_meshes)
        
        if not mesh_objs:
            print(f"  No exportable objects for layer '{layer}', skipping...")
            rs.UnselectAllObjects()
            continue
        
        # Select all objects to export
        rs.UnselectAllObjects()
        rs.SelectObjects(mesh_objs)
        
        # First, verify objects are still selected
        currently_selected = rs.SelectedObjects()
        print(f"  About to export {len(currently_selected)} selected objects")
        
        if not currently_selected:
            print("  ❌ No objects selected for export!")
            rs.UnselectAllObjects()
            continue
        
        # Try a quick export first without isolation
        layer_export_name = sanitize_filename(layer)
        filename = os.path.abspath(os.path.join(export_path, layer_export_name + ".glb"))
        print(f"  Exporting {len(mesh_objs)} objects to: {filename}")
        
        # Try multiple export approaches
        export_success = False
        
        # Method 1: Try standard export with GLB format
        print("  Attempting GLB export...")
        export_command = '_-Export "{}" _SaveSmall=No _Enter _Enter'.format(filename.replace('\\', '/'))
        export_result = rs.Command(export_command, echo=False)
        print(f"  Export command result: {export_result}")
        
        # Wait for export to complete
        time.sleep(0.5)
        
        # Check if file was created at expected location
        if not os.path.exists(filename):
            # Search for the file in parent directories
            base_filename = os.path.basename(filename)
            parent_dir = os.path.dirname(export_path)
            
            print(f"  File not found at expected location")
            print(f"  Searching for: {base_filename}")
            
            found_path = None
            # Search up to 3 directory levels
            search_dirs = [parent_dir, os.path.dirname(parent_dir)]
            
            for search_dir in search_dirs:
                if not os.path.exists(search_dir):
                    continue
                    
                for root, dirs, files in os.walk(search_dir):
                    if base_filename in files:
                        found_path = os.path.join(root, base_filename)
                        print(f"  Found file at: {found_path}")
                        break
                
                if found_path:
                    break
            
            # Move file to correct location if found
            if found_path:
                try:
                    shutil.move(found_path, filename)
                    print(f"  Moved file to correct location")
                except Exception as e:
                    print(f"  Could not move file: {e}")
                    # If move fails, at least note where it is
                    filename = found_path
        
        # Clean up backup file
        backup_file = filename.replace('.glb', '.glbbak')
        if os.path.exists(backup_file):
            try:
                os.remove(backup_file)
                print("  Removed backup file")
            except:
                pass
        
        if os.path.exists(filename):
            export_method = "standard"
        else:
            # Method 2: Try with explicit GLB format specification
            print("  Standard export failed, trying with explicit GLB format...")
            export_command2 = '_-Export "{}" _SaveSmall=No _glTF2Binary _Enter'.format(filename.replace('\\', '/'))
            export_result2 = rs.Command(export_command2, echo=False)
            print(f"  GLB export command result: {export_result2}")
            
            time.sleep(0.5)
            
            # Search for file again if not found
            if not os.path.exists(filename):
                base_filename = os.path.basename(filename)
                parent_dir = os.path.dirname(export_path)
                
                print(f"  File not found at expected location")
                print(f"  Searching for: {base_filename}")
                
                found_path = None
                search_dirs = [parent_dir, os.path.dirname(parent_dir)]
                
                for search_dir in search_dirs:
                    if not os.path.exists(search_dir):
                        continue
                        
                    for root, dirs, files in os.walk(search_dir):
                        if base_filename in files:
                            found_path = os.path.join(root, base_filename)
                            print(f"  Found file at: {found_path}")
                            break
                    
                    if found_path:
                        break
                
                if found_path:
                    try:
                        shutil.move(found_path, filename)
                        print(f"  Moved file to correct location")
                    except Exception as e:
                        print(f"  Could not move file: {e}")
                        filename = found_path
            
            # Clean up backup file if created
            backup_file = filename.replace('.glb', '.glbbak')
            if os.path.exists(backup_file):
                try:
                    os.remove(backup_file)
                except:
                    pass
            
            if os.path.exists(filename):
                export_method = "glb_explicit"

        if os.path.exists(filename):
            file_size = os.path.getsize(filename)
            export_success = True
            print(f"  ✅ Successfully exported with {export_method}: {os.path.basename(filename)} ({file_size} bytes)")
            # Add to manifest with bounding box info
            manifest["exported_layers"].append({
                "layer_name": layer,
                "filename": os.path.basename(filename),
                "file_size": file_size,
                "object_count": len(mesh_objs),
                "bounding_box": bbox_info,
                "export_method": export_method,
                "notes": ""
            })
        
        if not export_success:
            print(f"  ❌ All export methods failed for layer: {layer}")
            manifest["failed_layers"].append({
                "layer_name": layer,
                "object_count": len(mesh_objs) if mesh_objs else 0,
                "bounding_box": bbox_info,
                "export_method": "failed",
                "notes": "Export failed - no file created"
            })
            # List what we tried to export
            for obj in currently_selected:
                obj_type = rs.ObjectType(obj)
                print(f"    - Object type {obj_type}: {rs.ObjectDescription(obj)}")
        
        # Clean up only if we created new mesh objects
        newly_created = [obj for obj in mesh_objs if obj not in objs]
        if newly_created:
            print(f"  Cleaning up {len(newly_created)} temporary mesh objects")
            try:
                rs.DeleteObjects(newly_created)
            except Exception as e:
                print(f"  Warning: Could not clean up temporary objects: {e}")
        
        # Force garbage collection to free memory
        import gc
        gc.collect()
        
        # Final cleanup for this iteration
        rs.UnselectAllObjects()
        rs.Redraw()
        
        # Add a small delay between layers to prevent overwhelming the system
        time.sleep(0.1)
    
    # Final cleanup
    rs.UnselectAllObjects()
    rs.Redraw()
    
    # Create and save manifest
    manifest_filename = os.path.join(export_path, "export_manifest.json")

    manifest["export_info"]["timestamp_end"] = time.strftime("%Y-%m-%d %H:%M:%S")

    # Add unit info
    manifest["export_info"]["bounding_box_units"] = {
        "id": rs.UnitSystem(),
        "name":  rs.UnitSystemName(abbreviate=False)
    }  
    
    # Add summary statistics
    manifest["export_info"]["successful_exports"] = len(manifest["exported_layers"])
    manifest["export_info"]["failed_exports"] = len(manifest["failed_layers"])
    manifest["export_info"]["skipped_exports"] = len(manifest["skipped_layers"])
    manifest["export_info"]["total_file_size"] = sum(layer["file_size"] for layer in manifest["exported_layers"])
    
    try:
        with open(manifest_filename, 'w') as f:
            json.dump(manifest, f, indent=2)
        print(f"\n📄 Manifest saved: {manifest_filename}")
    except Exception as e:
        print(f"⚠️  Failed to save manifest: {e}")

    # Final cleanup of any remaining backup files
    print("\nCleaning up backup files...")
    for root, dirs, files in os.walk(export_path):
        for file in files:
            if file.endswith('.glbbak'):
                backup_path = os.path.join(root, file)
                try:
                    os.remove(backup_path)
                    print(f"  Removed: {file}")
                except Exception as e:
                    print(f"  Could not remove {file}: {e}")
    
    print("✅ GLB export completed.")

if __name__ == '__main__':
    export_all_layers_to_glb()
