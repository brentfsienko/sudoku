#!/usr/bin/env python3
"""Build extra Daily Dog catalog to reach 365 unique breeds."""

from __future__ import annotations

import json
import os
import re
import ssl
import subprocess
import time
import urllib.parse
import urllib.request

ROOT = "/Users/brentsienko/code/sudoku"
DEST_JSON = os.path.join(ROOT, "src/lib/dailyDog/extraBreeds.json")
DEST_PHOTOS = os.path.join(ROOT, "public/breeds")
DEST_NAMES = os.path.join(ROOT, "public/sounds/names")
SOURCES = os.path.join(DEST_PHOTOS, "SOURCES.md")
NEED = 333

UA = "SudogkuDailyDog/1.0 (https://playsudogku.com; year catalog)"
CTX = ssl.create_default_context()

CORE_NAMES = {
    "golden retriever",
    "shiba inu",
    "pug",
    "beagle",
    "poodle",
    "pomeranian",
    "siberian husky",
    "pembroke welsh corgi",
    "dalmatian",
    "greyhound",
    "basenji",
    "border collie",
    "german shepherd",
    "labrador retriever",
    "french bulldog",
    "dachshund",
    "australian shepherd",
    "boxer",
    "chihuahua",
    "great dane",
    "rottweiler",
    "yorkshire terrier",
    "boston terrier",
    "akita",
    "samoyed",
    "bernese mountain dog",
    "newfoundland",
    "whippet",
    "maltese",
    "saint bernard",
    "st. bernard",
    "st bernard",
    "australian cattle dog",
    "weimaraner",
}

SKIP_SUBSTR = (
    "list of",
    "extinct",
    "crossbreed",
    "hybrid",
    "kitler",
    "village dog",
)

SKIP_PHOTO_SUBSTR = (
    "map",
    "flag",
    "coat of arms",
    "coat variation",
    "varieties",
    "collage",
    "composite",
    "montage",
    "comparison",
    "compiled",
    "diagram",
    "chart",
    "infographic",
    "anatomy",
    "skeleton",
    "heart (",
    "stamp",
    "statue",
    " group",
    "litter",
    "puppies",
    "canis lupus",
    "terriers.jpg",
    "zemaitukas",
    "žemaitukas",
    "1,50euro",
    "line art",
    "engraving",
    "conformation line",
    "baculum",
    "oil on canvas",
)

ORIGIN_DISPLAY = {
    "people's republic of china": "China",
    "republic of china": "Taiwan",
    "united kingdom": "the United Kingdom",
    "united states of america": "the United States",
    "united states": "the United States",
    "kingdom of the netherlands": "the Netherlands",
    "netherlands": "the Netherlands",
    "czech republic": "the Czech Republic",
    "czechia": "the Czech Republic",
    "russia": "Russia",
    "russian federation": "Russia",
}

INTROS = [
    "Coming all the way from {origin}, is the {name}.",
    "Hello pups, today’s daily dog is the {name}.",
    "And today we have the {name}.",
    "Please welcome, from {origin}, the {name}.",
    "Straight from {origin}, meet the {name}.",
    "Today’s guest of honor: the {name}.",
    "From {origin} with a wag, here comes the {name}.",
    "Say hello to the {name}, a {origin} original.",
    "Rolling in from {origin}: the {name}.",
    "Pups, gather round — it’s the {name}.",
    "A {origin} classic takes the stage: the {name}.",
    "Fresh from {origin}, today’s daily dog is the {name}.",
]

