import rhinoscriptsyntax as rs
import os
import re
import time
import json

def sanitize_filename(name):
    return re.sub(r'[<>:"/\\|?*]#', '_', name)

def export_all_layers_to_glb():
    # Clear any existing selections first
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
    
    # Initialize manifest data
    manifest = {
        "exported_layers": [],
        "export_info": {
            "total_layers_found": len(layers),
            "export_path": export_path,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "format": "GLB"
        }
    }
    
    for i, layer in enumerate(layers):
        print(f"Processing layer {i+1}/{len(layers)}: {layer}")
        
        # Skip layers with "CL" or "baseline" in the name
        if "CL" in layer or "baseline" in layer.lower() or "CTR DECK TRACKS" in layer:
            print(f"  Skipping layer '{layer}' (contains CL or baseline)")
            manifest["exported_layers"].append({
                "layer_name": layer,
                "filename": "",
                "file_size": 0,
                "object_count": 0,
                "export_method": "skipped",
                "notes": "Skipped - contains CL or baseline or CTR DECK TRACKS"
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
        
        # Check object types
        obj_types = [rs.ObjectType(obj) for obj in objs]
        print(f"  Object types: {set(obj_types)}")
        
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
        filename = os.path.join(export_path, layer_export_name + ".glb")
        
        print(f"  Exporting {len(mesh_objs)} objects to: {filename}")
        
        # Try multiple export approaches
        export_success = False
        
        # Method 1: Try standard export with GLB format
        print("  Attempting GLB export...")
        export_command = f'_-Export "{filename}" _SaveSmall=No _Enter _Enter'
        export_result = rs.Command(export_command, echo=False)
        print(f"  Export command result: {export_result}")
        
        # Wait for export to complete
        time.sleep(0.5)
        
        # Check if file was created (and clean up any backup files)
        backup_file = filename + "bak"
        if os.path.exists(backup_file):
            try:
                os.remove(backup_file)
                print("  Removed backup file")
            except:
                pass
        
        if os.path.exists(filename):
            file_size = os.path.getsize(filename)
            print(f"  ✅ Successfully exported: {os.path.basename(filename)} ({file_size} bytes)")
            export_success = True
            # Add to manifest
            manifest["exported_layers"].append({
                "layer_name": layer,
                "filename": os.path.basename(filename),
                "file_size": file_size,
                "object_count": len(mesh_objs),
                "export_method": "standard",
                "notes": ""
            })
        else:
            # Method 2: Try with explicit GLB format specification
            print("  Standard export failed, trying with explicit GLB format...")
            export_command2 = f'_-Export "{filename}" _SaveSmall=No _glTF2Binary _Enter'
            export_result2 = rs.Command(export_command2, echo=False)
            print(f"  GLB export command result: {export_result2}")
            
            time.sleep(0.5)
            
            # Clean up backup file if created
            if os.path.exists(backup_file):
                try:
                    os.remove(backup_file)
                except:
                    pass
            
            if os.path.exists(filename):
                file_size = os.path.getsize(filename)
                print(f"  ✅ Successfully exported with GLB format: {os.path.basename(filename)} ({file_size} bytes)")
                export_success = True
                # Add to manifest
                manifest["exported_layers"].append({
                    "layer_name": layer,
                    "filename": os.path.basename(filename),
                    "file_size": file_size,
                    "object_count": len(mesh_objs),
                    "export_method": "glb_explicit",
                    "notes": ""
                })
            else:
                # Method 3: Try saving as .3dm first, then export
                print("  GLB export failed, trying .3dm intermediate...")
                temp_3dm = filename.replace('.glb', '_temp.3dm')
                
                # Save selection as 3dm
                save_command = f'_-SaveAs "{temp_3dm}" _Enter'
                save_result = rs.Command(save_command, echo=False)
                print(f"  Save 3dm result: {save_result}")
                
                if os.path.exists(temp_3dm):
                    # Try to export the 3dm to GLB
                    rs.Command(f'_-Open "{temp_3dm}" _Enter', echo=False)
                    rs.Command('_SelAll', echo=False)
                    time.sleep(0.2)
                    
                    export_result3 = rs.Command(f'_-Export "{filename}" _Enter _Enter', echo=False)
                    time.sleep(0.5)
                    
                    # Clean up temp file
                    try:
                        os.remove(temp_3dm)
                    except:
                        pass
                    
                    if os.path.exists(filename):
                        file_size = os.path.getsize(filename)
                        print(f"  ✅ Successfully exported via 3dm: {os.path.basename(filename)} ({file_size} bytes)")
                        export_success = True
                        # Add to manifest
                        manifest["exported_layers"].append({
                            "layer_name": layer,
                            "filename": os.path.basename(filename),
                            "file_size": file_size,
                            "object_count": len(mesh_objs),
                            "export_method": "3dm_intermediate",
                            "notes": ""
                        })
        
        if not export_success:
            print(f"  ❌ All export methods failed for layer: {layer}")
            # Add failed export to manifest
            manifest["exported_layers"].append({
                "layer_name": layer,
                "filename": "",
                "file_size": 0,
                "object_count": len(mesh_objs) if mesh_objs else 0,
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
    
    # Add summary statistics
    successful_exports = [layer for layer in manifest["exported_layers"] if layer["export_method"] in ["standard", "glb_explicit", "3dm_intermediate"]]
    failed_exports = [layer for layer in manifest["exported_layers"] if layer["export_method"] == "failed"]
    skipped_exports = [layer for layer in manifest["exported_layers"] if layer["export_method"] == "skipped"]
    
    manifest["export_info"]["successful_exports"] = len(successful_exports)
    manifest["export_info"]["failed_exports"] = len(failed_exports)
    manifest["export_info"]["skipped_exports"] = len(skipped_exports)
    manifest["export_info"]["total_file_size"] = sum(layer["file_size"] for layer in successful_exports)
    
    try:
        with open(manifest_filename, 'w') as f:
            json.dump(manifest, f, indent=2)
        print(f"\n📄 Manifest saved: {manifest_filename}")
        print(f"✅ Successfully exported: {len(successful_exports)} layers")
        print(f"⏭️  Skipped: {len(skipped_exports)} layers")
        if failed_exports:
            print(f"❌ Failed exports: {len(failed_exports)} layers")
        print(f"💾 Total file size: {manifest['export_info']['total_file_size']} bytes")
    except Exception as e:
        print(f"⚠️  Failed to save manifest: {e}")
    
    print("✅ GLB export completed.")

if __name__ == '__main__':
    export_all_layers_to_glb()
