import rhinoscriptsyntax as rs
import os
import re

def sanitize_filename(name):
    return re.sub(r'[<>:"/\\|?*]', '_', name)

def export_all_layers_to_gltf():
    export_path = rs.BrowseForFolder(rs.WorkingFolder(), 'Destination', 'Export gltf')
    if not export_path:
        print("Export path not selected.")
        return

    layers = rs.LayerNames()
    if not layers:
        print("No layers found.")
        return

    for layer in layers:
        objs = rs.ObjectsByLayer(layer)
        if not objs:
            continue

        # Select and mesh the objects via Rhino command
        rs.UnselectAllObjects()
        rs.SelectObjects(objs)

        # Run the mesh command (uses Rhino's mesh dialog defaults)
        rs.Command("_-Mesh _Enter _Enter", echo=False)

        # Collect all mesh objects just created (they are now selected)
        mesh_objs = rs.SelectedObjects()
        if not mesh_objs:
            continue

        # Export mesh to glTF
        rs.UnselectAllObjects()
        rs.SelectObjects(mesh_objs)

        layer_export_name = sanitize_filename(layer)
        filename = os.path.join(export_path, layer_export_name + ".gltf")
        rs.Command(f'-_Export "{filename}" _Enter _Enter', echo=False)

        # Delete temporary mesh objects
        rs.DeleteObjects(mesh_objs)

    print("✅ Export completed.")

if __name__ == '__main__':
    export_all_layers_to_gltf()