COUNTRY_COORDS = {
    "germany": (51.2, 10.4),
    "france": (46.2, 2.2),
    "united kingdom": (54.0, -2.5),
    "england": (52.5, -1.5),
    "scotland": (56.5, -4.2),
    "wales": (52.4, -3.8),
    "ireland": (53.4, -8.0),
    "united states": (39.8, -98.6),
    "united states of america": (39.8, -98.6),
    "canada": (56.1, -106.3),
    "mexico": (23.6, -102.5),
    "japan": (36.2, 138.2),
    "china": (35.9, 104.2),
    "people's republic of china": (35.9, 104.2),
    "australia": (-25.3, 133.8),
    "new zealand": (-41.5, 172.8),
    "italy": (42.8, 12.6),
    "spain": (40.4, -3.7),
    "portugal": (39.4, -8.2),
    "netherlands": (52.1, 5.3),
    "belgium": (50.5, 4.5),
    "switzerland": (46.8, 8.2),
    "austria": (47.6, 14.1),
    "poland": (52.1, 19.4),
    "hungary": (47.2, 19.5),
    "czech republic": (49.8, 15.5),
    "czechia": (49.8, 15.5),
    "slovakia": (48.7, 19.7),
    "sweden": (62.0, 15.0),
    "norway": (64.5, 11.5),
    "finland": (64.0, 26.0),
    "denmark": (56.3, 9.5),
    "russia": (61.5, 90.0),
    "russian federation": (61.5, 90.0),
    "ukraine": (49.0, 32.0),
    "turkey": (39.0, 35.0),
    "india": (22.4, 79.0),
    "afghanistan": (33.9, 67.7),
    "iran": (32.4, 53.7),
    "israel": (31.0, 35.0),
    "egypt": (26.8, 30.8),
    "morocco": (31.8, -7.1),
    "south africa": (-29.0, 25.0),
    "brazil": (-14.2, -51.9),
    "argentina": (-38.4, -63.6),
    "chile": (-35.7, -71.5),
    "peru": (-9.2, -75.0),
    "croatia": (45.1, 15.2),
    "serbia": (44.0, 21.0),
    "romania": (45.9, 25.0),
    "bulgaria": (42.7, 25.5),
    "greece": (39.1, 21.8),
    "malta": (35.9, 14.4),
    "iceland": (64.9, -19.0),
    "greenland": (71.7, -42.6),
    "alaska": (64.2, -153.5),
    "tibet": (31.7, 86.9),
    "mongolia": (46.9, 103.8),
    "korea": (36.5, 127.9),
    "south korea": (36.5, 127.9),
    "north korea": (40.3, 127.4),
    "thailand": (15.9, 100.9),
    "vietnam": (14.1, 108.3),
    "philippines": (12.9, 121.8),
    "taiwan": (23.7, 121.0),
    "indonesia": (-2.5, 118.0),
    "madagascar": (-18.8, 46.9),
    "ethiopia": (9.1, 40.5),
    "kenya": (0.0, 37.9),
    "nigeria": (9.1, 8.7),
    "central african republic": (6.6, 20.9),
    "congo": (-0.2, 15.8),
    "slovenia": (46.2, 14.8),
    "estonia": (58.6, 25.0),
    "latvia": (56.9, 24.6),
    "lithuania": (55.2, 23.9),
    "belarus": (53.7, 27.95),
    "georgia": (42.3, 43.4),
    "armenia": (40.1, 45.0),
    "azerbaijan": (40.1, 47.6),
    "kazakhstan": (48.0, 67.0),
    "pakistan": (30.4, 69.3),
    "nepal": (28.4, 84.1),
    "sri lanka": (7.9, 80.8),
    "cuba": (21.5, -77.8),
    "jamaica": (18.1, -77.3),
    "haiti": (19.0, -72.3),
    "puerto rico": (18.2, -66.6),
    "colombia": (4.6, -74.3),
    "venezuela": (6.4, -66.6),
    "uruguay": (-32.5, -55.8),
    "paraguay": (-23.4, -58.4),
    "bolivia": (-16.3, -63.6),
    "ecuador": (-1.8, -78.2),
}


def coords_for(origin: str, name: str) -> tuple[float, float]:
    key = (origin or "").strip().lower()
    if key in COUNTRY_COORDS:
        return COUNTRY_COORDS[key]
    for part, pair in COUNTRY_COORDS.items():
        if part in key or key in part:
            return pair
    # stable fallback so the pin isn't always the same spot
    h = sum(ord(c) for c in name)
    return round(20 + (h % 40) - 10, 2), round((h % 160) - 80, 2)


