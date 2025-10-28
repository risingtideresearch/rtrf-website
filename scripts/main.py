from material_extractor import create_material_index
from pdf_to_png import convert_all_pdfs
import shutil
import os

if __name__ == "__main__":
    folder_path = '../frontend/public/models'
    output_json = '../frontend/public/script-output/material_index_simple.json'
    
    create_material_index(folder_path, output_json)
    
    # copy files to sanity 
    model_manifest_path = folder_path + '/export_manifest.json'
    drawing_manifest_path = '../frontend/public/drawings/output_images/conversion_manifest.json'
    sanity_output_path = '../studio/script_output/'
    
    # Ensure sanity output directory exists
    os.makedirs(sanity_output_path, exist_ok=True)
    
    # Copy model manifest
    if os.path.exists(model_manifest_path):
        dest_path = os.path.join(sanity_output_path, 'model_export_manifest.json')
        shutil.copy2(model_manifest_path, dest_path)
        print(f"✅ Copied model manifest to: {dest_path}")
    else:
        print(f"⚠️  Model manifest not found: {model_manifest_path}")
    
    # convert drawings to pngs
    convert_all_pdfs()
    
    # Copy drawing manifest
    if os.path.exists(drawing_manifest_path):
        dest_path = os.path.join(sanity_output_path, 'drawing_conversion_manifest.json')
        shutil.copy2(drawing_manifest_path, dest_path)
        print(f"✅ Copied drawing manifest to: {dest_path}")
    else:
        print(f"⚠️  Drawing manifest not found: {drawing_manifest_path}")
    
    # Copy material index
    if os.path.exists(output_json):
        dest_path = os.path.join(sanity_output_path, 'material_index_simple.json')
        shutil.copy2(output_json, dest_path)
        print(f"✅ Copied material index to: {dest_path}")
    else:
        print(f"⚠️  Material index not found: {output_json}")
    
    print("\n✅ All manifests copied to Sanity output directory")
