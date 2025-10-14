from pdf2image import convert_from_path
from PIL import Image
import os
import json
import shutil
import re
import hashlib
from datetime import datetime
from pathlib import Path
from pypdf import PdfReader


def extract_text_from_pdf(pdf_path):
    """
    Extracts all text from a given PDF file.

    Args:
        pdf_path (str): The path to the PDF file.

    Returns:
        str: The concatenated text from all pages of the PDF.
    """
    reader = PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text()
    return full_text

def parse_date(filename, full_text):
    """
    Parse date from filename or full_text. Supports various date formats.
    
    Args:
        filename (str): The filename to parse (without extension)
        full_text (str): Extracted text from file
    
    Returns:
        dict: Dictionary with parsed date info, or None if no date found
    """
    # Remove file extension if present
    name_without_ext = os.path.splitext(filename)[0]
    
    # Pattern to match date at end of file name
    date_patterns = [
        r'(\d{1,2})[-._](\d{1,2})[-._](\d{2})$',  # M-D-YY or MM-DD-YY format
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, name_without_ext)
        if match:
            month, day, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
            year += 2000
            
            source = "filename"
    
    # If no date found in filename, search full_text for mm/dd/yy format
    if full_text and not match:
        text_date_pattern = r'(\d{1,2})/(\d{1,2})/(\d{2})'
        match = re.search(text_date_pattern, full_text)
        if match:
            month, day, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
            year += 2000
            
            source = "full_text"
            
    if match:  
        # Validate date
        try:
            parsed_date = datetime(year, month, day)
            return {
                "raw_date_string": match.group(0),
                "date": parsed_date.strftime("%Y-%m-%d"),
                "date_iso": parsed_date.isoformat(),
                "year": year,
                "month": month,
                "day": day,
                "formatted": parsed_date.strftime("%B %d, %Y"),  # e.g., "June 3, 2025"
                "source": source
            }
        except ValueError:
            # Invalid date
            pass
    
    return None

def get_id(filename, group, len, i):
    return f"DR-{len}.{i}"

def generate_image_uuid_from_content(img_path):
    with open(img_path, 'rb') as f:
        content = f.read()
    content_hash = hashlib.sha256(content).hexdigest()[:12]
    return content_hash