def fetch_json(url: str) -> dict:
    last = None
    for attempt in range(5):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": UA, "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            last = e
            time.sleep(1.2 * (attempt + 1))
    raise last  # type: ignore[misc]


def slugify(name: str) -> str:
    s = name.lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[’'`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def display_origin(raw: str) -> str:
    if not raw:
        return "a faraway kennel"
    key = raw.strip().lower()
    if key in ORIGIN_DISPLAY:
        return ORIGIN_DISPLAY[key]
    # Drop "Kingdom of" noise
    return raw.strip()


def pronunciation(name: str) -> str:
    parts = []
    for word in name.replace("-", " ").split():
        if len(word) <= 4:
            parts.append(word.upper())
        else:
            parts.append(word.upper())
    return " ".join(parts)


def size_and_bark(name: str, extract: str) -> tuple[str, str, str]:
    blob = f"{name} {extract}".lower()
    inches = re.findall(r"(\d{1,2})\s*(?:to|–|-)\s*(\d{1,2})\s*(?:in|inches)", blob)
    pounds = re.findall(r"(\d{1,3})\s*(?:to|–|-)\s*(\d{1,3})\s*(?:lb|pounds)", blob)
    height = f"{inches[0][0]}–{inches[0][1]} in" if inches else None
    weight = f"{pounds[0][0]}–{pounds[0][1]} lb" if pounds else None

    giant = any(
        w in blob
        for w in (
            "mastiff",
            "wolfhound",
            "great dane",
            "leonberger",
            "cane corso",
            "boerboel",
            "dogue",
            "pyrenees",
            "mountain dog",
            "saint bernard",
            "newfoundland",
            "irish wolfhound",
            "scottish deerhound",
            "kangal",
            "anatolian",
            "tosa",
            "fila",
            "dogo",
        )
    )
    toy = any(
        w in blob
        for w in (
            "toy",
            "teacup",
            "papillon",
            "havanese",
            "bichon",
            "japanese chin",
            "pekingese",
            "maltese",
            "yorkshire",
            "pomeranian",
            "chihuahua",
            "miniature pinscher",
            "affenspinscher",
            "affenpinscher",
            "brussels griffon",
            "italian greyhound",
        )
    )
    howl = any(
        w in blob
        for w in (
            "husky",
            "malamute",
            "elkhound",
            "laika",
            "samoyed",
            "akita",
            "spitz",
            "eskimo",
            "inuit",
            "greenland",
        )
    )

    if giant:
        height = height or "26–32 in"
        weight = weight or "90–170 lb"
        bark = "deep"
    elif toy:
        height = height or "7–13 in"
        weight = weight or "4–16 lb"
        bark = "yap"
    elif "terrier" in blob and "airedale" not in blob:
        height = height or "10–16 in"
        weight = weight or "12–25 lb"
        bark = "yap" if "toy" in blob or "mini" in blob else "woof"
    else:
        height = height or "18–24 in"
        weight = weight or "35–70 lb"
        bark = "woof"
    if howl:
        bark = "howl"
    return height, weight, bark


def make_intro(name: str, origin: str, i: int) -> str:
    tmpl = INTROS[i % len(INTROS)]
    return tmpl.format(name=name, origin=origin)


def make_story(name: str, origin: str, height: str, weight: str, extract: str) -> str:
    text = (extract or "").strip()
    text = re.sub(r"\[[^\]]*\]", "", text)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 20]
    kept = []
    for s in sentences[:2]:
        s = re.sub(rf"^The\s+{re.escape(name)}s?\s+", "They ", s, flags=re.I)
        s = re.sub(r"^They is ", "They are ", s)
        kept.append(s if s.endswith((".", "!", "?")) else s + ".")
    flavor = " ".join(kept)
    if not flavor:
        flavor = f"They were shaped by life in {origin}, where work and weather wrote the breed standard."
    return (
        f"{flavor} Most stand about {height} and weigh {weight}. "
        f"A good {name} still likes a job that feels like the old days — even if today’s job is a walk, a puzzle, or guarding the couch."
    )


