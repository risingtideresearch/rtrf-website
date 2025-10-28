"""
Material extraction utilities for GLB files.
Provides functions to extract and index material information from 3D models.
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Set, Tuple, Optional


def extract_material_names(file_path: str) -> List[str]:
    """
    Extract material names from a GLB file.
    
    Args:
        file_path: Path to the GLB file
        
    Returns:
        List of material names. Returns ['Default_Material'] if no materials found.
        
    Raises:
        ImportError: If pygltflib is not installed
    """
    try:
        from pygltflib import GLTF2
        
        gltf = GLTF2.load(file_path)
        material_names = []
        
        if gltf.materials:
            for material in gltf.materials:
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
        
    except ImportError:
        raise ImportError("pygltflib is required. Install with: pip install pygltflib")
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return []


def get_glb_files(folder_path: str) -> List[Tuple[str, str]]:
    """
    Find all GLB files in a folder.
    
    Args:
        folder_path: Path to the folder to search
        
    Returns:
        List of tuples containing (filename, full_path)
    """
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"Folder not found: {folder_path}")
    
    glb_files = []
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path) and filename.lower().endswith('.glb'):
            glb_files.append((filename, file_path))
    
    return glb_files


def create_material_index(
    folder_path: str, 
    output_json: Optional[str] = None,
    verbose: bool = True
) -> Dict:
    """
    Create a material index from all GLB files in a folder.
    
    Args:
        folder_path: Path to folder containing GLB files
        output_json: Optional path to write JSON output. If None, no file is written.
        verbose: Whether to print progress messages
        
    Returns:
        Dictionary containing 'unique_materials', 'material_index', and 'materials_to_models'
        
    Example:
        >>> from material_extractor import create_material_index
        >>> index = create_material_index('./models', verbose=False)
        >>> print(index['unique_materials'])
        ['Default_Material', 'Metal', 'Wood']
        >>> print(index['materials_to_models']['Metal'])
        ['model1.glb', 'model3.glb']
    """
    # Find all GLB files
    glb_files = get_glb_files(folder_path)
    
    if not glb_files:
        if verbose:
            print("No GLB files found.")
        return {"unique_materials": [], "material_index": {}, "materials_to_models": {}}
    
    if verbose:
        print(f"Processing {len(glb_files)} GLB files...")
    
    # Build the material index (model -> materials)
    material_index = {}
    all_materials = set()
    
    # Build reverse index (material -> models)
    materials_to_models = {}
    
    for i, (filename, file_path) in enumerate(glb_files, 1):
        if verbose:
            print(f"Processing {i}/{len(glb_files)}: {filename}")
        material_names = extract_material_names(file_path)
        material_index[filename] = material_names
        all_materials.update(material_names)
        
        # Add to reverse index
        for material_name in material_names:
            if material_name not in materials_to_models:
                materials_to_models[material_name] = []
            materials_to_models[material_name].append(filename)
    
    # Sort the model lists for each material
    for material_name in materials_to_models:
        materials_to_models[material_name].sort()
    
    # Create output structure
    output = {
        "unique_materials": sorted(list(all_materials)),
        "material_index": material_index,
        "materials_to_models": materials_to_models
    }
    
    # Write to JSON if output path provided
    if output_json:
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        if verbose:
            print(f"\nMaterial index written to: {output_json}")
    
    if verbose:
        print(f"Total files: {len(material_index)}")
        print(f"Unique materials: {len(all_materials)}")
        print(f"Total material instances: {sum(len(materials) for materials in material_index.values())}")
        print(f"\nMaterial usage:")
        for material in sorted(all_materials):
            model_count = len(materials_to_models[material])
            print(f"  {material}: {model_count} model{'s' if model_count != 1 else ''}")
    
    return output


def get_materials_for_file(file_path: str) -> List[str]:
    """
    Convenience function to get materials for a single file.
    
    Args:
        file_path: Path to GLB file
        
    Returns:
        List of material names
    """
    return extract_material_names(file_path)


# Command-line interface
def main():
    """Command-line entry point"""
    folder_path = '../frontend/public/models'
    output_json = '../frontend/public/script-output/material_index_simple.json'
    
    create_material_index(folder_path, output_json)


if __name__ == "__main__":
    main()
