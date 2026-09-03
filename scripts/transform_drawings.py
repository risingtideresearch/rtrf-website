from pdf2image import convert_from_path
from PIL import Image
import os
import json
import shutil
import re
import hashlib
import subprocess
from io import BytesIO
from datetime import datetime
from pathlib import Path
from pypdf import PdfReader

# PDF files to exclude from conversion (relative to frontend/public/drawings)
EXCLUDED_FILES = [
    "SUPERSTRUCTURE/INSTRUMENT PANEL/instrument panel frames persp view 1.pdf",
    "SUPERSTRUCTURE/INSTRUMENT PANEL/instrument panel frames perspective view 2.pdf",
    "SUPERSTRUCTURE/INSTRUMENT PANEL/instrument panel frames perspective view 3.pdf",
    "SUPERSTRUCTURE/INSTRUMENT PANEL/instrument panel frames perspective view 4.pdf",
    "PROPULSION/strut palm section.pdf",
    "PROPULSION/shaft log section.pdf",
    "PROPULSION/rudder tube section.pdf",
    "PROPULSION/quarter inch fwd of shaft log.pdf",
    "PROPULSION/quarter inch aft of shaft log.pdf",
    "OUTFITTING & INTERIOR/FWD MAST/forward mast rev A sheet 4 of 4 perspective views HJN 20MAY26.pdf",
    "OUTFITTING & INTERIOR/COMPANIONWAY HATCH/companionway hatch overview.pdf"
]

KEEP_EXTENSIONS = {".pdf", ".svg"}

SKIP_DIR_KEYWORDS = ("SUPERSEDED", "EXTRA")

OUTPUT_DIR_NAME = "output_images"

DELETE_EXTENSIONS = {".3dm"}

MONTH_ABBR = {
    'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
    'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
}

# System order for organizing drawings
SYSTEM_ORDER = [
    "overview",
    "power architecture",
    "superstructure",
    "control",
    "propulsion",
    "body",
    "water & heating systems",
    "outfitting & interior",
]

HENRY_NOLAN  = {"slug": "henry-nolan", "name": "Henry Nolan"}
ADAM_VERMEER = {"slug": "adam-james",  "name": "Adam Vermeer"}

UNATTRIBUTED = "unattributed"

# Top-level folder of initials -> author. Every source PDF lives at
# drawings/<INITIALS>/<SYSTEM>/..., so authorship is implicit in the path and
# adding an author is one entry here plus a folder.
#
# The initials are also stripped from clean_filename() for display, since many
# filenames repeat them ("... HJN 6-19-25.pdf").
#
# There is no default: a PDF under an unrecognised top-level folder gets
# author = None and is reported as "unattributed" rather than misattributed.
AUTHOR_FOLDERS = {
    "HJN": HENRY_NOLAN,
    "AJV": ADAM_VERMEER,
}

# Authors whose PDFs carry a CAD title block with a "TITLE:" field. Henry's Rhino
# exports have no such block, so extraction is skipped for his drawings entirely.
TITLE_BLOCK_AUTHOR_SLUGS = {"adam-james"}

# Used in Sanity dropdown
THUMBNAIL_MAX_WIDTH = 400
THUMBNAIL_DIR_NAME = "thumbnails"

# Generated directories: never scanned for sources, never cleaned up. thumbnails/
# currently sits inside output_images/, so it is already covered transitively --
# naming it keeps the skip correct if it ever moves.
GENERATED_DIR_NAMES = {OUTPUT_DIR_NAME, THUMBNAIL_DIR_NAME}

def is_skipped_dir(name):
    upper = name.strip().upper()
    return any(
        upper == kw or (upper.startswith(kw) and not upper[len(kw)].isalnum())
        for kw in SKIP_DIR_KEYWORDS
    )


def has_skipped_ancestor(path):
    """Whether any folder along the path marks archived content."""
    return any(is_skipped_dir(part) for part in str(path).split(os.sep))


def sanitize_path(path):
    """
    Remove # characters from a path while preserving the directory structure.
    
    Args:
        path (str): The path to sanitize
    
    Returns:
        str: The sanitized path
    """
    return path.replace('#', '')