def wikidata_breeds() -> list[dict]:
    query = """
    SELECT ?item ?itemLabel ?originLabel ?article WHERE {
      ?item wdt:P31 wd:Q39367 .
      OPTIONAL { ?item wdt:P495 ?origin . }
      OPTIONAL {
        ?article schema:about ?item ;
                 schema:isPartOf <https://en.wikipedia.org/> .
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 800
    """
    url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode(
        {"query": query, "format": "json"}
    )
    data = fetch_json(url)
    out = []
    seen = set()
    for b in data["results"]["bindings"]:
        name = b["itemLabel"]["value"].strip()
        if name.startswith("Q") and name[1:].isdigit():
            continue
        if len(name) < 3 or name.lower() in {"dog", "dog breed", "hound", "terrier", "spaniel"}:
            continue
        key = name.lower()
        if key in seen or key in CORE_NAMES:
            continue
        if any(s in key for s in SKIP_SUBSTR):
            continue
        if key in {"dingo", "coyote", "gray wolf", "grey wolf", "wolf"} or (
            " wolf" in key and "wolfhound" not in key
        ):
            continue
        if key.endswith(" cur"):
            continue
        wiki = b.get("article", {}).get("value", "")
        if not wiki or "List_of" in wiki:
            continue
        origin = b.get("originLabel", {}).get("value", "")
        lat, lng = coords_for(origin, name)
        seen.add(key)
        out.append(
            {
                "name": name,
                "origin_raw": origin,
                "lat": lat,
                "lng": lng,
                "wiki": wiki,
            }
        )
    out.sort(key=lambda r: r["name"].lower())
    return out


def wiki_title(wiki_url: str) -> str:
    return urllib.parse.unquote(wiki_url.rsplit("/", 1)[-1])


def wiki_summary(title: str) -> str:
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title)
    try:
        data = fetch_json(url)
    except Exception:
        return ""
    return (data.get("extract") or "").strip()


def imageinfo(title: str) -> dict | None:
    q = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|mime",
            "iiurlwidth": "480",
            "titles": "File:" + title,
            "origin": "*",
        }
    )
    data = fetch_json("https://commons.wikimedia.org/w/api.php?" + q)
    for page in data.get("query", {}).get("pages", {}).values():
        infos = page.get("imageinfo")
        if infos:
            return infos[0] | {"commons_title": page.get("title", title)}
    return None


def search_commons(query: str) -> str | None:
    q = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "list": "search",
            "srnamespace": "6",
            "srsearch": query,
            "srlimit": "20",
            "origin": "*",
        }
    )
    data = fetch_json("https://commons.wikimedia.org/w/api.php?" + q)
    for h in data.get("query", {}).get("search", []):
        title = h["title"].replace("File:", "")
        low = title.lower()
        if not any(low.endswith(ext) for ext in (".jpg", ".jpeg", ".png")):
            continue
        if any(s in low for s in SKIP_PHOTO_SUBSTR):
            continue
        if re.search(r"\b18\d{2}\b", low):
            continue
        if any(s in low for s in ("frog", "glyphoglossus", "molossus molossus")):
            continue
        qlow = query.lower()
        if "german shepherd" in low and "german shepherd" not in qlow:
            continue
        info = imageinfo(title)
        if not info:
            continue
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        artist = ((info.get("extmetadata") or {}).get("Artist") or {}).get("value", "")
        if "museum of veterinary" in artist.lower():
            continue
        return title
    return None


def save_photo(slug: str, title: str) -> dict | None:
    out = os.path.join(DEST_PHOTOS, slug + ".jpg")
    info = imageinfo(title)
    if not info:
        return None
    if info.get("mime") not in ("image/jpeg", "image/png"):
        return None
    url = info.get("thumburl") or info.get("url")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=CTX, timeout=60) as r:
        blob = r.read()
    if len(blob) < 4000:
        return None
    with open(out, "wb") as f:
        f.write(blob)
    meta = info.get("extmetadata") or {}
    license_name = (meta.get("LicenseShortName") or {}).get("value", "")
    artist = (meta.get("Artist") or {}).get("value", "")
    artist = re.sub(r"<[^>]+>", "", artist).strip()[:80]
    commons = "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(
        (info.get("commons_title") or ("File:" + title)).replace(" ", "_")
    )
    return {
        "file": slug + ".jpg",
        "title": title,
        "license": license_name,
        "artist": artist,
        "commons": commons,
    }


