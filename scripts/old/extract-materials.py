import json
import os
from pathlib import Path
from collections import defaultdict
import hashlib
from datetime import datetime

def extract_materials(file_path):
    """Extract material information from GLB file"""
    try:
        from pygltflib import GLTF2
        
        gltf = GLTF2.load(file_path)
        
        materials_info = []
        
        if gltf.materials:
            for i, material in enumerate(gltf.materials):
                # Handle named vs unnamed materials
                material_name = getattr(material, 'name', None)
                if not material_name or material_name.strip() == '':
                    material_name = f'Material_{i}'
                    is_named = False
                else:
                    is_named = True
                
                material_info = {
                    'index': i,
                    'name': material_name,
                    'is_named': is_named,
                    'alpha_mode': getattr(material, 'alphaMode', 'OPAQUE'),
                    'alpha_cutoff': getattr(material, 'alphaCutoff', 0.5),
                    'double_sided': getattr(material, 'doubleSided', False),
                    'emissive_factor': getattr(material, 'emissiveFactor', [0, 0, 0]),
                    'pbr_metallic_roughness': None,
                    'has_textures': False,
                    'texture_types': [],
                    'texture_info': {}
                }
                
                # PBR Metallic Roughness
                if hasattr(material, 'pbrMetallicRoughness') and material.pbrMetallicRoughness:
                    pbr = material.pbrMetallicRoughness
                    material_info['pbr_metallic_roughness'] = {
                        'base_color_factor': getattr(pbr, 'baseColorFactor', [1, 1, 1, 1]),
                        'metallic_factor': getattr(pbr, 'metallicFactor', 1.0),
                        'roughness_factor': getattr(pbr, 'roughnessFactor', 1.0),
                        'has_base_color_texture': hasattr(pbr, 'baseColorTexture') and pbr.baseColorTexture is not None,
                        'has_metallic_roughness_texture': hasattr(pbr, 'metallicRoughnessTexture') and pbr.metallicRoughnessTexture is not None
                    }
                    
                    # Track texture information
                    if material_info['pbr_metallic_roughness']['has_base_color_texture']:
                        material_info['has_textures'] = True
                        material_info['texture_types'].append('base_color')
                        if pbr.baseColorTexture:
                            material_info['texture_info']['base_color'] = {
                                'texture_index': getattr(pbr.baseColorTexture, 'index', None),
                                'tex_coord': getattr(pbr.baseColorTexture, 'texCoord', 0)
                            }
                    
                    if material_info['pbr_metallic_roughness']['has_metallic_roughness_texture']:
                        material_info['has_textures'] = True
                        material_info['texture_types'].append('metallic_roughness')
                        if pbr.metallicRoughnessTexture:
                            material_info['texture_info']['metallic_roughness'] = {
                                'texture_index': getattr(pbr.metallicRoughnessTexture, 'index', None),
                                'tex_coord': getattr(pbr.metallicRoughnessTexture, 'texCoord', 0)
                            }
                
                # Other textures
                if hasattr(material, 'normalTexture') and material.normalTexture:
                    material_info['has_textures'] = True
                    material_info['texture_types'].append('normal')
                    material_info['texture_info']['normal'] = {
                        'texture_index': getattr(material.normalTexture, 'index', None),
                        'tex_coord': getattr(material.normalTexture, 'texCoord', 0),
                        'scale': getattr(material.normalTexture, 'scale', 1.0)
                    }
                
                if hasattr(material, 'occlusionTexture') and material.occlusionTexture:
                    material_info['has_textures'] = True
                    material_info['texture_types'].append('occlusion')
                    material_info['texture_info']['occlusion'] = {
                        'texture_index': getattr(material.occlusionTexture, 'index', None),
                        'tex_coord': getattr(material.occlusionTexture, 'texCoord', 0),
                        'strength': getattr(material.occlusionTexture, 'strength', 1.0)
                    }
                
                if hasattr(material, 'emissiveTexture') and material.emissiveTexture:
                    material_info['has_textures'] = True
                    material_info['texture_types'].append('emissive')
                    material_info['texture_info']['emissive'] = {
                        'texture_index': getattr(material.emissiveTexture, 'index', None),
                        'tex_coord': getattr(material.emissiveTexture, 'texCoord', 0)
                    }
                
                materials_info.append(material_info)
        
        # If no materials, return default material info
        if not materials_info:
            materials_info.append({
                'index': 0,
                'name': 'Default_Material',
                'is_named': False,
                'alpha_mode': 'OPAQUE',
                'alpha_cutoff': 0.5,
                'double_sided': False,
                'emissive_factor': [0, 0, 0],
                'pbr_metallic_roughness': {
                    'base_color_factor': [1, 1, 1, 1],
                    'metallic_factor': 1.0,
                    'roughness_factor': 1.0,
                    'has_base_color_texture': False,
                    'has_metallic_roughness_texture': False
                },
                'has_textures': False,
                'texture_types': [],
                'texture_info': {}
            })
        
        return materials_info
        
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return []

