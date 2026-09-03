from extract_materials import create_material_index
from pdf_to_png import convert_all_pdfs
import shutil
import json
import os
import sys
import subprocess
import argparse

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Process 3D models and drawings')
    parser.add_argument('--skip-pdf', action='store_true',
                        help='Skip PDF conversion and only process models')
    parser.add_argument('--skip-audit', action='store_true',
                        help='Skip Sanity reference audit')
    parser.add_argument('--full-pdf', action='store_true',
                        help='Clear output directory and reconvert all PDFs (default: skip unchanged)')
    args = parser.parse_args()

    manifest_dir = '../frontend/public/models'
    model_manifest_path = manifest_dir + '/export_manifest.json'
    battery_manifest_path = '../frontend/public/models-battery/export_manifest.json'
    output_json = '../frontend/public/script-output/material_index_simple.json'

    def resolve_models_folder(manifest_path, default):
        """Versioned GLB folder a manifest points at, or None if absent."""
        if not os.path.exists(manifest_path):
            return None
        with open(manifest_path) as f:
            manifest = json.load(f)
        return '../frontend/public/' + manifest['export_info'].get('models_folder', default)

    # Only the Rhino models carry material names. STEP files record colors but
    # no material identity, so the battery modules are deliberately left out of
    # the index rather than have one inferred for them.
    folder_path = resolve_models_folder(model_manifest_path, 'models')
    create_material_index(folder_path, output_json)

    # copy files to sanity
    drawing_manifest_path = '../frontend/public/drawings/output_images/conversion_manifest.json'
    sanity_output_path = '../studio/script_output/'
    
    # Ensure sanity output directory exists
    os.makedirs(sanity_output_path, exist_ok=True)
    
    # Copy model manifests — ModelDropdownInput builds its options from these
    for src, name in (
        (model_manifest_path, 'model_export_manifest.json'),
        (battery_manifest_path, 'model_battery_export_manifest.json'),
    ):
        if os.path.exists(src):
            dest_path = os.path.join(sanity_output_path, name)
            shutil.copy2(src, dest_path)
            print(f"✅ Copied model manifest to: {dest_path}")
        else:
            print(f"⚠️  Model manifest not found: {src}")
    
    # Convert drawings to pngs (skip if flag is set)
    if not args.skip_pdf:
        convert_all_pdfs(clear_output=args.full_pdf)
        
        # Copy drawing manifest
        if os.path.exists(drawing_manifest_path):
            dest_path = os.path.join(sanity_output_path, 'drawing_conversion_manifest.json')
            shutil.copy2(drawing_manifest_path, dest_path)
            print(f"✅ Copied drawing manifest to: {dest_path}")
        else:
            print(f"⚠️  Drawing manifest not found: {drawing_manifest_path}")
    else:
        print("⏭️  Skipping PDF conversion (--skip-pdf flag set)")
    
    # Copy material index
    if os.path.exists(output_json):
        dest_path = os.path.join(sanity_output_path, 'material_index_simple.json')
        shutil.copy2(output_json, dest_path)
        print(f"✅ Copied material index to: {dest_path}")
    else:
        print(f"⚠️  Material index not found: {output_json}")
    
    print("\n✅ All manifests copied to Sanity output directory")

    # Audit Sanity references against local manifests
    if not args.skip_audit:
        print("\n")
        audit_script = os.path.join(os.path.dirname(__file__), 'audit-sanity-refs.py')
        subprocess.run([sys.executable, audit_script])
    else:
        print("⏭️  Skipping Sanity audit (--skip-audit flag set)")