def download_photo(slug: str, breed_name: str) -> dict | None:
    title = search_commons(f"{breed_name} dog")
    if not title:
        title = search_commons(breed_name)
    if not title:
        return None
    return save_photo(slug, title)


def say_name(slug: str, name: str) -> None:
    aiff = os.path.join(DEST_NAMES, slug + ".aiff")
    out = os.path.join(DEST_NAMES, slug + ".m4a")
    if os.path.exists(out) and os.path.getsize(out) > 2000:
        return
    subprocess.check_call(["say", "-v", "Samantha", "-r", "140", "-o", aiff, name])
    subprocess.check_call(["afconvert", "-f", "m4af", "-d", "aac", aiff, out])
    os.remove(aiff)


def main() -> None:
    os.makedirs(DEST_PHOTOS, exist_ok=True)
    os.makedirs(DEST_NAMES, exist_ok=True)
    extra = []
    if os.path.exists(DEST_JSON):
        extra = json.load(open(DEST_JSON))
        print("resume with", len(extra), "already saved")
    photo_rows = []
    used_slugs = {r["id"] for r in extra}
    for fn in os.listdir(DEST_PHOTOS):
        if fn.endswith(".jpg"):
            used_slugs.add(fn[:-4])

    print("query wikidata…")
    candidates = wikidata_breeds()
    print("candidates", len(candidates))

    for cand in candidates:
        if len(extra) >= NEED:
            break
        name = cand["name"]
        slug = slugify(name)
        if not slug or slug in used_slugs:
            continue
        title = wiki_title(cand["wiki"])
        print(f"[{len(extra)+1}/{NEED}] {name}")
        try:
            extract = wiki_summary(title)
            time.sleep(0.05)
            low = extract.lower()
            if any(
                p in low
                for p in (
                    "extinct",
                    "no longer exist",
                    "unknown if any examples still exist",
                    "is a fictional",
                )
            ):
                print("  skip extinct/fictional")
                continue
            origin = display_origin(cand["origin_raw"])
            height, weight, bark = size_and_bark(name, extract)
            photo = download_photo(slug, name)
            time.sleep(0.15)
            if not photo:
                print("  skip, no photo")
                continue
            origin_label = cand["origin_raw"] or origin
            if origin_label.lower() in {"a faraway kennel", ""}:
                origin_label = "Unknown"
            record = {
                "id": slug,
                "name": name,
                "origin": origin_label,
                "height": height,
                "weight": weight,
                "image": f"/breeds/{slug}.jpg",
                "pronunciation": pronunciation(name),
                "lat": cand["lat"],
                "lng": cand["lng"],
                "bark": bark,
                "sourceUrl": cand["wiki"],
                "sourceLabel": "Wikipedia",
                "intro": make_intro(name, origin, len(extra)),
                "story": make_story(name, origin, height, weight, extract),
            }
            extra.append(record)
            used_slugs.add(slug)
            photo_rows.append(photo)
            try:
                say_name(slug, name)
            except subprocess.CalledProcessError as e:
                print("  say failed", e)
            if len(extra) % 10 == 0:
                with open(DEST_JSON, "w") as f:
                    json.dump(extra, f, indent=2, ensure_ascii=False)
                    f.write("\n")
        except Exception as e:
            print("  fail", e)
            continue

    with open(DEST_JSON, "w") as f:
        json.dump(extra, f, indent=2, ensure_ascii=False)
        f.write("\n")

    if photo_rows:
        with open(SOURCES, "a") as f:
            f.write("\n## Year catalog (continued)\n\n")
            f.write("| File | Commons title | License | Author |\n|---|---|---|---|\n")
            for row in photo_rows:
                f.write(
                    f"| `{row['file']}` | [{row['title']}]({row['commons']}) | {row['license']} | {row['artist']} |\n"
                )

    print("wrote", len(extra), "extra breeds")


if __name__ == "__main__":
    main()