def categorize_material(material):
    """Enhanced material categorization"""
    categories = []
    
    # Named vs unnamed
    if material['is_named']:
        categories.append('named')
        # Check for common material names
        name_lower = material['name'].lower()
        if any(metal in name_lower for metal in ['aluminum', 'aluminium', 'steel', 'iron', 'copper', 'brass', 'bronze']):
            categories.append('metal')
        if any(wood in name_lower for wood in ['wood', 'timber', 'oak', 'pine', 'mahogany']):
            categories.append('wood')
        if any(plastic in name_lower for plastic in ['plastic', 'polymer', 'acrylic', 'vinyl']):
            categories.append('plastic')
        if any(glass in name_lower for glass in ['glass', 'crystal', 'transparent']):
            categories.append('glass')
        if any(fabric in name_lower for fabric in ['fabric', 'cloth', 'textile', 'leather']):
            categories.append('fabric')
    else:
        categories.append('unnamed')
    
    # Texture status
    if material['has_textures']:
        categories.append('textured')
    else:
        categories.append('untextured')
    
    # PBR properties
    if material['pbr_metallic_roughness']:
        pbr = material['pbr_metallic_roughness']
        
        # Color analysis
        base_color = pbr['base_color_factor']
        if base_color == [1, 1, 1, 1]:
            categories.append('white_base')
        elif all(c == base_color[0] for c in base_color[:3]):
            categories.append('grayscale')
        else:
            categories.append('colored')
        
        # Metallic properties
        metallic = pbr['metallic_factor']
        if metallic > 0.8:
            categories.append('highly_metallic')
        elif metallic > 0.5:
            categories.append('metallic')
        elif metallic > 0.2:
            categories.append('semi_metallic')
        else:
            categories.append('non_metallic')
        
        # Roughness properties
        roughness = pbr['roughness_factor']
        if roughness > 0.8:
            categories.append('very_rough')
        elif roughness > 0.5:
            categories.append('rough')
        elif roughness > 0.2:
            categories.append('medium_roughness')
        else:
            categories.append('smooth')
        
        # Transparency
        if base_color[3] < 1.0 or material['alpha_mode'] != 'OPAQUE':
            categories.append('transparent')
        else:
            categories.append('opaque')
    
    # Other properties
    if material['double_sided']:
        categories.append('double_sided')
    
    if any(f > 0 for f in material['emissive_factor']):
        categories.append('emissive')
    
    return categories

def create_material_signature(material):
    """Create a unique signature for material properties (excluding name and source)"""
    signature_data = {
        'alpha_mode': material['alpha_mode'],
        'alpha_cutoff': round(material['alpha_cutoff'], 3) if material['alpha_cutoff'] is not None else None,
        'double_sided': material['double_sided'],
        'emissive_factor': [round(f, 3) for f in material['emissive_factor']] if material['emissive_factor'] else [0, 0, 0],
        'has_textures': material['has_textures'],
        'texture_types': sorted(material['texture_types'])
    }
    
    if material['pbr_metallic_roughness']:
        pbr = material['pbr_metallic_roughness']
        signature_data['pbr'] = {
            'base_color_factor': [round(f, 3) for f in pbr['base_color_factor']],
            'metallic_factor': round(pbr['metallic_factor'], 3),
            'roughness_factor': round(pbr['roughness_factor'], 3),
            'has_base_color_texture': pbr['has_base_color_texture'],
            'has_metallic_roughness_texture': pbr['has_metallic_roughness_texture']
        }
    
    signature_str = json.dumps(signature_data, sort_keys=True)
    return hashlib.md5(signature_str.encode()).hexdigest()

def get_layer_name_from_filename(filename):
    """Extract layer name from filename (remove .glb extension)"""
    return Path(filename).stem

