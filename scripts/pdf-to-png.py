from pdf2image import convert_from_path
import os
import glob
import json
from datetime import datetime

def convert_pdf_to_png(pdf_path, output_folder="output_images", dpi=200):
    """
    Converts a PDF file into a series of PNG images, one for each page.
    Returns a list of dictionaries containing file info and dimensions.

    Args:
        pdf_path (str): The path to the input PDF file.
        output_folder (str): The directory to save the output PNG images.
        dpi (int): The resolution (dots per inch) for the output images.
                   Higher DPI results in better quality but larger file sizes.
    
    Returns:
        list: List of dictionaries with file information, or None if conversion failed.
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    try:
        # Convert PDF pages to PIL Image objects
        images = convert_from_path(pdf_path, dpi=dpi)

        # Get the base name of the PDF file for naming output images
        pdf_base_name = os.path.splitext(os.path.basename(pdf_path))[0]

        file_info_list = []
        
        # Save each image as a separate PNG file
        for i, image in enumerate(images):
            output_filename = os.path.join(output_folder, f"{pdf_base_name}_page_{i+1}.png")
            image.save(output_filename, "PNG")
            
            # Get image dimensions
            width, height = image.size
            
            # Get file size
            file_size = os.path.getsize(output_filename)
            
            # Create file info dictionary
            file_info = {
                "filename": os.path.basename(output_filename),
                "rel_path": os.path.relpath(output_filename).replace('../frontend/public', ''),
                "source_pdf": os.path.basename(pdf_path),
                "page_number": i + 1,
                "width": width,
                "height": height,
                "file_size_bytes": file_size,
                "dpi": dpi
            }
            
            file_info_list.append(file_info)
            print(f"Saved: {output_filename} ({width}x{height})")

        return file_info_list

    except Exception as e:
        print(f"Error converting {pdf_path}: {e}")
        return None

def convert_all_pdfs_in_directory(input_directory, output_folder="output_images", dpi=200):
    """
    Converts all PDF files in a directory to PNG images and generates a manifest file.

    Args:
        input_directory (str): The directory containing PDF files to convert.
        output_folder (str): The directory to save the output PNG images.
        dpi (int): The resolution for the output images.
    """
    # Find all PDF files in the directory
    pdf_files = glob.glob(os.path.join(input_directory, "*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in directory: {input_directory}")
        return
    
    print(f"Found {len(pdf_files)} PDF files to convert:")
    for pdf_file in pdf_files:
        print(f"  - {os.path.basename(pdf_file)}")
    
    # Convert each PDF file and collect manifest data
    successful_conversions = 0
    failed_conversions = 0
    all_files_info = []
    
    for pdf_file in pdf_files:
        print(f"\nConverting: {os.path.basename(pdf_file)}")
        file_info_list = convert_pdf_to_png(pdf_file, output_folder, dpi)
        
        if file_info_list:
            successful_conversions += 1
            all_files_info.extend(file_info_list)
        else:
            failed_conversions += 1
    
    # Generate manifest file
    if all_files_info:
        manifest_data = {
            "conversion_info": {
                "timestamp": datetime.now().isoformat(),
                "input_directory": os.path.relpath(input_directory),
                "output_directory": os.path.relpath(output_folder),
                "dpi": dpi,
                "total_pdfs_processed": len(pdf_files),
                "successful_conversions": successful_conversions,
                "failed_conversions": failed_conversions,
                "total_images_created": len(all_files_info)
            },
            "files": all_files_info,
            "summary_statistics": {
                "total_images": len(all_files_info),
                "unique_dimensions": list(set((info["width"], info["height"]) for info in all_files_info)),
                "total_file_size_bytes": sum(info["file_size_bytes"] for info in all_files_info),
                "average_width": sum(info["width"] for info in all_files_info) / len(all_files_info) if all_files_info else 0,
                "average_height": sum(info["height"] for info in all_files_info) / len(all_files_info) if all_files_info else 0
            }
        }
        
        manifest_path = os.path.join(output_folder, "conversion_manifest.json")
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        
        print(f"\nManifest saved to: {manifest_path}")
        print(f"Total images created: {len(all_files_info)}")
        
        # Print summary of dimensions
        unique_dimensions = manifest_data["summary_statistics"]["unique_dimensions"]
        print(f"Unique dimensions found: {len(unique_dimensions)}")
        for width, height in unique_dimensions:
            count = sum(1 for info in all_files_info if info["width"] == width and info["height"] == height)
            print(f"  - {width}x{height}: {count} images")
    
    print(f"\nConversion complete!")
    print(f"Successfully converted: {successful_conversions} files")
    if failed_conversions > 0:
        print(f"Failed conversions: {failed_conversions} files")

if __name__ == "__main__":
    # Configuration
    input_directory = "./../frontend/public/drawings"  # Current directory - change this to your target directory
    output_directory = input_directory + "/output_images"  # Where to save the PNG files
    image_dpi = 200  # Image quality (higher = better quality, larger files)
    
    convert_all_pdfs_in_directory(input_directory, output_directory, image_dpi)
