import json
import struct
from pathlib import Path
import base64
import os
import numpy as np
import csv

def get_scene_size(file_path):
    """Get the overall scene size/dimensions from a GLB file"""
    
    try:
        import trimesh
        from pygltflib import GLTF2
        
        # Method 1: Using trimesh (most reliable for scene bounds)
        scene = trimesh.load(file_path)
        
        result = {
            'file_info': {
                'filename': Path(file_path).name,
                'file_size_mb': Path(file_path).stat().st_size / (1024 * 1024)
            },
            'scene_dimensions': None,
            'units': 'unknown',
            'mesh_count': 0,
            'total_geometry': {
                'vertices': 0,
                'triangles': 0
            }
        }
        
        # Get scene bounds
        if hasattr(scene, 'bounds') and scene.bounds is not None:
            bounds = scene.bounds
            size = bounds[1] - bounds[0]  # max - min
            
            result['scene_dimensions'] = {
                'width': float(size[0]),
                'height': float(size[1]), 
                'depth': float(size[2]),
                'min_corner': bounds[0].tolist(),
                'max_corner': bounds[1].tolist(),
                'center': scene.centroid.tolist() if hasattr(scene, 'centroid') else ((bounds[0] + bounds[1]) / 2).tolist(),
                'bounding_box_volume': float(np.prod(size)),
                'diagonal_length': float(np.linalg.norm(size)),
                'largest_dimension': float(np.max(size)),
                'smallest_dimension': float(np.min(size))
            }
        
        # Get mesh count and total geometry stats
        if hasattr(scene, 'geometry'):
            result['mesh_count'] = len(scene.geometry)
            
            total_vertices = 0
            total_faces = 0
            
            for mesh_name, mesh in scene.geometry.items():
                if hasattr(mesh, 'vertices'):
                    total_vertices += len(mesh.vertices)
                if hasattr(mesh, 'faces'):
                    total_faces += len(mesh.faces)
            
            result['total_geometry'] = {
                'vertices': total_vertices,
                'triangles': total_faces
            }
        
        # Try to determine units from metadata
        try:
            gltf_data = GLTF2.load(file_path)
            if hasattr(gltf_data, 'asset') and gltf_data.asset:
                # Check for unit extensions or hints in metadata
                if hasattr(gltf_data.asset, 'extras') and gltf_data.asset.extras:
                    extras = gltf_data.asset.extras
                    if isinstance(extras, dict):
                        result['units'] = extras.get('units', 'unknown')
        except:
            pass  # If GLTF loading fails, just keep units as unknown
            
        return result
        
    except ImportError as e:
        return {'error': f"Required library not installed: {e}"}
    except Exception as e:
        return {'error': f"Error analyzing GLB file: {e}"}

def analyze_scene_scale(scene_data):
    """Analyze what scale the scene might represent"""
    
    if not scene_data or 'error' in scene_data or not scene_data.get('scene_dimensions'):
        return 'unknown', 'unknown'
    
    dims = scene_data['scene_dimensions']
    max_dim = dims['largest_dimension']
    
    # Common 3D model scales
    scales = [
        (0.001, "microscopic", "millimeters"),
        (0.01, "millimeter", "millimeters"),
        (0.1, "centimeter", "centimeters"),
        (1.0, "decimeter", "meters"),
        (10.0, "meter", "meters"),
        (100.0, "building", "meters"),
        (1000.0, "city_block", "meters"),
        (float('inf'), "geographic", "unknown")
    ]
    
    scale_category = "unknown"
    likely_units = "unknown"
    
    for threshold, category, units in scales:
        if max_dim <= threshold:
            scale_category = category
            likely_units = units
            break
    
    # Better units guess
    if 0.01 <= max_dim <= 100:
        likely_units = "meters"
    elif 10 <= max_dim <= 10000:
        likely_units = "centimeters"
    elif 1000 <= max_dim <= 1000000:
        likely_units = "millimeters"
    
    return scale_category, likely_units

