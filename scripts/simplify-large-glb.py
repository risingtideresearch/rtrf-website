#!/usr/bin/env python3
#!/usr/bin/env python3
"""
GLB File Simplification Script
Reduces polygon count of GLB files above a certain size threshold using PyVista's fast-simplification
Based on: https://github.com/pyvista/fast-simplification
"""

import os
import sys
from pathlib import Path
import trimesh
import numpy as np
import pyvista as pv
import fast_simplification

def check_requirements():
    """Check if required packages are available"""
    try:
        import trimesh
        import pyvista as pv
        import fast_simplification
        return True
    except ImportError as e:
        print(f"Error: Missing required package: {e}")
        print("Please install the required packages:")
        print("  pip install trimesh pyvista")
        print("  pip install git+https://github.com/pyvista/fast-simplification")
        return False

def get_file_size_mb(filepath):
    """Get file size in megabytes"""
    return os.path.getsize(filepath) / (1024 * 1024)

def simplify_mesh(mesh, target_ratio=0.6):
    """
    Simplify a mesh using PyVista's fast-simplification
    
    Args:
        mesh: trimesh.Trimesh object
        target_ratio: Target reduction ratio (0.5 = 50% of original triangles)
    
    Returns:
        Simplified trimesh.Trimesh object
    """
    try:
        
        # Convert trimesh to PyVista mesh
        vertices = mesh.vertices
        faces = mesh.faces
        
        # PyVista expects faces in a specific format: [n_points, p0, p1, p2, n_points, p3, p4, p5, ...]
        pv_faces = []
        for face in faces:
            pv_faces.extend([3, face[0], face[1], face[2]])
        
        # Create PyVista mesh
        pv_mesh = pv.PolyData(vertices, pv_faces)
        
        # Use n_cells instead of deprecated n_faces
        original_face_count = pv_mesh.n_cells
        target_face_count = int(original_face_count * target_ratio)
        
        print(f"    Original faces: {original_face_count:,}")
        print(f"    Target faces: {target_face_count:,}")
        
        # Perform simplification using fast_simplification
        # target_reduction is the fraction to remove (0.5 means remove 50%, keep 50%)
        reduction_fraction = 1.0 - target_ratio
        simplified_mesh = fast_simplification.simplify_mesh(
            pv_mesh, target_reduction=reduction_fraction, verbose=True
        )
        
        # Convert back to trimesh
        vertices = simplified_mesh.points
        faces = simplified_mesh.faces.reshape(-1, 4)[:, 1:4]  # Remove the first column (which is always 3)
        
        # Create new trimesh
        simplified_trimesh = trimesh.Trimesh(
            vertices=vertices,
            faces=faces
        )
        
        # Copy visual properties if they exist
        if hasattr(mesh.visual, 'vertex_colors') and mesh.visual.vertex_colors is not None:
            # For vertex colors, we need to handle the reduced vertex count
            if len(vertices) <= len(mesh.visual.vertex_colors):
                simplified_trimesh.visual.vertex_colors = mesh.visual.vertex_colors[:len(vertices)]
        
        if hasattr(mesh.visual, 'face_colors') and mesh.visual.face_colors is not None:
            # For face colors, handle reduced face count
            if len(faces) <= len(mesh.visual.face_colors):
                simplified_trimesh.visual.face_colors = mesh.visual.face_colors[:len(faces)]
        
        # Copy material if it exists
        if hasattr(mesh.visual, 'material'):
            simplified_trimesh.visual.material = mesh.visual.material
        
        print(f"    Final faces: {len(faces):,}")
        return simplified_trimesh
        
    except Exception as e:
        print(f"    Error during simplification: {e}")
        return mesh

