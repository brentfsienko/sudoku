#!/usr/bin/env python3
"""Replace collage, anatomy, stamp, statue, and group Daily Dog photos."""

from __future__ import annotations

import importlib.util
import os
import re
import time

ROOT = "/Users/brentsienko/code/sudoku"
CATALOG = os.path.join(ROOT, "scripts/build-year-catalog.py")
SOURCES = os.path.join(ROOT, "public/breeds/SOURCES.md")
PHOTOS = os.path.join(ROOT, "public/breeds")

FORCE_TITLES = {
    "english-shepherd": "Black and Tan English Shepherd, 3 Year Old Female.jpg",
    "groenendael": "Belgian Shepherd Groenendael portrait.jpg",
    "lithuanian-hound": "2023 Lithuanian Hound stamp.png",
    "molossus-of-epirus": "Greek shepherd male.jpg",
    "flat-coated-retriever": "Flat-Coated Retriever large.jpg",
}

# Commons has no live photo of this rare breed — stamp is the only on-breed image.
KNOWN_FALLBACKS = {"lithuanian-hound.jpg"}


def load_catalog():
    spec = importlib.util.spec_from_file_location("year_catalog", CATALOG)
    if spec is None or spec.loader is None:
        raise RuntimeError("could not load catalog script")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def replace_source_row(filename: str, title: str, commons: str, license_name: str, artist: str) -> None:
    with open(SOURCES, encoding="utf-8") as f:
        text = f.read()
    pattern = re.compile(rf"^\| `{re.escape(filename)}` \|.*$", re.M)
    row = f"| `{filename}` | [{title}]({commons}) | {license_name} | {artist} |"
    if not pattern.search(text):
        raise RuntimeError(f"no SOURCES.md row for {filename}")
    with open(SOURCES, "w", encoding="utf-8") as f:
        f.write(pattern.sub(row, text, count=1))


def looks_like_quadrant(path: str) -> bool:
    try:
        from PIL import Image
    except ImportError:
        return False
    with Image.open(path) as im:
        rgb = im.convert("RGB")
        w, h = rgb.size
        if w < 40 or h < 40:
            return False
        pix = rgb.load()
    mid_x, mid_y = w // 2, h // 2

    def white(x: int, y: int) -> bool:
        r, g, b = pix[x, y]
        return r > 220 and g > 220 and b > 220

    col = sum(1 for y in range(h) if white(mid_x, y)) / h
    row = sum(1 for x in range(w) if white(x, mid_y)) / w
    return col > 0.45 and row > 0.45


def main() -> None:
    cat = load_catalog()
    for slug, title in FORCE_TITLES.items():
        print(f"forcing {slug} ← {title}", flush=True)
        photo = cat.save_photo(slug, title)
        if not photo:
            print(f"  FAILED {slug}")
            continue
        print(f"  {photo['title']} ({photo['license']})")
        replace_source_row(
            photo["file"],
            photo["title"],
            photo["commons"],
            photo["license"],
            photo["artist"],
        )
        time.sleep(0.15)

    print("\nremaining skip-list hits in SOURCES.md:")
    with open(SOURCES, encoding="utf-8") as f:
        lines = f.readlines()
    hits = 0
    for line in lines:
        if not line.startswith("| `"):
            continue
        filename = line.split("`")[1]
        if filename in KNOWN_FALLBACKS:
            continue
        low = line.lower()
        matched = [s for s in cat.SKIP_PHOTO_SUBSTR if s in low]
        if matched:
            hits += 1
            print(" ", matched, line.strip()[:160])
    if hits == 0:
        print("  none")

    print("\nquadrant-scan of public/breeds:")
    found = 0
    for fn in sorted(os.listdir(PHOTOS)):
        if not fn.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        path = os.path.join(PHOTOS, fn)
        if looks_like_quadrant(path):
            found += 1
            print(" ", fn)
    if found == 0:
        print("  none")


if __name__ == "__main__":
    main()