def convert_pdf_to_png(pdf_path, count, output_folder="output_images", dpi=200, thumbnail_size=(300, 300), thumbnail_dpi=300):
    """
    Converts a PDF file into a series of PNG images, one for each page.
    Also creates thumbnail versions of each image.
    Returns a list of dictionaries containing file info and dimensions.

    Args:
        pdf_path (str): The path to the input PDF file.
        output_folder (str): The directory to save the output PNG images.
        dpi (int): The resolution (dots per inch) for the output images.
                   Higher DPI results in better quality but larger file sizes.
        thumbnail_size (tuple): Maximum dimensions (width, height) for thumbnails.
        thumbnail_dpi (int): DPI to use when generating thumbnails from PDF.
                            Higher values produce sharper thumbnails.
    
    Returns:
        list: List of dictionaries with file information, or None if conversion failed.
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Create thumbnails subdirectory
    thumbnails_folder = os.path.join(output_folder, "thumbnails")
    if not os.path.exists(thumbnails_folder):
        os.makedirs(thumbnails_folder)

    try:
        # Convert PDF pages to PIL Image objects
        images = convert_from_path(pdf_path, dpi=dpi)
        
        # Also generate higher resolution images for thumbnails
        thumbnail_source_images = convert_from_path(pdf_path, dpi=thumbnail_dpi)

        # Get the base name of the PDF file for naming output images
        pdf_base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        
        # Remove # characters from the base name
        pdf_base_name = pdf_base_name.replace('#', '')
        
        # Extract full text from PDF
        full_text = extract_text_from_pdf(pdf_path)
        
        # Parse date from filename
        # Use extracted text for back-up date
        date_info = parse_date(pdf_path, full_text)

        # Total pages in this PDF
        total_pages = len(images)

        file_info_list = []
        
        # Save each image as a separate PNG file
        for i, image in enumerate(images):
            output_filename = os.path.join(output_folder, f"{pdf_base_name} page {i+1}.png")
            image.save(output_filename, "PNG")
            
            ### DISABLE FOR NOW
            # # Create thumbnail with high quality settings from the higher-res source
            # thumbnail = thumbnail_source_images[i].copy()
            # thumbnail.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
            # thumbnail_filename = os.path.join(thumbnails_folder, f"{pdf_base_name} page {i+1}_thumb.png")
            # # Save with optimization disabled and high quality
            # thumbnail.save(thumbnail_filename, "PNG", optimize=False, compress_level=1)
            
            # Get image dimensions
            width, height = image.size
            # thumb_width, thumb_height = thumbnail.size
            
            # Get file sizes
            file_size = os.path.getsize(output_filename)
            # thumb_file_size = os.path.getsize(thumbnail_filename)
            
            group = output_filename.split('/')[6].replace('#', '')
            if (len(group) < 2):
                group = "xx"
                
            # human readable and stable ids
            id = get_id(pdf_base_name, group, count, i)
            uuid = generate_image_uuid_from_content(str(os.path.relpath(output_filename)));
            
            print(id, uuid)
            
            # Create file info dictionary
            file_info = {
                "filename": os.path.basename(output_filename),
                "id": id,
                "uuid": uuid,
                "rel_path": os.path.relpath(output_filename).replace('../frontend/public', ''),
                "group": group,
                "source_pdf": os.path.basename(pdf_path),
                "source_pdf_full_path": os.path.relpath(pdf_path),
                "page_number": i + 1,
                "total_pages_in_pdf": total_pages,
                "page_set_label": f"{i + 1} of {total_pages}",
                "width": width,
                "height": height,
                "file_size_bytes": file_size,
                "date_info": date_info,
                "extracted_text": full_text,
                # "thumbnail": {
                #     "filename": os.path.basename(thumbnail_filename),
                #     "rel_path": os.path.relpath(thumbnail_filename).replace('../frontend/public', ''),
                #     "width": thumb_width,
                #     "height": thumb_height,
                #     "file_size_bytes": thumb_file_size
                # }
            }
            
            file_info_list.append(file_info)
            
            date_str = f" - {date_info['formatted']}" if date_info else ""
            print(f"Saved: {output_filename} ({width}x{height}) - Page {i + 1} of {total_pages}{date_str}")
            # print(f"  Thumbnail: {thumbnail_filename} ({thumb_width}x{thumb_height})")

        return file_info_list

    except Exception as e:
        print(f"Error converting {pdf_path}: {e}")
        return None

def find_all_pdfs_recursive(root_directory):
    """
    Recursively find all PDF files in a directory and its subdirectories.
    Ignores any files in directories named "SUPERSEDED" or subdirectories within.
    
    Args:
        root_directory (str): The root directory to search.
    
    Returns:
        list: List of paths to PDF files.
    """
    pdf_files = []
    for root, dirs, files in os.walk(root_directory):
        # Skip SUPERSEDED directories
        if "SUPERSEDED" in root.split(os.sep):
            continue
        
        # Remove SUPERSEDED from dirs to prevent os.walk from entering them
        if "SUPERSEDED" in dirs:
            dirs.remove("SUPERSEDED")
        
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
    return pdf_files

def convert_all_pdfs_in_directory(input_directory, output_folder="output_images", dpi=200, preserve_structure=False, clear_output=True, thumbnail_size=(300, 300), thumbnail_dpi=300):
    """
    Converts all PDF files in a directory (including subdirectories) to PNG images 
    and generates a manifest file.

    Args:
        input_directory (str): The directory containing PDF files to convert.
        output_folder (str): The directory to save the output PNG images.
        dpi (int): The resolution for the output images.
        preserve_structure (bool): If True, preserves the subfolder structure in output.
                                  If False, all images go to the same output folder.
        clear_output (bool): If True, clears the output directory before conversion.
        thumbnail_size (tuple): Maximum dimensions (width, height) for thumbnails.
        thumbnail_dpi (int): DPI to use when generating thumbnails from PDF.
    """
    # Clear output directory if requested
    if clear_output and os.path.exists(output_folder):
        print(f"Clearing output directory: {output_folder}")
        shutil.rmtree(output_folder)
        print("Output directory cleared.")
    
    # Find all PDF files recursively
    pdf_files = find_all_pdfs_recursive(input_directory)
    
    if not pdf_files:
        print(f"No PDF files found in directory: {input_directory}")
        return
    
    print(f"Found {len(pdf_files)} PDF files to convert:")
    for pdf_file in pdf_files:
        print(f"  - {os.path.relpath(pdf_file)}")
    
    # Convert each PDF file and collect manifest data
    successful_conversions = 0
    failed_conversions = 0
    all_files_info = []
    pdf_page_counts = {}
    
    for pdf_file in pdf_files:
        print(f"\nConverting: {os.path.relpath(pdf_file)}")
        
        # Determine output folder based on preserve_structure setting
        if preserve_structure:
            # Preserve the subfolder structure
            rel_path = os.path.relpath(os.path.dirname(pdf_file), input_directory)
            if rel_path == '.':
                current_output_folder = output_folder
            else:
                # Remove # characters from folder path
                rel_path_clean = rel_path.replace('#', '')
                current_output_folder = os.path.join(output_folder, rel_path_clean)
        else:
            # All images go to the same output folder
            current_output_folder = output_folder
        
        file_info_list = convert_pdf_to_png(pdf_file, successful_conversions, current_output_folder, dpi, thumbnail_size, thumbnail_dpi)
        
        if file_info_list:
            successful_conversions += 1
            all_files_info.extend(file_info_list)
            # Track page counts per PDF
            pdf_name = os.path.basename(pdf_file)
            pdf_page_counts[pdf_name] = len(file_info_list)
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
                "preserve_structure": preserve_structure,
                "total_pdfs_processed": len(pdf_files),
                "successful_conversions": successful_conversions,
                "failed_conversions": failed_conversions,
                "total_images_created": len(all_files_info),
                # "thumbnail_size": thumbnail_size,
                # "thumbnail_dpi": thumbnail_dpi
            },
            ### DISABLE FOR NOW
            # "pdf_page_counts": pdf_page_counts,
            ### 
            "files": all_files_info,
            "summary_statistics": {
                "total_images": len(all_files_info),
                "unique_dimensions": list(set((info["width"], info["height"]) for info in all_files_info)),
                "total_file_size_bytes": sum(info["file_size_bytes"] for info in all_files_info),
                # "total_thumbnail_size_bytes": sum(info["thumbnail"]["file_size_bytes"] for info in all_files_info),
                "average_width": sum(info["width"] for info in all_files_info) / len(all_files_info) if all_files_info else 0,
                "average_height": sum(info["height"] for info in all_files_info) / len(all_files_info) if all_files_info else 0,
                "average_pages_per_pdf": sum(pdf_page_counts.values()) / len(pdf_page_counts) if pdf_page_counts else 0,
                "files_with_dates": sum(1 for info in all_files_info if info["date_info"] is not None),
                "files_without_dates": sum(1 for info in all_files_info if info["date_info"] is None)
            }
        }
        
        manifest_path = os.path.join(output_folder, "conversion_manifest.json")
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
            
    
        # copy to studio output folder
        studio_manifest_path = os.path.join("./../studio/script_output/drawings", "conversion_manifest.json")
        with open(studio_manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        
        # Create UUID to rel_path mapping
        uuid_mapping = {}
        for info in all_files_info:
            uuid_mapping[info["uuid"]] = {
                "rel_path": info["rel_path"],
                "filename": info["filename"],
                "id": info["id"],
                "group": info["group"],
                "source_pdf_full_path": info["source_pdf_full_path"],
                "width": info["width"],
                "height": info["height"],
                "date_info": info["date_info"]
            }
        
        uuid_mapping_path = os.path.join(output_folder, "uuid_mapping.json")
        with open(uuid_mapping_path, 'w', encoding='utf-8') as f:
            json.dump(uuid_mapping, f, ensure_ascii=False)
        
        # Create chronological manifest
        files_with_dates = [info for info in all_files_info if info["date_info"] is not None]
        files_without_dates = [info for info in all_files_info if info["date_info"] is None]
        
        # Sort files with dates chronologically
        files_with_dates_sorted = sorted(files_with_dates, key=lambda x: x["date_info"]["date"])
        
        chronological_manifest = {
            "manifest_info": {
                "type": "chronological",
                "timestamp": datetime.now().isoformat(),
                "total_files_with_dates": len(files_with_dates),
                "total_files_without_dates": len(files_without_dates),
                "date_range": {
                    "earliest": files_with_dates_sorted[0]["date_info"]["formatted"] if files_with_dates_sorted else None,
                    "latest": files_with_dates_sorted[-1]["date_info"]["formatted"] if files_with_dates_sorted else None
                }
            },
            "files_chronological": files_with_dates_sorted,
            "files_without_dates": files_without_dates
        }
        
        chronological_path = os.path.join(output_folder, "chronological_manifest.json")
        with open(chronological_path, 'w', encoding='utf-8') as f:
            json.dump(chronological_manifest, f, indent=2, ensure_ascii=False)
        
        print(f"\nManifest saved to: {manifest_path}")
        print(f"UUID mapping saved to: {uuid_mapping_path}")
        print(f"Chronological manifest saved to: {chronological_path}")
        print(f"Total images created: {len(all_files_info)}")
        print(f"Images with dates: {len(files_with_dates)}")
        print(f"Images without dates: {len(files_without_dates)}")
        if files_with_dates_sorted:
            print(f"Date range: {files_with_dates_sorted[0]['date_info']['formatted']} to {files_with_dates_sorted[-1]['date_info']['formatted']}")
        
        # Print summary of dimensions
        # unique_dimensions = manifest_data["summary_statistics"]["unique_dimensions"]
        # print(f"Unique dimensions found: {len(unique_dimensions)}")
        # for width, height in unique_dimensions:
        #     count = sum(1 for info in all_files_info if info["width"] == width and info["height"] == height)
        #     print(f"  - {width}x{height}: {count} images")
        
        # # Print page count summary
        # print(f"\nPage count summary:")
        # for pdf_name, page_count in pdf_page_counts.items():
        #     print(f"  - {pdf_name}: {page_count} pages")
    
    print(f"\nConversion complete!")
    print(f"Successfully converted: {successful_conversions} files")
    if failed_conversions > 0:
        print(f"Failed conversions: {failed_conversions} files")

if __name__ == "__main__":
    # Configuration
    input_directory = "./../frontend/public/drawings"  # Root directory to search recursively
    output_directory = input_directory + "/output_images"  # Where to save the PNG files
    image_dpi = 200  # Image quality (higher = better quality, larger files)
    preserve_folder_structure = True  # Set to True to preserve subfolder structure in output
    clear_output_before_conversion = True  # Set to False to keep existing files in output
    
    convert_all_pdfs_in_directory(input_directory, output_directory, image_dpi, preserve_folder_structure, clear_output_before_conversion)