def process_glb_file(filepath, size_threshold_mb=1.8, target_ratio=0.6, backup=True):
    """
    Process a single GLB file
    
    Args:
        filepath: Path to GLB file
        size_threshold_mb: Size threshold in MB above which to simplify
        target_ratio: Target reduction ratio
        backup: Whether to create backup of original file
    """
    file_size = get_file_size_mb(filepath)
    
    print(f"\nProcessing: {filepath}")
    print(f"File size: {file_size:.2f} MB")
    
    if file_size <= size_threshold_mb:
        print(f"Skipping - file size below threshold ({size_threshold_mb} MB)")
        return
    
    try:
        # Load the GLB file
        print("Loading mesh...")
        scene = trimesh.load(filepath)
        
        # Handle different scene types
        if isinstance(scene, trimesh.Scene):
            # If it's a scene with multiple meshes, process each mesh
            meshes = []
            for name, mesh in scene.geometry.items():
                if isinstance(mesh, trimesh.Trimesh):
                    print(f"  Simplifying mesh: {name}")
                    simplified_mesh = simplify_mesh(mesh, target_ratio)
                    meshes.append(simplified_mesh)
            
            if meshes:
                # Combine all meshes
                combined_mesh = trimesh.util.concatenate(meshes)
                scene = trimesh.Scene([combined_mesh])
            
        elif isinstance(scene, trimesh.Trimesh):
            # Single mesh
            print("  Simplifying mesh...")
            scene = simplify_mesh(scene, target_ratio)
        
        # Create backup if requested
        if backup:
            backup_path = filepath.with_suffix('.glb.backup')
            if not backup_path.exists():
                print(f"Creating backup: {backup_path}")
                import shutil
                shutil.copy2(filepath, backup_path)
        
        # Export simplified mesh
        print("Exporting simplified mesh...")
        scene.export(str(filepath))
        
        # Check new file size
        new_size = get_file_size_mb(filepath)
        reduction = ((file_size - new_size) / file_size) * 100
        
        print(f"New file size: {new_size:.2f} MB")
        print(f"Size reduction: {reduction:.1f}%")
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def process_directory(directory_path, size_threshold_mb=1.8, target_ratio=0.6, backup=True):
    """
    Process all GLB files in a directory
    
    Args:
        directory_path: Path to directory containing GLB files
        size_threshold_mb: Size threshold in MB above which to simplify
        target_ratio: Target reduction ratio (0.1 to 1.0)
        backup: Whether to create backups of original files
    """
    directory = Path(directory_path)
    
    if not directory.exists():
        print(f"Error: Directory '{directory}' does not exist")
        return
    
    # Find all GLB files
    glb_files = list(directory.glob("*.glb")) + list(directory.glob("*.GLB"))
    
    if not glb_files:
        print(f"No GLB files found in '{directory}'")
        return
    
    print(f"Found {len(glb_files)} GLB file(s) in '{directory}'")
    print(f"Size threshold: {size_threshold_mb} MB")
    print(f"Target reduction ratio: {target_ratio}")
    print(f"Backup original files: {backup}")
    
    # Process each file
    processed_count = 0
    for glb_file in glb_files:
        try:
            file_size = get_file_size_mb(glb_file)
            if file_size > size_threshold_mb:
                process_glb_file(glb_file, size_threshold_mb, target_ratio, backup)
                processed_count += 1
        except Exception as e:
            print(f"Error with {glb_file}: {e}")
    
    print(f"\nCompleted processing {processed_count} files above size threshold")

def main():
    """Main function with command line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Simplify GLB files above a certain size threshold",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    parser.add_argument(
        "--size-threshold",
        type=float,
        default=1.8,
        help="Size threshold in MB above which to simplify files"
    )
    
    parser.add_argument(
        "--target-ratio",
        type=float,
        default=0.6,
        help="Target reduction ratio (0.1 = keep 10%% of triangles, 0.5 = keep 50%%)"
    )
    
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Don't create backup files"
    )
    
    args = parser.parse_args()
    
    # Validate target ratio
    if not 0.1 <= args.target_ratio <= 1.0:
        print("Error: target-ratio must be between 0.1 and 1.0")
        return
    
    # Check requirements
    if not check_requirements():
        return
    
    directory = './../frontend/public/models'
    
    # Process directory
    process_directory(
        directory_path=directory,
        size_threshold_mb=args.size_threshold,
        target_ratio=args.target_ratio,
        backup=not args.no_backup
    )

if __name__ == "__main__":
    main()
