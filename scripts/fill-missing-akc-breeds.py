#!/usr/bin/env python3
"""Replace Wikipedia-only extras with missing AKC breed pages.

Keeps the extra list length (and near-term calendar) stable. Run
akc-daily-dog-stories.py afterward for overviews.
https://www.akc.org/dog-breeds/
"""

from __future__ import annotations

import importlib.util
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

ROOT = Path("/Users/brentsienko/code/sudoku")
EXTRA = ROOT / "src/lib/dailyDog/extraBreeds.json"
SOURCES = ROOT / "public/breeds/SOURCES.md"


def load_mod(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


akc = load_mod(ROOT / "scripts/akc-daily-dog-stories.py", "akc_stories")
yearcat = load_mod(ROOT / "scripts/build-year-catalog.py", "yearcat")

JUNK_SLUGS = {
    "best-dogs-for-apartment-dwellers",
    "best-dogs-for-kids",
    "best-family-dogs",
    "best-guard-dogs",
    "foundation-stock-service",
    "hairless-dog-breeds",
    "herding",
    "hound",
    "hypoallergenic-dogs",
    "largest-dog-breeds",
    "medium-dog-breeds",
    "miscellaneous-class",
    "non-sporting",
    "page",
    "smallest-dog-breeds",
    "smartest-dogs",
    "sporting",
    "terrier",
    "toy",
    "working",
}

# Extra IDs on the 2026 calendar from Sep 8 through Oct 22 (do not swap these).
PROTECTED_IDS = {
    "abyssinian-sand-terrier",
    "american-hairless-terrier",
    "american-pit-bull-terrier",
    "american-staffordshire-terrier",
    "argentine-pila-dog",
    "armant-dog",
    "australian-silky-terrier",
    "azawakh",
    "basset-hound",
    "beauceron",
    "belgian-malinois",
    "black-and-tan-coonhound",
    "blue-gascony-griffon",
    "blue-picardy-spaniel",
    "boerboel",
    "bouvier-des-flandres",
    "bull-and-terrier",
    "buryat-mongolian-wolfhound",
    "can-de-palleiro",
    "canaan-dog",
    "chippiparai",
    "dogo-argentino",
    "drentse-patrijshond",
    "east-siberian-laika",
    "finnish-spitz",
    "galgo-espa-ol",
    "gascon-saintongeois",
    "great-anglo-french-tricolour-hound",
    "great-anglo-french-white-and-black-hound",
    "greek-shepherd",
    "griffon-nivernais",
    "halden-hound",
    "hamiltonst-vare",
    "himalayan-sheepdog",
    "istrian-coarse-haired-hound",
    "kai-ken",
    "kooikerhondje",
    "landseer",
    "lapponian-herder",
    "large-vendeen-griffon-basset",
    "limer",
    "magyar-ag-r",
    "maneto",
    "moscow-watchdog",
    "norrbottenspets",
}


def fetch_json_fast(url: str) -> dict:
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": yearcat.UA, "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, context=yearcat.CTX, timeout=12) as r:
                return json.loads(r.read().decode())
        except Exception as err:
            last = err
            time.sleep(0.4 * (attempt + 1))
    raise last  # type: ignore[misc]


yearcat.fetch_json = fetch_json_fast


def option_names(index_html: str) -> dict[str, str]:
    names: dict[str, str] = {}
    for url, name in re.findall(
        r'<option[^>]*value="(https://www.akc.org/dog-breeds/[^"]+)"[^>]*>([^<]+)</option>',
        index_html,
    ):
        slug = url.rstrip("/").rsplit("/", 1)[-1]
        names[slug] = name.strip()
    return names


def wiki_origin(name: str) -> tuple[str, str]:
    for title in (f"{name} (dog)", name):
        url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title)
        try:
            data = yearcat.fetch_json(url)
        except Exception:
            continue
        extract = (data.get("extract") or "").strip()
        if len(extract) < 40:
            continue
        origin = ""
        m = re.search(
            r"(?:originat(?:ed|ing)|from|developed in)\s+(?:the\s+)?([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})",
            extract,
        )
        if m:
            origin = m.group(1)
        return origin or "Unknown", extract
    return "Unknown", ""


