#!/usr/bin/env python3
"""
Audit Sanity article references against local manifests:
  1. relatedModels  — GLB filenames vs model export manifests
  1b. inlineModel   — GLB filenames in article body blocks
  2. drawings       — drawing UUIDs in image sets vs drawings conversion manifest
"""

import json
import os
import sys
import urllib.request
import urllib.parse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(SCRIPT_DIR, "..", "frontend", "public")
ENV_PATH = os.path.join(SCRIPT_DIR, "..", "frontend", ".env")

MODEL_MANIFEST_PATHS = [
    os.path.join(PUBLIC_DIR, "models", "export_manifest.json"),
    os.path.join(PUBLIC_DIR, "models-jig", "export_manifest.json"),
    os.path.join(PUBLIC_DIR, "models-battery", "export_manifest.json"),
]
DRAWING_MANIFEST_PATH = os.path.join(
    PUBLIC_DIR, "drawings", "output_images", "conversion_manifest.json"
)


def load_env():
    env = {}
    if not os.path.exists(ENV_PATH):
        return env
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            val = val.split(" #")[0].split("\t#")[0]
            env[key.strip()] = val.strip().strip('"').strip("'")
    return env


_env = load_env()
PROJECT_ID = _env.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "")
DATASET = _env.get("NEXT_PUBLIC_SANITY_DATASET", "production")
TOKEN = _env.get("SANITY_API_READ_TOKEN", "")

if not PROJECT_ID or not TOKEN:
    print("ERROR: NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_READ_TOKEN must be set in frontend/.env", file=sys.stderr)
    sys.exit(1)


def load_model_filenames():
    filenames = set()
    for path in MODEL_MANIFEST_PATHS:
        if not os.path.exists(path):
            print(f"  WARNING: manifest not found: {path}", file=sys.stderr)
            continue
        with open(path) as f:
            manifest = json.load(f)
        for layer in manifest.get("exported_layers", []):
            filenames.add(layer["filename"])
    return filenames


def load_drawing_uuids():
    """Returns {uuid: title} for all drawings in the conversion manifest."""
    if not os.path.exists(DRAWING_MANIFEST_PATH):
        print(f"  WARNING: drawing manifest not found: {DRAWING_MANIFEST_PATH}", file=sys.stderr)
        return {}
    with open(DRAWING_MANIFEST_PATH) as f:
        manifest = json.load(f)
    return {f["uuid"]: f.get("title", f["filename"]) for f in manifest.get("files", [])}


def query_sanity(groq):
    encoded = urllib.parse.quote(groq)
    url = f"https://{PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/{DATASET}?query={encoded}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())["result"]


def audit_related_models(valid_filenames):
    print("--- relatedModels ---")
    articles = query_sanity(
        '*[_type == "article" && defined(relatedModels) && length(relatedModels) > 0]'
        '{ _id, title, slug, relatedModels }'
    )
    print(f"  {len(articles)} articles with relatedModels\n")

    stale = []
    for article in articles:
        bad = [m for m in article.get("relatedModels", []) if m not in valid_filenames]
        if bad:
            stale.append((article, bad))

    if not stale:
        print("  ✓ All relatedModels references are valid.\n")
        return

    print(f"  ✗ Stale references in {len(stale)} article(s):\n")
    for article, bad_models in stale:
        slug = article.get("slug", {}).get("current", article["_id"])
        print(f"    [{slug}] {article.get('title', '(untitled)')}")
        for m in bad_models:
            lower = m.lower()
            suggestions = [v for v in valid_filenames if lower in v.lower() or v.lower() in lower]
            print(f"      ✗ {m}")
            for s in suggestions[:3]:
                print(f"          → {s}?")
        print()


def audit_inline_models(valid_filenames):
    """
    Inline model blocks in article bodies. These hold plain filenames like
    relatedModels, so re-exporting a layer under a new name silently unlinks
    them — the block renders empty rather than erroring.
    """
    print("--- inlineModel blocks ---")
    articles = query_sanity(
        '*[_type == "article" && count(body[_type == "inlineModel"]) > 0]'
        '{ _id, title, slug, "blocks": body[_type == "inlineModel"]{ title, models } }'
    )
    print(f"  {len(articles)} articles with inline models\n")

    stale = []
    for article in articles:
        for block in article.get("blocks", []):
            bad = [m for m in (block.get("models") or []) if m not in valid_filenames]
            if bad:
                stale.append((article, block, bad))

    if not stale:
        print("  ✓ All inlineModel references are valid.\n")
        return

    print(f"  ✗ Stale references in {len(stale)} block(s):\n")
    for article, block, bad_models in stale:
        slug = article.get("slug", {}).get("current", article["_id"])
        print(f"    [{slug}] {article.get('title', '(untitled)')}"
              f" → \"{block.get('title', '(untitled block)')}\"")
        for m in bad_models:
            print(f"      ✗ {m}")
            stem = m.replace(".glb", "")
            for s in [v for v in valid_filenames if v.startswith(stem + "__")][:6]:
                print(f"          → {s}?")
        print()


def audit_drawings(valid_uuids):
    print("--- drawings (image sets) ---")
    articles = query_sanity(
        '*[_type == "article" && defined(content)] {'
        '  _id, title, slug,'
        '  "drawings": content[_type == "imageSet"].imageSet[_type == "drawingImage"].drawing'
        '}'
    )
    articles_with_drawings = [a for a in articles if a.get("drawings")]
    print(f"  {len(articles_with_drawings)} articles with drawing references\n")

    stale = []
    for article in articles_with_drawings:
        bad = [d for d in article.get("drawings", []) if d not in valid_uuids]
        if bad:
            stale.append((article, bad))

    if not stale:
        print("  ✓ All drawing references are valid.\n")
        return

    print(f"  ✗ Stale references in {len(stale)} article(s):\n")
    for article, bad_uuids in stale:
        slug = article.get("slug", {}).get("current", article["_id"])
        print(f"    [{slug}] {article.get('title', '(untitled)')}")
        for u in bad_uuids:
            print(f"      ✗ {u}  (UUID not found in drawing manifest)")
        print()


def main():
    print("Loading manifests...")
    valid_filenames = load_model_filenames()
    print(f"  {len(valid_filenames)} model filenames")
    valid_uuids = load_drawing_uuids()
    print(f"  {len(valid_uuids)} drawing UUIDs\n")

    audit_related_models(valid_filenames)
    audit_inline_models(valid_filenames)
    audit_drawings(valid_uuids)


if __name__ == "__main__":
    main()