def write_to_csv(results, output_file='glb_analysis_results.csv'):
    """Write analysis results to CSV file"""
    
    fieldnames = [
        'filename',
        'file_size_mb',
        'width',
        'height', 
        'depth',
        'volume',
        'diagonal_length',
        'largest_dimension',
        'smallest_dimension',
        'center_x',
        'center_y',
        'center_z',
        'min_x',
        'min_y',
        'min_z',
        'max_x',
        'max_y',
        'max_z',
        'mesh_count',
        'total_vertices',
        'total_triangles',
        'units',
        'scale_category',
        'likely_units',
        'error'
    ]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for result in results:
            row = {}
            
            if 'error' in result:
                row['filename'] = result.get('filename', 'unknown')
                row['error'] = result['error']
                # Fill other fields with None/empty
                for field in fieldnames:
                    if field not in row:
                        row[field] = None
            else:
                # Basic file info
                row['filename'] = result['file_info']['filename']
                row['file_size_mb'] = round(result['file_info']['file_size_mb'], 3)
                
                # Scene dimensions
                if result['scene_dimensions']:
                    dims = result['scene_dimensions']
                    row['width'] = round(dims['width'], 6)
                    row['height'] = round(dims['height'], 6)
                    row['depth'] = round(dims['depth'], 6)
                    row['volume'] = round(dims['bounding_box_volume'], 9)
                    row['diagonal_length'] = round(dims['diagonal_length'], 6)
                    row['largest_dimension'] = round(dims['largest_dimension'], 6)
                    row['smallest_dimension'] = round(dims['smallest_dimension'], 6)
                    
                    # Center and bounds
                    row['center_x'] = round(dims['center'][0], 6)
                    row['center_y'] = round(dims['center'][1], 6)
                    row['center_z'] = round(dims['center'][2], 6)
                    row['min_x'] = round(dims['min_corner'][0], 6)
                    row['min_y'] = round(dims['min_corner'][1], 6)
                    row['min_z'] = round(dims['min_corner'][2], 6)
                    row['max_x'] = round(dims['max_corner'][0], 6)
                    row['max_y'] = round(dims['max_corner'][1], 6)
                    row['max_z'] = round(dims['max_corner'][2], 6)
                
                # Geometry info
                row['mesh_count'] = result['mesh_count']
                row['total_vertices'] = result['total_geometry']['vertices']
                row['total_triangles'] = result['total_geometry']['triangles']
                
                # Units and scale
                row['units'] = result['units']
                scale_category, likely_units = analyze_scene_scale(result)
                row['scale_category'] = scale_category
                row['likely_units'] = likely_units
                
                row['error'] = None
            
            writer.writerow(row)

if __name__ == "__main__":
    folder_path = '../frontend/public/models'
    output_csv = 'glb_analysis_results.csv'
    
    # Check if folder exists
    if not os.path.exists(folder_path):
        print(f"Error: Folder not found: {folder_path}")
        print("Please update the folder_path variable to point to your GLB files.")
        exit()
    
    glb_files = []
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        name, extension = os.path.splitext(filename)
        if os.path.isfile(file_path) and extension.lower() == '.glb':
            glb_files.append(file_path)
    
    if not glb_files:
        print("No GLB files found in the specified folder.")
        exit()
    
    print(f"Analyzing {len(glb_files)} GLB files...")
    
    results = []
    for i, file_path in enumerate(glb_files, 1):
        filename = os.path.basename(file_path)
        print(f"Processing {i}/{len(glb_files)}: {filename}")
        
        # Analyze the file
        scene_data = get_scene_size(file_path)
        if 'error' in scene_data:
            scene_data['filename'] = filename
        
        results.append(scene_data)
    
    # Write results to CSV
    write_to_csv(results, output_csv)
    print(f"\nResults written to: {output_csv}")
    print(f"Analyzed {len(results)} files successfully.")
