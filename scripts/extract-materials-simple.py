import json
import os
from pathlib import Path

def extract_material_names(file_path):
    """Extract material names from GLB file"""
    try:
        from pygltflib import GLTF2
        
        gltf = GLTF2.load(file_path)
        material_names = []
        
        if gltf.materials:
            for i, material in enumerate(gltf.materials):
                # Handle named vs unnamed materials
                material_name = getattr(material, 'name', None)
                if not material_name or material_name.strip() == '':
                    # Group all unnamed materials as "Default_Material"
                    material_name = 'Default_Material'
                material_names.append(material_name)
        else:
            # No materials found, use default
            material_names.append('Default_Material')
        
        return material_names
        
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return []

def create_simple_material_index(folder_path, output_json='material_index_simple.json'):
    """Create a simple filename: [material_names] dictionary"""
    
    if not os.path.exists(folder_path):
        print(f"Error: Folder not found: {folder_path}")
        return
    
    # Find all GLB files
    glb_files = []
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path) and filename.lower().endswith('.glb'):
            glb_files.append((filename, file_path))
    
    if not glb_files:
        print("No GLB files found.")
        return
    
    print(f"Processing {len(glb_files)} GLB files...")
    
    # Build the simple dictionary
    material_index = {}
    all_materials = set()
    
    for i, (filename, file_path) in enumerate(glb_files, 1):
        print(f"Processing {i}/{len(glb_files)}: {filename}")
        material_names = extract_material_names(file_path)
        material_index[filename] = material_names
        all_materials.update(material_names)
    
    # Create output with both the index and unique materials list
    output = {
        "unique_materials": sorted(list(all_materials)),
        "material_index": material_index
    }
    
    # Write to JSON
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nSimple material index written to: {output_json}")
    print(f"Total files: {len(material_index)}")
    print(f"Unique materials: {len(all_materials)}")
    print(f"Total material instances: {sum(len(materials) for materials in material_index.values())}")

if __name__ == "__main__":
    folder_path = '../frontend/public/models'
    output_json = '../frontend/public/script-output/material_index_simple.json'
    
    create_simple_material_index(folder_path, output_json)