def clean_filename(name):
    """Clean filename for display by removing common patterns"""
    clean = name
    clean = clean.replace("Solander 38", "")
    clean = re.sub(r'\d{1,2}-\d{1,2}-\d{2}', '', clean)
    clean = re.sub(r'\d{1,2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2,4}', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s*\.(png|svg|pdf)$', '', clean, flags=re.IGNORECASE)
    for initials in AUTHOR_FOLDERS:
        clean = clean.replace(f" {initials}", "")
    return clean.strip()


def drawings_relative_path(path):
    """
    Path relative to frontend/public/drawings, forward-slashed.

    Accepts either a source PDF path or a rendered PNG path under output_images/,
    so author rules can be written against the source folder layout either way.
    """
    p = sanitize_path(str(path)).replace('\\', '/')
    marker = '/drawings/'
    idx = p.find(marker)
    if idx != -1:
        p = p[idx + len(marker):]
    if p.startswith('output_images/'):
        p = p[len('output_images/'):]
    return p.strip('/')


def split_author_path(path):
    """
    Split a drawings-relative path into (author folder, system-relative path).

    "HJN/SUPERSTRUCTURE/FASCIA/x.pdf" -> ("HJN", "SUPERSTRUCTURE/FASCIA/x.pdf")

    The author folder is dropped from everything downstream -- output location,
    group, exclusions -- so each system holds every author's drawings in one place.
    Paths already stripped of their author (rendered PNGs) come back with None.
    """
    rel = drawings_relative_path(path)
    head, _sep, tail = rel.partition('/')
    if head in AUTHOR_FOLDERS:
        return head, tail
    return None, rel


def system_relative_path(path):
    """Path below the author folder -- what EXCLUDED_FILES and output paths are written against."""
    return split_author_path(path)[1]


def group_from_path(pdf_path):
    """
    The system folder a drawing belongs to: the first segment below the author folder.

    "AJV/POWER ARCHITECTURE/frame-asm-v1.pdf" -> "POWER ARCHITECTURE"
    """
    parts = system_relative_path(pdf_path).split('/')
    group = sanitize_path(parts[0]) if len(parts) > 1 else "unknown"
    return group if len(group) >= 2 else "unknown"


def is_excluded(pdf_path):
    """Whether a PDF is in EXCLUDED_FILES, which are written relative to the system folder."""
    rel = system_relative_path(pdf_path)
    return any(rel == excl or rel.endswith('/' + excl) for excl in EXCLUDED_FILES)


def author_from_path(path):
    """Author owning the top-level initials folder this path sits under, or None."""
    return AUTHOR_FOLDERS.get(split_author_path(path)[0])


def get_author(pdf_path):
    """
    Resolve a drawing's author from the initials folder it lives under.

    Returns None when the folder is unrecognised -- there is no default author.
    Unattributed drawings are reported at the end of the run so a new folder
    missing an AUTHOR_FOLDERS entry is visible rather than silently misattributed.
    """
    author = author_from_path(pdf_path)
    return dict(author) if author else None


BBOX_WORD = re.compile(
    r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>'
)


def _bbox_words(pdf_path):
    """Page-1 words with coordinates, via poppler's pdftotext (already required by pdf2image)."""
    try:
        result = subprocess.run(
            ["pdftotext", "-bbox", "-f", "1", "-l", "1", pdf_path, "-"],
            capture_output=True, text=True, timeout=30,
        )
    except (OSError, subprocess.SubprocessError):
        return []
    return [
        (float(x0), float(y0), float(x1), float(y1), text)
        for x0, y0, x1, y1, text in BBOX_WORD.findall(result.stdout)
    ]


def extract_title_block(pdf_path):
    """
    The drawing's title from the "TITLE:" field of a CAD title block, or None.

    The title is set in a noticeably larger font than the surrounding boilerplate,
    on its own text run just right of the label. Matching that run by font height
    is what separates it from the "UNLESS OTHERWISE SPECIFIED" block sharing the
    same corner. Drawings whose title block was exported as vector outlines have
    no text to find, so None is normal and the caller falls back to the filename.
    """
    words = _bbox_words(pdf_path)
    label = next((w for w in words if w[4].strip().upper().rstrip(':') == "TITLE"), None)
    if not label:
        return None

    lx0, ly0, _lx1, ly1, _ = label
    label_height = ly1 - ly0
    candidates = [
        w for w in words
        if w[2] > lx0
        and abs(w[1] - ly0) < label_height * 4
        and (w[3] - w[1]) > label_height * 1.2
    ]
    if not candidates:
        return None

    runs = {}
    for w in candidates:
        runs.setdefault((round(w[1], 1), round(w[3], 1)), []).append(w)
    run = max(runs.values(), key=lambda words: words[0][3] - words[0][1])
    run.sort(key=lambda w: w[0])

    title = " ".join(w[4] for w in run).strip()
    return title or None


SVG_TAG = re.compile(r'<svg\b[^>]*>', re.IGNORECASE | re.DOTALL)
SVG_TITLE = re.compile(r'<title[^>]*>(.*?)</title>', re.IGNORECASE | re.DOTALL)


def _svg_length(value):
    """Leading number of an SVG length ("506.18823", "816px", "210mm"), or None."""
    match = re.match(r'\s*(-?[\d.]+)', value or "")
    return float(match.group(1)) if match else None


def read_svg(svg_path):
    """
    (width, height, title) for an SVG, falling back to the viewBox for dimensions.

    Dimensions are needed so the frontend can reserve the right aspect ratio, the
    same way PDF pages get theirs from the rasterised PNG.
    """
    try:
        with open(svg_path, encoding="utf-8", errors="replace") as f:
            content = f.read()
    except OSError:
        return None, None, None

    tag = SVG_TAG.search(content)
    attrs = tag.group(0) if tag else ""

    def attr(name):
        match = re.search(rf'\b{name}\s*=\s*["\']([^"\']*)', attrs, re.IGNORECASE)
        return match.group(1) if match else None

    width = _svg_length(attr("width"))
    height = _svg_length(attr("height"))

    if not width or not height:
        box = (attr("viewBox") or "").replace(",", " ").split()
        if len(box) == 4:
            width = width or _svg_length(box[2])
            height = height or _svg_length(box[3])

    title = SVG_TITLE.search(content)
    return width, height, (title.group(1).strip() if title else None)


def get_title_block(pdf_path, author):
    """Title block text for authors whose drawings have one, else None."""
    if not author or author["slug"] not in TITLE_BLOCK_AUTHOR_SLUGS:
        return None
    return extract_title_block(pdf_path)


def get_title(title_block, png_filename):
    """
    The drawing's display title, fully formatted.

    This is the single string the frontend renders -- the title block when the PDF
    carries one, otherwise the filename with dates, initials and "Solander 38"
    stripped. Falling back per page rather than per PDF keeps the " page 2" suffix
    on multi-page drawings that have no title block.

    Only the first character is upper-cased; the rest is left alone so existing
    capitalisation survives ("4 Module Battery Crate", "PRELIM battery component").
    """
    title = title_block or clean_filename(png_filename)
    return title[:1].upper() + title[1:] if title else title

def rename_files_with_hash(root_directory):
    """
    Recursively find and rename all files and directories containing # characters.
    
    Args:
        root_directory (str): The root directory to search.
    
    Returns:
        dict: Mapping of old paths to new paths
    """
    renames = {}
    
    items_to_rename = []
    for root, dirs, files in os.walk(root_directory, topdown=False):
        # Skip archived directories
        if has_skipped_ancestor(root):
            continue

        # Collect directories that need renaming
        for dirname in dirs:
            if '#' in dirname:
                old_path = os.path.join(root, dirname)
                new_name = dirname.replace('#', '')
                new_path = os.path.join(root, new_name)
                items_to_rename.append(('dir', old_path, new_path))
        
        # Collect files that need renaming
        for filename in files:
            if '#' in filename:
                old_path = os.path.join(root, filename)
                new_name = filename.replace('#', '')
                new_path = os.path.join(root, new_name)
                items_to_rename.append(('file', old_path, new_path))
    
    # Second pass: perform renames
    for item_type, old_path, new_path in items_to_rename:
        try:
            if os.path.exists(new_path):
                print(f"  WARNING: Target already exists, skipping: {new_path}")
                continue
            os.rename(old_path, new_path)
            renames[old_path] = new_path
            print(f"  Renamed {item_type}: {old_path} -> {new_path}")
        except Exception as e:
            print(f"  ERROR renaming {old_path}: {e}")
    
    return renames


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
    Parse date from filename or full_text. Supports M-D-YY, DDMMMYY (e.g. 6APR26), and MM/DD/YY formats.

    Returns:
        dict: Parsed date info, or None if no date found.
    """
    name_without_ext = os.path.splitext(filename)[0]

    def make_result(match, month, day, year, source):
        try:
            parsed_date = datetime(year, month, day)
            return {
                "raw_date_string": match.group(0),
                "date": parsed_date.strftime("%Y-%m-%d"),
                "date_iso": parsed_date.isoformat(),
                "year": year,
                "month": month,
                "day": day,
                "formatted": parsed_date.strftime("%B %d, %Y"),
                "source": source,
            }
        except ValueError:
            return None

    # 1. Numeric M-D-YY at end of filename
    m = re.search(r'(\d{1,2})[-._](\d{1,2})[-._](\d{2})$', name_without_ext)
    if m:
        result = make_result(m, int(m.group(1)), int(m.group(2)), int(m.group(3)) + 2000, "filename")
        if result:
            return result

    # 2. DDMMMYY / DDMMMYYYY at end of filename (e.g. 6APR26, 14JAN2025)
    m = re.search(r'(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2,4})$', name_without_ext, re.IGNORECASE)
    if m:
        yr = int(m.group(3))
        year = yr if yr > 999 else yr + 2000
        result = make_result(m, MONTH_ABBR[m.group(2).upper()], int(m.group(1)), year, "filename")
        if result:
            return result

    if not full_text:
        return None

    # 3. MM/DD/YY in text
    m = re.search(r'(\d{1,2})/(\d{1,2})/(\d{2})', full_text)
    if m:
        result = make_result(m, int(m.group(1)), int(m.group(2)), int(m.group(3)) + 2000, "full_text")
        if result:
            return result

    # 4. DDMMMYY / DDMMMYYYY anywhere in text
    m = re.search(r'(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2,4})', full_text, re.IGNORECASE)
    if m:
        yr = int(m.group(3))
        year = yr if yr > 999 else yr + 2000
        result = make_result(m, MONTH_ABBR[m.group(2).upper()], int(m.group(1)), year, "full_text")
        if result:
            return result

    return None

def normalize_group_name(group):
    """Normalize group name to match SYSTEM_ORDER"""
    normalized = group.lower().strip()
    # Handle common variations
    if normalized in SYSTEM_ORDER:
        return normalized
    # Try to find partial match
    for system in SYSTEM_ORDER:
        if system in normalized or normalized in system:
            return system
    return "unknown"

def get_system_index(group):
    """Get the index of a system in SYSTEM_ORDER for sorting"""
    normalized = normalize_group_name(group)
    try:
        return SYSTEM_ORDER.index(normalized)
    except ValueError:
        return len(SYSTEM_ORDER)  # Put unknowns at the end

def get_id(system_code, counter):
    """
    Generate hierarchical ID: SYSTEM_CODE-NUMBER
    Examples: OV-1, OV-2, PA-1, PA-2, etc.
    """
    return f"{system_code}–{counter}"

def generate_image_uuid_from_content(img_path, uuids):
    """
    Generate a unique UUID based on image content hash.
    Handles duplicates by appending incrementing suffixes.
    
    Args:
        img_path (str): Path to the image file
        uuids (set): Set of already used UUIDs
        
    Returns:
        str: Unique UUID for this image
    """
    with open(img_path, 'rb') as f:
        content = f.read()
    content_hash = hashlib.sha256(content).hexdigest()[:12]
    
    # Handle duplicates by appending incrementing suffix
    original_hash = content_hash
    suffix = 1
    while content_hash in uuids:
        content_hash = f"{original_hash}-{suffix}"
        suffix += 1
        print(f"\t### duplicate image hash {img_path} -> {content_hash}")
    
    return content_hash

def convert_pdf_to_png(pdf_path, output_folder="output_images", dpi=200, global_uuids=None):
    """
    Converts a PDF file into a series of PNG images, one for each page.
    Returns a list of dictionaries containing file info and dimensions.
    Skips conversion if output PNGs already exist and are newer than the source PDF.

    Args:
        pdf_path (str): The path to the input PDF file.
        output_folder (str): The directory to save the output PNG images.
        dpi (int): The resolution (dots per inch) for the output images.
        global_uuids (set): Set of UUIDs used across all PDFs for duplicate detection.

    Returns:
        list: List of dictionaries with file information (without IDs), or None if conversion failed.
    """
    # Initialize global_uuids if not provided
    if global_uuids is None:
        global_uuids = set()

    # Sanitize output folder path
    output_folder = sanitize_path(output_folder)

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Check if all output PNGs already exist and are newer than the source PDF
    pdf_base_name = sanitize_path(os.path.splitext(os.path.basename(pdf_path))[0])
    try:
        reader = PdfReader(pdf_path)
        n_pages = len(reader.pages)
        pdf_mtime = os.path.getmtime(pdf_path)
        expected = [
            os.path.join(output_folder, f"{pdf_base_name}{'' if n_pages == 1 else f' page {i+1}'}.png")
            for i in range(n_pages)
        ]
        if all(os.path.exists(f) and os.path.getmtime(f) > pdf_mtime for f in expected):
            date_info = parse_date(pdf_path, "")
            group = group_from_path(pdf_path)
            author = get_author(pdf_path)
            title_block = get_title_block(pdf_path, author)
            file_info_list = []
            for i, out_f in enumerate(expected):
                img = Image.open(out_f)
                width, height = img.size
                img.close()
                uuid = generate_image_uuid_from_content(str(os.path.relpath(out_f)), global_uuids)
                global_uuids.add(uuid)
                file_info_list.append({
                    "filename": os.path.basename(out_f),
                    "title": get_title(title_block, os.path.basename(out_f)),
                    "uuid": uuid,
                    "rel_path": sanitize_path(os.path.relpath(out_f).replace('../frontend/public', '')),
                    "group": group,
                    "system_index": get_system_index(group),
                    "source_path": sanitize_path(os.path.relpath(pdf_path)),
                    "source_size_bytes": os.path.getsize(pdf_path),
                    "total_pages_in_pdf": n_pages,
                    "page_set_label": f"{i + 1} of {n_pages}",
                    "width": width,
                    "height": height,
                    "file_size_bytes": os.path.getsize(out_f),
                    "date": date_info["date"] if date_info else None,
                    "author": dict(author) if author else None,
                    "extracted_text": "",
                })
            print(f"  (unchanged, skipped)")
            return file_info_list
    except Exception:
        pass  # fall through to full conversion

    try:
        # Convert PDF pages to PIL Image objects
        images = convert_from_path(pdf_path, dpi=dpi)

        # Get the base name of the PDF file for naming output images
        pdf_base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        
        # Remove # characters from the base name
        pdf_base_name = sanitize_path(pdf_base_name)
        
        # Extract full text from PDF
        full_text = extract_text_from_pdf(pdf_path)
        
        # Parse date from filename
        # Use extracted text for back-up date
        date_info = parse_date(pdf_path, full_text)

        # Total pages in this PDF
        total_pages = len(images)

        author = get_author(pdf_path)
        title_block = get_title_block(pdf_path, author)

        file_info_list = []

        # Save each image as a separate PNG file
        for i, image in enumerate(images):
            page_suffix = f" page {i+1}" if total_pages > 1 else ""
            output_filename = os.path.join(output_folder, f"{pdf_base_name}{page_suffix}.png")
            image.save(output_filename, "PNG")
            
            # Get image dimensions
            width, height = image.size
            
            # Get file sizes
            file_size = os.path.getsize(output_filename)
            
            group = group_from_path(pdf_path)

            uuid = generate_image_uuid_from_content(str(os.path.relpath(output_filename)), global_uuids)
            global_uuids.add(uuid)  # Add to the global set
            
            # Sanitize all paths in file info
            rel_path = sanitize_path(os.path.relpath(output_filename).replace('../frontend/public', ''))
            source_path = sanitize_path(os.path.relpath(pdf_path))

            # Create file info dictionary WITHOUT id (will be assigned later)
            file_info = {
                "filename": os.path.basename(output_filename),
                "title": get_title(title_block, os.path.basename(output_filename)),
                "uuid": uuid,
                "rel_path": rel_path,
                "group": group,
                "system_index": get_system_index(group),  # For sorting
                "source_path": source_path,
                "source_size_bytes": os.path.getsize(pdf_path),
                "total_pages_in_pdf": total_pages,
                "page_set_label": f"{i + 1} of {total_pages}",
                "width": width,
                "height": height,
                "file_size_bytes": file_size,
                "date": date_info["date"] if date_info else None,
                "author": dict(author) if author else None,
                "extracted_text": "" #full_text,
            }
            
            file_info_list.append(file_info)

        return file_info_list

    except Exception as e:
        print(f"Error converting {pdf_path}: {e}")
        return None


def copy_svg_to_output(svg_path, output_folder, global_uuids=None):
    """
    Copy an SVG into the output tree and describe it like a converted page.

    SVGs are already web-renderable, so there is nothing to rasterise -- they are
    copied alongside the PNGs so every drawing is served from one joined-by-system
    folder, and so the manifest entry looks the same to the frontend.

    Returns a one-item list to match convert_pdf_to_png(), or None on failure.
    """
    if global_uuids is None:
        global_uuids = set()

    output_folder = sanitize_path(output_folder)
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    try:
        output_filename = os.path.join(
            output_folder, sanitize_path(os.path.basename(svg_path))
        )
        svg_mtime = os.path.getmtime(svg_path)
        if not (os.path.exists(output_filename)
                and os.path.getmtime(output_filename) > svg_mtime):
            shutil.copy2(svg_path, output_filename)

        width, height, embedded_title = read_svg(output_filename)
        group = group_from_path(svg_path)
        author = get_author(svg_path)
        uuid = generate_image_uuid_from_content(
            str(os.path.relpath(output_filename)), global_uuids
        )
        global_uuids.add(uuid)
        date_info = parse_date(svg_path, "")

        return [{
            "filename": os.path.basename(output_filename),
            "title": get_title(embedded_title, os.path.basename(output_filename)),
            "uuid": uuid,
            "rel_path": sanitize_path(
                os.path.relpath(output_filename).replace('../frontend/public', '')
            ),
            "group": group,
            "system_index": get_system_index(group),
            "source_path": sanitize_path(os.path.relpath(svg_path)),
            "source_size_bytes": os.path.getsize(svg_path),
            "total_pages_in_pdf": 1,
            "page_set_label": "1 of 1",
            "width": width,
            "height": height,
            "file_size_bytes": os.path.getsize(output_filename),
            "date": date_info["date"] if date_info else None,
            "author": dict(author) if author else None,
            "extracted_text": "",
        }]

    except Exception as e:
        print(f"Error copying {svg_path}: {e}")
        return None


def output_file_path(info):
    """Local path of the generated asset a manifest entry points at."""
    return os.path.join("./../frontend/public", info["rel_path"].lstrip("/"))


def _rasterize_svg(svg_path, max_width):
    """PNG bytes for an SVG, or None when no rasteriser is installed."""
    try:
        import cairosvg
        return cairosvg.svg2png(url=svg_path, output_width=max_width)
    except ImportError:
        pass
    except Exception:
        return None

    commands = [
        ["rsvg-convert", "-w", str(max_width), svg_path],
        ["inkscape", svg_path, "--export-type=png",
         f"--export-width={max_width}", "--export-filename=-"],
    ]
    for command in commands:
        try:
            result = subprocess.run(command, capture_output=True, timeout=60)
        except (OSError, subprocess.SubprocessError):
            continue
        if result.returncode == 0 and result.stdout:
            return result.stdout
    return None


def make_thumbnail(asset_path, max_width=THUMBNAIL_MAX_WIDTH):
    """
    PNG bytes for a small preview of a generated asset, or None if not possible.

    Rasters are downscaled and flattened onto white, since drawings are dark
    linework and the Studio's dark theme would swallow a transparent background.
    An SVG is rasterised when a converter is available; otherwise it has no
    thumbnail and callers point at the original, which scales natively anyway.
    """
    if asset_path.lower().endswith(".svg"):
        raster = _rasterize_svg(asset_path, max_width)
        if raster is None:
            return None
        source = BytesIO(raster)
    else:
        source = asset_path

    with Image.open(source) as img:
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            flattened = Image.new("RGB", img.size, (255, 255, 255))
            flattened.paste(img, mask=img.split()[-1])
            img = flattened
        else:
            img = img.convert("RGB")

        img.thumbnail((max_width, max_width * 4), Image.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, "PNG", optimize=True)

    return buffer.getvalue()


def write_thumbnails(all_files_info, output_folder):
    """
    Write a mini thumbnail per drawing, mirroring the flat one-folder-per-system
    layout under a thumbnails/ subfolder, and record it as `thumbnail_path`.

    Regenerated only when missing or stale, so reruns are cheap. A drawing with no
    thumbnail (an SVG with no rasteriser available) falls back to its own rel_path,
    which is already small and scales natively.
    """
    written = reused = skipped = 0

    for info in all_files_info:
        asset_path = output_file_path(info)
        stem = os.path.splitext(info["filename"])[0]
        thumb_path = os.path.join(
            output_folder, THUMBNAIL_DIR_NAME, sanitize_path(info["group"]), f"{stem}.png"
        )

        try:
            if (os.path.exists(thumb_path)
                    and os.path.getmtime(thumb_path) > os.path.getmtime(asset_path)):
                reused += 1
            else:
                payload = make_thumbnail(asset_path)
                if payload is None:
                    info["thumbnail_path"] = info["rel_path"]
                    skipped += 1
                    continue
                os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
                with open(thumb_path, "wb") as f:
                    f.write(payload)
                written += 1

            info["thumbnail_path"] = sanitize_path(
                os.path.relpath(thumb_path).replace('../frontend/public', '')
            )
        except Exception as e:
            print(f"  Thumbnail failed for {info['filename']}: {e}")
            info["thumbnail_path"] = info["rel_path"]
            skipped += 1

    print("\n=== Thumbnails ===")
    print(f"  written: {written}   reused: {reused}   using full-size: {skipped}")


def find_all_source_files(root_directory):
    """
    Recursively find all convertible source files (see KEEP_EXTENSIONS).
    Ignores anything nested under an archived directory (see SKIP_DIR_KEYWORDS).

    Args:
        root_directory (str): The root directory to search.

    Returns:
        list: List of paths to source drawing files.
    """
    source_files = []
    for root, dirs, files in os.walk(root_directory):
        # Skip archived and generated directories, and don't descend into them
        parts = root.split(os.sep)
        if GENERATED_DIR_NAMES.intersection(parts) or has_skipped_ancestor(root):
            continue
        dirs[:] = [d for d in dirs
                   if d not in GENERATED_DIR_NAMES and not is_skipped_dir(d)]


        for file in files:
            if os.path.splitext(file)[1].lower() in KEEP_EXTENSIONS:
                full_path = os.path.join(root, file)
                if is_excluded(full_path):
                    print(f"  Skipping excluded file: {os.path.relpath(full_path)}")
                    continue
                source_files.append(full_path)
    return source_files

def sort_files_by_system_and_date(all_files_info):
    """
    Sort files by system (using SYSTEM_ORDER), then by date within each system.
    Assigns hierarchical IDs like OV-1, OV-2, PA-1, PA-2, etc.
    
    Args:
        all_files_info (list): List of file info dictionaries
        
    Returns:
        list: Sorted list of file info dictionaries with IDs assigned
    """
    # Sort by:
    # 1. System order (system_index)
    # 2. Date (descending - newest first, None dates go last)
    # 3. Filename (for stable sorting of undated items)
    
    def sort_key(file_info):
        system_idx = file_info["system_index"]

        # For date sorting: use a very old date for None dates to push them to end
        date_sort = file_info["date"] or "0000-00-00"  # Sorts before any real date

        filename = file_info["filename"]

        return (system_idx, date_sort, filename)

    # Sort with newest dates first within each system (reverse=True for date)
    sorted_files = sorted(all_files_info, key=lambda x: (
        x["system_index"],
        x["date"] or "0000-00-00",
        x["filename"]
    ), reverse=False)
    
    # Now reverse only the date ordering within each system
    # Group by system, reverse dates, then flatten
    from itertools import groupby
    
    final_sorted = []
    for system_idx, group in groupby(sorted_files, key=lambda x: x["system_index"]):
        system_files = list(group)
        
        # Separate dated and undated files
        dated = [f for f in system_files if f["date"]]
        undated = [f for f in system_files if not f["date"]]

        # Sort dated files newest first
        dated.sort(key=lambda x: x["date"], reverse=True)
        
        # Combine: dated first (newest to oldest), then undated
        final_sorted.extend(dated + undated)
    
    system_counters = {}
    
    print("\n=== Assigned IDs by System ===")
    for file_info in final_sorted:
        normalized_group = normalize_group_name(file_info["group"])

        system_code = "DR"
        
        if system_code not in system_counters:
            system_counters[system_code] = 0
        system_counters[system_code] += 1
        
        file_info["id"] = get_id(system_code, system_counters[system_code])
        
        date_str = file_info['date'] or 'No date'
        author_str = file_info['author']['name'] if file_info['author'] else UNATTRIBUTED
        print(f"{file_info['id']:8} | {normalized_group:25} | {date_str:20} | {author_str:15} | {file_info['uuid']}")

    return final_sorted


def count_files_by_author(all_files_info):
    """Count manifest entries per author name, with unattributed drawings counted explicitly."""
    counts = {}
    for info in all_files_info:
        name = info["author"]["name"] if info["author"] else UNATTRIBUTED
        counts[name] = counts.get(name, 0) + 1
    return counts


def report_authors(all_files_info):
    """
    Print the per-author breakdown, listing any unattributed drawings.

    With no default author, this is what tells you a folder is missing from
    AUTHOR_FOLDERS -- it should read "unattributed: 0" on a healthy run.
    """
    counts = count_files_by_author(all_files_info)

    print("\n=== Drawings by Author ===")
    for name in sorted(counts, key=lambda n: (n == UNATTRIBUTED, n)):
        print(f"{name:20} | {counts[name]}")

    orphans = [info for info in all_files_info if not info["author"]]
    if orphans:
        print(f"\n  WARNING: {len(orphans)} drawing(s) are not under a known author folder:")
        for info in orphans:
            print(f"    {drawings_relative_path(info['source_path'])}")
        print("  Add the folder to AUTHOR_FOLDERS, or they will render with no author byline.")

def cleanup_source_directory(root_directory):
    """
    Remove excluded and unwanted files from the source drawings directory.

    Archived folders are left alone apart from DELETE_EXTENSIONS, which are purged
    wherever they appear -- keeping the archive intact while dropping the large
    working files nobody publishes. Generated trees (see GENERATED_DIR_NAMES) are never touched.
    """
    deleted = []

    for root, dirs, files in os.walk(root_directory):
        parts = root.split(os.sep)
        if GENERATED_DIR_NAMES.intersection(parts):
            continue
        dirs[:] = [d for d in dirs if d not in GENERATED_DIR_NAMES]

        archived = has_skipped_ancestor(root)

        for file in files:
            full_path = os.path.join(root, file)
            rel_from_drawings = os.path.relpath(full_path, root_directory)
            ext = os.path.splitext(file)[1].lower()

            if ext in DELETE_EXTENSIONS:
                reason = "unpublished working file"
            elif archived:
                continue  # otherwise the archive is preserved as-is
            elif is_excluded(full_path):
                reason = "excluded"
            elif ext not in KEEP_EXTENSIONS:
                reason = "unwanted type"
            else:
                continue

            print(f"  Deleting ({reason}): {rel_from_drawings}")
            os.remove(full_path)
            deleted.append(full_path)

    print(f"Deleted {len(deleted)} file(s) from source directory")
    return deleted


def transform_all_drawings(dpi=200, preserve_structure=True, clear_output=False,
                           thumbnails=True):
    """
    Turn every source drawing into a web asset plus a manifest entry.

    PDFs are rasterised to PNG (one per page) and SVGs are copied as-is; both land
    in one flat folder per system, with the author's initials folder and any
    organising subfolders dropped. Unchanged files are skipped unless
    clear_output=True.

    Args:
        dpi (int): The resolution for the output images.
        preserve_structure (bool): If True, groups output into one folder per system.
        clear_output (bool): If True, clears the output directory and reconverts everything.
        thumbnails (bool): If True, writes mini thumbnails for the Studio dropdown.
    """

    # Configuration
    input_directory = "./../frontend/public/drawings"
    output_folder = input_directory + "/output_images"

    # First, rename any files/directories with # characters
    print("Checking for files/directories with # characters...")
    renames = rename_files_with_hash(input_directory)
    if renames:
        print(f"Renamed {len(renames)} items to remove # characters")
    else:
        print("No files/directories with # characters found")

    # Remove excluded PDFs and non-PDF files from source directory
    print("\nCleaning up source directory...")
    cleanup_source_directory(input_directory)

    # Clear output directory if requested
    if clear_output and os.path.exists(output_folder):
        print(f"Clearing output directory: {output_folder}")
        shutil.rmtree(output_folder)
    
    # Find all source drawing files recursively
    source_files = find_all_source_files(input_directory)

    if not source_files:
        print(f"No source files found in directory: {input_directory}")
        return

    print(f"{len(source_files)} source files to process")

    # Process each source file and collect manifest data
    successful_conversions = 0
    failed_conversions = 0
    all_files_info = []
    page_counts = {}
    global_uuids = set()  # Create a single set for tracking all UUIDs

    for source_file in source_files:
        # Determine output folder based on preserve_structure setting
        if preserve_structure:
            # One flat folder per system. Both the author folder and any organising
            # subfolders below the system are dropped, so a drawing's output location
            # is exactly its group -- matching how the site presents them.
            group = group_from_path(source_file)
            current_output_folder = os.path.join(output_folder, sanitize_path(group))
        else:
            # All images go to the same output folder
            current_output_folder = output_folder

        if os.path.splitext(source_file)[1].lower() == ".svg":
            file_info_list = copy_svg_to_output(source_file, current_output_folder, global_uuids)
        else:
            file_info_list = convert_pdf_to_png(source_file, current_output_folder, dpi, global_uuids)

        if file_info_list:
            successful_conversions += 1
            all_files_info.extend(file_info_list)
            # Track page counts per source file
            source_name = sanitize_path(os.path.basename(source_file))
            page_counts[source_name] = len(file_info_list)
        else:
            failed_conversions += 1
    
    # Sort files by system and date, then assign IDs
    all_files_info = sort_files_by_system_and_date(all_files_info)

    report_authors(all_files_info)

    if thumbnails:
        write_thumbnails(all_files_info, output_folder)
    else:
        for info in all_files_info:
            info["thumbnail_path"] = info["rel_path"]

    # Generate manifest file
    if all_files_info:
        manifest_data = {
            "conversion_info": {
                "timestamp": datetime.now().isoformat(),
                "input_directory": sanitize_path(os.path.relpath(input_directory)),
                "output_directory": sanitize_path(os.path.relpath(output_folder)),
                "dpi": dpi,
                "preserve_structure": preserve_structure,
                "total_pdfs_processed": len(source_files),
                "successful_conversions": successful_conversions,
                "failed_conversions": failed_conversions,
                "total_images_created": len(all_files_info),
            },
            "files": all_files_info,
            "summary_statistics": {
                "total_images": len(all_files_info),
                "unique_dimensions": list(set((info["width"], info["height"]) for info in all_files_info)),
                "total_file_size_bytes": sum(info["file_size_bytes"] for info in all_files_info),
                "average_width": sum(info["width"] for info in all_files_info) / len(all_files_info) if all_files_info else 0,
                "average_height": sum(info["height"] for info in all_files_info) / len(all_files_info) if all_files_info else 0,
                "average_pages_per_pdf": sum(page_counts.values()) / len(page_counts) if page_counts else 0,
                "files_with_dates": sum(1 for info in all_files_info if info["date"] is not None),
                "files_without_dates": sum(1 for info in all_files_info if info["date"] is None),
                "files_by_system": {
                    system: sum(1 for info in all_files_info if normalize_group_name(info["group"]) == system)
                    for system in SYSTEM_ORDER
                },
                "files_by_author": count_files_by_author(all_files_info),
            }
        }
        
        manifest_path = os.path.join(output_folder, "conversion_manifest.json")
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
            
    
        # copy to studio output folder
        studio_manifest_path = os.path.join("./../studio/script_output/", "drawing_conversion_manifest.json")
        with open(studio_manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        print("\nFile copied to sanity studio", studio_manifest_path)
        
        # Create UUID to rel_path mapping
        uuid_mapping = {}
        for info in all_files_info:
            uuid_mapping[info["uuid"]] = {
                "rel_path": info["rel_path"],
                "filename": info["filename"],
                "title": info["title"],
                "id": info["id"],
                "group": info["group"],
                "source_path": info["source_path"],
                "width": info["width"],
                "height": info["height"],
                "date": info["date"]
            }
        
        uuid_mapping_path = os.path.join(output_folder, "uuid_mapping.json")
        with open(uuid_mapping_path, 'w', encoding='utf-8') as f:
            json.dump(uuid_mapping, f, ensure_ascii=False)
        
        print(f"\nManifest saved to: {manifest_path}")
        print(f"UUID mapping saved to: {uuid_mapping_path}")
        print(f"Total images created: {len(all_files_info)}")
        print(f"Unique UUIDs: {len(global_uuids)}")
        
        # Check for any duplicate UUIDs in the final output
        uuid_counts = {}
        for info in all_files_info:
            uuid = info["uuid"]
            uuid_counts[uuid] = uuid_counts.get(uuid, 0) + 1
        
        duplicates = {uuid: count for uuid, count in uuid_counts.items() if count > 1}
        if duplicates:
            print(f"\nWARNING: Found {len(duplicates)} duplicate UUIDs:")
            for uuid, count in duplicates.items():
                print(f"  {uuid}: appears {count} times")
        else:
            print("\n✓ All UUIDs are unique!")
    
    print(f"\nConversion complete!")
    print(f"Successfully converted: {successful_conversions} files")
    if failed_conversions > 0:
        print(f"Failed conversions: {failed_conversions} files")

if __name__ == "__main__":
    transform_all_drawings()