def create_material_manifest(folder_path, output_json='material-manifest.json'):
    """Create a grouped material manifest with unique names and associated layers"""
    
    if not os.path.exists(folder_path):
        print(f"Error: Folder not found: {folder_path}")
        return
    
    glb_files = []
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path) and filename.lower().endswith('.glb'):
            glb_files.append(file_path)
    
    if not glb_files:
        print("No GLB files found.")
        return
    
    print(f"Creating grouped material manifest from {len(glb_files)} GLB files...")
    
    # Group materials by unique names
    grouped_materials = {}
    layer_count = 0
    total_material_instances = 0
    
    for i, file_path in enumerate(glb_files, 1):
        filename = Path(file_path).name
        layer_name = get_layer_name_from_filename(filename)
        layer_count += 1
        
        print(f"Processing {i}/{len(glb_files)}: {filename} (layer: {layer_name})")
        
        materials = extract_materials(file_path)
        total_material_instances += len(materials)
        
        for material in materials:
            material_name = material['name']
            
            # Create or update material group
            if material_name not in grouped_materials:
                # First time seeing this material name
                grouped_materials[material_name] = {
                    'name': material_name,
                    'is_named': material['is_named'],
                    'categories': categorize_material(material),
                    'properties': {
                        'alpha_mode': material['alpha_mode'],
                        'alpha_cutoff': material['alpha_cutoff'],
                        'double_sided': material['double_sided'],
                        'emissive_factor': material['emissive_factor'],
                        'has_textures': material['has_textures'],
                        'texture_types': material['texture_types'],
                        'texture_info': material['texture_info'],
                        'pbr_metallic_roughness': material['pbr_metallic_roughness']
                    },
                    'property_signature': create_material_signature(material),
                    'associated_layers': [],
                    'usage_count': 0,
                    'property_variations': []
                }
            
            # Add this layer to the material's associated layers
            layer_info = {
                'layer_name': layer_name,
                'filename': filename,
                'material_index': material['index']
            }
            
            # Check if this layer is already associated (avoid duplicates)
            if not any(layer['layer_name'] == layer_name for layer in grouped_materials[material_name]['associated_layers']):
                grouped_materials[material_name]['associated_layers'].append(layer_info)
            
            grouped_materials[material_name]['usage_count'] += 1
            
            # Track property variations (same name, different properties)
            current_signature = create_material_signature(material)
            if current_signature != grouped_materials[material_name]['property_signature']:
                variation_info = {
                    'signature': current_signature,
                    'layer_name': layer_name,
                    'filename': filename,
                    'properties_diff': 'Properties differ from base definition'
                }
                
                # Check if this variation already exists
                if not any(v['signature'] == current_signature for v in grouped_materials[material_name]['property_variations']):
                    grouped_materials[material_name]['property_variations'].append(variation_info)
    
    # Convert to sorted list
    materials_list = list(grouped_materials.values())
    materials_list.sort(key=lambda x: x['usage_count'], reverse=True)
    
    # Create summary statistics
    named_materials = len([m for m in materials_list if m['is_named']])
    unnamed_materials = len(materials_list) - named_materials
    textured_materials = len([m for m in materials_list if m['properties']['has_textures']])
    materials_with_variations = len([m for m in materials_list if m['property_variations']])
    
    # Category statistics
    category_counts = defaultdict(int)
    for material in materials_list:
        for category in material['categories']:
            category_counts[category] += 1
    
    # Layer distribution
    layer_distribution = {}
    for material in materials_list:
        for layer in material['associated_layers']:
            layer_name = layer['layer_name']
            if layer_name not in layer_distribution:
                layer_distribution[layer_name] = {
                    'filename': layer['filename'],
                    'material_count': 0,
                    'materials': []
                }
            layer_distribution[layer_name]['material_count'] += 1
            layer_distribution[layer_name]['materials'].append(material['name'])
    
    manifest = {
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'total_files_processed': len(glb_files),
            'total_layers_processed': layer_count,
            'script_version': '2.0 - Grouped by unique names'
        },
        'summary': {
            'unique_material_names': len(materials_list),
            'total_material_instances': total_material_instances,
            'named_materials': named_materials,
            'unnamed_materials': unnamed_materials,
            'textured_materials': textured_materials,
            'untextured_materials': len(materials_list) - textured_materials,
            'materials_with_property_variations': materials_with_variations,
            'total_layers': layer_count
        },
        'statistics': {
            'category_distribution': dict(sorted(category_counts.items(), key=lambda x: x[1], reverse=True)),
            'usage_frequency': {
                'most_used_materials': [(m['name'], m['usage_count']) for m in materials_list[:10]],
                'single_use_materials': len([m for m in materials_list if m['usage_count'] == 1]),
                'multi_use_materials': len([m for m in materials_list if m['usage_count'] > 1])
            }
        },
        'grouped_materials': materials_list,
        'layer_distribution': dict(sorted(layer_distribution.items(), key=lambda x: x[1]['material_count'], reverse=True))
    }
    
    # Write manifest
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"\nGrouped material manifest written to: {output_json}")
    print(f"Found {len(materials_list)} unique material names across {layer_count} layers:")
    print(f"  - {named_materials} named materials")
    print(f"  - {unnamed_materials} unnamed materials")
    print(f"  - {textured_materials} with textures")
    print(f"  - {materials_with_variations} materials with property variations")
    print(f"  - {total_material_instances} total material instances")

if __name__ == "__main__":
    folder_path = '../frontend/public/models'
    output_json = '../frontend/public/script-output/material_index.json'
    
    create_material_manifest(folder_path, output_json)