def main() -> None:
    extra = json.loads(EXTRA.read_text())
    print("loading AKC index…", flush=True)
    index_html = akc.fetch(akc.INDEX)
    slugs = set(re.findall(r"/dog-breeds/([a-z0-9-]+)/", index_html))
    slugs.discard("")
    names = option_names(index_html)

    used: set[str] = set()
    ts = (ROOT / "src/lib/dailyDog/breeds.ts").read_text()
    core = re.findall(r'id: "([^"]+)"[\s\S]*?name: "([^"]+)"', ts)[:32]
    for breed_id, name in core:
        slug = akc.match_slug(breed_id, name, slugs)
        if slug:
            used.add(slug)
    for row in extra:
        slug = akc.match_slug(row["id"], row["name"], slugs)
        if slug:
            used.add(slug)

    missing = []
    for slug in sorted(slugs - used - JUNK_SLUGS):
        name = names.get(slug)
        if not name or name.lower().startswith("select"):
            continue
        missing.append((slug, name))

    replaceable = [
        i
        for i, row in enumerate(extra)
        if row.get("sourceLabel") != "American Kennel Club"
        and row["id"] not in PROTECTED_IDS
    ]
    print("missing AKC pages", len(missing), "replaceable extras", len(replaceable), flush=True)

    photo_rows = []
    filled = 0
    for slug, name in missing:
        if filled >= len(replaceable):
            break
        idx = replaceable[filled]
        print(f"[{filled + 1}/{min(len(missing), len(replaceable))}] {name} -> {slug}", flush=True)
        origin, extract = "Unknown", ""
        origin = yearcat.display_origin(origin)
        if origin.lower() in {"a faraway kennel", ""}:
            origin = "Unknown"
        height, weight = "", ""
        bark = yearcat.size_and_bark(name, "")[2]
        try:
            page = akc.fetch(f"https://www.akc.org/dog-breeds/{slug}/")
            height, weight = akc.extract_akc_size(page)
        except Exception as err:
            print("  size fail", err)
        if not height or not weight:
            h2, w2, bark = yearcat.size_and_bark(name, extract)
            height = height or h2
            weight = weight or w2
        lat, lng = yearcat.coords_for(origin, name)
        try:
            photo = yearcat.download_photo(slug, name)
        except Exception as err:
            print("  photo fail", err)
            photo = None
        if not photo:
            print("  skip, no photo")
            time.sleep(0.2)
            continue
        time.sleep(0.15)
        extra[idx] = {
            "id": slug,
            "name": name,
            "origin": origin,
            "height": height,
            "weight": weight,
            "image": f"/breeds/{slug}.jpg",
            "pronunciation": yearcat.pronunciation(name),
            "lat": lat,
            "lng": lng,
            "bark": bark,
            "sourceUrl": f"https://www.akc.org/dog-breeds/{slug}/",
            "sourceLabel": "American Kennel Club",
            "intro": yearcat.make_intro(name, origin, idx),
            "story": (
                f"The {name} is one of the breeds the American Kennel Club profiles "
                f"on its official breed list.\n\n"
                f"See the AKC overview for the work they were kept to do, and how that "
                f"still shows up at home."
            ),
        }
        photo_rows.append(photo)
        try:
            yearcat.say_name(slug, name)
        except Exception as err:
            print("  say failed", err)
        filled += 1
        if filled % 8 == 0:
            EXTRA.write_text(json.dumps(extra, indent=2, ensure_ascii=False) + "\n")

    EXTRA.write_text(json.dumps(extra, indent=2, ensure_ascii=False) + "\n")
    if photo_rows:
        with SOURCES.open("a") as f:
            f.write("\n## AKC catalog fill\n\n")
            f.write("| File | Commons title | License | Author |\n|---|---|---|---|\n")
            for row in photo_rows:
                f.write(
                    f"| `{row['file']}` | [{row['title']}]({row['commons']}) | {row['license']} | {row['artist']} |\n"
                )
    print("replaced", filled, "wikipedia extras with AKC breeds")


if __name__ == "__main__":
    main()
