#!/usr/bin/env python3
"""Rewrite Daily Dog overviews from AKC breed pages, then cite AKC.

AKC is the primary source. Breeds with no AKC page keep Wikipedia.
https://www.akc.org/dog-breeds/
"""

from __future__ import annotations

import html
import json
import re
import ssl
import time
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path("/Users/brentsienko/code/sudoku")
EXTRA = ROOT / "src/lib/dailyDog/extraBreeds.json"
BREEDS_TS = ROOT / "src/lib/dailyDog/breeds.ts"
CACHE = Path("/tmp/sudoku-akc-extracts.json")
SIZE_CACHE = Path("/tmp/sudoku-akc-sizes.json")
INDEX = "https://www.akc.org/dog-breeds/"
UA = "SudogkuDailyDog/1.0 (https://sudogku.com; AKC overview source)"
CTX = ssl.create_default_context()
AKC_LABEL = "American Kennel Club"

# Sudogku id -> AKC slug when names do not line up 1:1.
ALIASES = {
    "anatolian-shepherd": "anatolian-shepherd-dog",
    "australian-silky-terrier": "silky-terrier",
    "bavarian-mountain-hound": "bavarian-mountain-scent-hound",
    "belgian-malinois": "belgian-malinois",
    "bouvier-des-ardennes": "bouvier-de-ardennes",
    "carpathian-shepherd-dog": "romanian-carpathian-shepherd",
    "chinese-crested-dog": "chinese-crested",
    "collie": "collie",
    "danish-swedish-farmdog": "danish-swedish-farmdog",
    "drentse-patrijshond": "drentsche-patrijshond",
    "english-mastiff": "mastiff",
    "english-pointer": "pointer",
    "german-shepherd": "german-shepherd-dog",
    "griffon-bruxellois": "brussels-griffon",
    "groenendael": "belgian-sheepdog",
    "hanover-hound": "hanoverian-scenthound",
    "hokkaido-inu": "hokkaido",
    "irish-wolfhound": "irish-wolfhound",
    "king-charles-spaniel": "english-toy-spaniel",
    "kishu": "kishu-ken",
    "kooikerhondje": "nederlandse-kooikerhondje",
    "laekenois": "belgian-laekenois",
    "large-vendeen-griffon-basset": "grand-basset-griffon-vendeen",
    "manchester-terrier": "manchester-terrier-standard",
    "mioritic": "romanian-mioritic-shepherd-dog",
    "nenets-herding-laika": "nenets-laika",
    "poodle": "poodle-standard",
    "saint-bernard": "st-bernard",
    "american-cocker-spaniel": "cocker-spaniel",
}

SKIP_GENERIC = {
    "dog",
    "hound",
    "spaniel",
    "terrier",
    "retriever",
    "shepherd",
    "pointer",
    "setter",
    "collie",
    "mastiff",
    "bulldog",
    "poodle",
}

CORE_IDS = [
    "golden-retriever",
    "shiba-inu",
    "pug",
    "beagle",
    "poodle",
    "pomeranian",
    "siberian-husky",
    "pembroke-welsh-corgi",
    "dalmatian",
    "greyhound",
    "basenji",
    "border-collie",
    "german-shepherd",
    "labrador-retriever",
    "french-bulldog",
    "dachshund",
    "australian-shepherd",
    "boxer",
    "chihuahua",
    "great-dane",
    "rottweiler",
    "yorkshire-terrier",
    "boston-terrier",
    "akita",
    "samoyed",
    "bernese-mountain-dog",
    "newfoundland",
    "whippet",
    "maltese",
    "saint-bernard",
    "australian-cattle-dog",
    "weimaraner",
]


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace("'", "").replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30, context=CTX) as res:
        return res.read().decode("utf-8", "replace")


def akc_slugs() -> set[str]:
    html_text = fetch(INDEX)
    slugs = set(re.findall(r"/dog-breeds/([a-z0-9-]+)/", html_text))
    slugs.discard("")
    return slugs


def match_slug(breed_id: str, name: str, slugs: set[str]) -> str | None:
    cands = [
        ALIASES.get(breed_id),
        slugify(name),
        breed_id,
        slugify(re.sub(r"\s+[Dd]og$", "", name)),
        slugify(name.replace(" Inu", "").replace(" inu", "")),
    ]
    for c in cands:
        if c and c in slugs:
            return c
    return None


def tidy_text(s: str) -> str:
    s = html.unescape(s)
    s = s.replace("\\n", " ")
    s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s)
    s = s.replace("\u009d", "").replace("\ufffd", "")
    s = s.replace("\u00bf", "—").replace("\u2014", "—").replace("\u2013", "–")
    s = s.replace("'—", "—").replace("—'", "—")
    s = s.replace("â", "'").replace("â", "'").replace("â", "—").replace("Â", "")
    try:
        s = s.encode("latin-1").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def wp_field(page: str, key: str) -> str:
    m = re.search(rf"{re.escape(key)}&quot;:&quot;(.*?)&quot;,&quot;", page)
    if not m:
        return ""
    return tidy_text(m.group(1))


def jsonld_description(page: str) -> str:
    m = re.search(r'"@type": "Dataset".*?"description": "(.*?)"', page, re.S)
    if not m:
        return ""
    return tidy_text(m.group(1).replace("&nbsp;", " "))


def wp_string(page: str, key: str) -> str:
    m = re.search(rf"{re.escape(key)}&quot;:&quot;(.*?)&quot;", page)
    if not m:
        return ""
    return tidy_text(m.group(1))


def wp_number(page: str, key: str) -> float | None:
    m = re.search(rf"{re.escape(key)}&quot;:([0-9]+(?:\.[0-9]+)?)", page)
    if m:
        return float(m.group(1))
    raw = wp_string(page, key)
    try:
        return float(raw) if raw else None
    except ValueError:
        return None


def fmt_num(x: float) -> str:
    if x == int(x):
        return str(int(x))
    return f"{x:.1f}".rstrip("0").rstrip(".")


def range_str(lo: float | None, hi: float | None, unit: str) -> str | None:
    if lo is None and hi is None:
        return None
    if lo is None:
        return f"{fmt_num(hi)} {unit}"
    if hi is None or abs(lo - hi) < 0.05:
        return f"{fmt_num(lo)} {unit}"
    if lo > hi:
        lo, hi = hi, lo
    if hi > 400:
        return f"{fmt_num(lo)} {unit}"
    return f"{fmt_num(lo)}–{fmt_num(hi)} {unit}"


def compact_size_display(raw: str, long_unit: str, short_unit: str) -> str:
    s = tidy_text(raw)
    s = re.sub(r"(\d+)\s*1\\?/2", r"\1.5", s)
    s = s.replace("\\/", "-").replace("\\", "")
    s = re.sub(r"\binches\b", "in", s, flags=re.I)
    s = re.sub(r"\bpounds?\b", "lb", s, flags=re.I)
    s = re.sub(r"\blbs\b", "lb", s, flags=re.I)
    s = re.sub(rf"\b{long_unit}\b", short_unit, s, flags=re.I)
    s = s.replace(" - ", "–").replace("-", "–")
    return re.sub(r"\s+", " ", s).strip()


def pick_size(
    numeric: str | None,
    lo: float | None,
    hi: float | None,
    display: str,
    long_unit: str,
    short_unit: str,
) -> str:
    disp = compact_size_display(display, long_unit, short_unit) if display else ""
    junk = bool(
        re.search(r"proportion|n/?a|see standard", disp, re.I)
    ) if disp else True
    if disp and len(disp) <= 56 and not junk:
        return disp
    return numeric or disp


def extract_akc_size(page: str) -> tuple[str, str]:
    """Height/weight from the AKC breed page (numeric range, else display copy)."""
    hmin = wp_number(page, "height_min")
    hmax = wp_number(page, "height_max")
    wmin = wp_number(page, "weight_min")
    wmax = wp_number(page, "weight_max")
    height = pick_size(
        range_str(hmin, hmax, "in"),
        hmin,
        hmax,
        wp_string(page, "height_display"),
        "inches",
        "in",
    )
    weight = pick_size(
        range_str(wmin, wmax, "lb"),
        wmin,
        wmax,
        wp_string(page, "weight_display"),
        "pounds",
        "lb",
    )
    return height or "", weight or ""


def extract_akc(page: str) -> str:
    parts = [
        jsonld_description(page),
        wp_field(page, "akc_org_about"),
        wp_field(page, "mp_history_job"),
    ]
    seen: set[str] = set()
    out: list[str] = []
    for p in parts:
        key = re.sub(r"[^a-z]+", "", p.lower())[:80]
        if len(p) < 40 or key in seen:
            continue
        if re.search(r"give your .+ puppy|best friend you ever had|akc marketplace", p, re.I):
            continue
        seen.add(key)
        out.append(p)
    return " ".join(out)


def split_sents(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 28]


SING_TO_PLURAL = {
    "is": "are",
    "was": "were",
    "has": "have",
    "stands": "stand",
    "comes": "come",
    "remains": "remain",
    "works": "work",
    "enjoys": "enjoy",
    "makes": "make",
    "lives": "live",
    "weighs": "weigh",
    "gives": "give",
    "takes": "take",
    "shares": "share",
    "possesses": "possess",
    "loves": "love",
}

THEY_VERBS = (
    "are|is|was|were|have|has|had|come|came|stand|stands|take|takes|"
    "move|work|works|enjoy|enjoys|make|makes|remain|remains|"
    "can|will|do|still|live|lives|hunt|guard|herd|weigh|weighs|"
    "give|gives|known|share|shares|possess|love|loves"
)


def conjugate_they(s: str) -> str:
    m = re.match(r"^They (\w+)\b", s, flags=re.I)
    if not m:
        return s
    mapped = SING_TO_PLURAL.get(m.group(1).lower())
    if not mapped:
        return s
    return re.sub(rf"^They {re.escape(m.group(1))}\b", f"They {mapped}", s, count=1, flags=re.I)


def polish_clause(s: str) -> str:
    s = re.sub(r"\bThey are is\b", "They are", s)
    s = re.sub(r"\bThey is\b", "They are", s)
    s = re.sub(r"\bThey are are\b", "They are", s)
    s = re.sub(r"\bThey are came\b", "They came", s)
    s = re.sub(r"\bThey are has\b", "They have", s)
    s = re.sub(r"\bThey are was\b", "They were", s)
    s = re.sub(r"\bThey are stands\b", "They stand", s)
    return s


def rewrite_sent(s: str, name: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s*\([^)]*\)\s*", " ", s)
    s = re.sub(rf"^(The\s+)?{re.escape(name)}s?'s\b", "Their", s, flags=re.I)
    s = re.sub(rf"^The ideal\s+{re.escape(name)}s?\b", "They", s, flags=re.I)
    s = re.sub(
        r"^There's (a |an )(.+?) to this (.+), who ",
        r"They are known for \1\2, a \3 who ",
        s,
        flags=re.I,
    )
    appositive = re.match(
        rf"^(The\s+)?{re.escape(name)}s?\s*,\s*(an?)\s+(.+?),\s+"
        rf"(stands|is|are|was|were|comes|came|has|have|remains|works|enjoys)\b(.*)$",
        s,
        flags=re.I,
    )
    if appositive:
        art, mid, verb, rest = (
            appositive.group(2),
            appositive.group(3).strip(" ,"),
            appositive.group(4).lower(),
            appositive.group(5),
        )
        verb = SING_TO_PLURAL.get(verb, verb)
        s = f"They are {art} {mid}. They {verb}{rest}"
    else:
        s = re.sub(
            rf"^(The\s+)?{re.escape(name)}s?\s*,\s*(an?)\s+",
            r"They are \2 ",
            s,
            flags=re.I,
        )
        s = re.sub(rf"^The\s+{re.escape(name)}s?\b[,\s]*", "They ", s, flags=re.I)
    s = conjugate_they(s)
    s = re.sub(r"^They ,? ?(an|a)\s+", r"They are \1 ", s, flags=re.I)
    s = re.sub(r"^They's ", "They are a ", s)
    s = re.sub(r"^There's ", "They have ", s)
    s = re.sub(r"^There is ", "They have ", s)
    s = re.sub(r"^This (sleek-coated |powerful |breed )", "They are a ", s, flags=re.I)
    s = re.sub(r"^(His|Her)\b", "Their", s)
    s = re.sub(r"\bhe’ll\b", "they’ll", s, flags=re.I)
    s = re.sub(r"\bhe’s\b", "they’re", s, flags=re.I)
    s = re.sub(r"\bhe loves\b", "they love", s, flags=re.I)
    s = re.sub(r"\bhe is\b", "they are", s, flags=re.I)
    s = re.sub(r"\bHe\b", "They", s)
    if re.match(r"^(is|are|was|were)\b", s, re.I):
        mapped = {"is": "are", "are": "are", "was": "were", "were": "were"}[s.split()[0].lower()]
        s = "They " + mapped + s[s.find(" ") :]
    if re.match(r"^They [a-z]", s) and not re.match(rf"^They ({THEY_VERBS})\b", s, re.I):
        s = "They are " + s[5:]
    s = polish_clause(s)
    if not s.endswith((".", "!", "?")):
        s += "."
    s = s[0].upper() + s[1:]
    s = polish_clause(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def boring(s: str) -> bool:
    low = s.lower()
    if len(s) < 36:
        return True
    if re.search(r"puppy|marketplace|register|parent club|health test|hip evaluation", low):
        return True
    if re.search(r"this article|click here|read more|breed contact|www\.|@", low):
        return True
    if re.search(r"over 340 dog breeds|recognizes 200 breeds", low):
        return True
    if re.search(r"email:|club of america", low):
        return True
    return False


def two_paragraphs(name: str, origin: str, extract: str) -> str:
    sents = [rewrite_sent(s, name) for s in split_sents(extract)]
    sents = [s for s in sents if not boring(s)]
    unique: list[str] = []
    seen: set[str] = set()
    for s in sents:
        key = re.sub(r"[^a-z]+", "", s.lower())[:70]
        if key in seen:
            continue
        seen.add(key)
        unique.append(s)
        if len(unique) >= 5:
            break
    if not unique:
        place = origin or "their homeland"
        return (
            f"The {name} is a dog the American Kennel Club profiles as a distinct breed, "
            f"with a history rooted in {place}.\n\n"
            f"The AKC breed overview is the first place to read what they were kept to do, "
            f"and how that still shows up in a household."
        )
    if len(unique) == 1:
        p1, p2 = unique[0], (
            f"That AKC picture still holds: a {name} wants the work and company the breed was made for, "
            f"not a life with nothing to do."
        )
    elif len(unique) == 2:
        p1, p2 = unique[0], unique[1]
    else:
        p1 = " ".join(unique[:2])
        p2 = " ".join(unique[2:4]) if len(unique) > 3 else unique[2]
    p1 = polish_clause(re.sub(r"\s+", " ", p1).strip())
    p2 = polish_clause(re.sub(r"\s+", " ", p2).strip())
    return f"{p1}\n\n{p2}"


def patch_ts_field(text: str, breed_id: str, field: str, value: str) -> str:
    payload = json.dumps(value, ensure_ascii=False)
    pattern = re.compile(
        rf'(id: "{re.escape(breed_id)}"[\s\S]*?{field}:\s*)"(?:\\.|[^"\\])*"',
    )
    new, n = pattern.subn(lambda m: m.group(1) + payload, text, count=1)
    if n != 1:
        raise SystemExit(f"could not patch {field} for {breed_id} (n={n})")
    return new


def load_cache() -> dict[str, str]:
    if CACHE.exists():
        return json.loads(CACHE.read_text())
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2))


def load_size_cache() -> dict[str, dict[str, str]]:
    if SIZE_CACHE.exists():
        return json.loads(SIZE_CACHE.read_text())
    return {}


def save_size_cache(cache: dict[str, dict[str, str]]) -> None:
    SIZE_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2))


def size_from_page_or_cache(
    url: str, sizes: dict[str, dict[str, str]]
) -> tuple[str, str] | None:
    cached = sizes.get(url) or {}
    if cached.get("height") and cached.get("weight"):
        return cached["height"], cached["weight"]
    try:
        page = fetch(url)
    except Exception as err:
        print("fail", url, err)
        return None
    time.sleep(0.25)
    height, weight = extract_akc_size(page)
    if not height and not weight:
        return None
    sizes[url] = {"height": height, "weight": weight}
    save_size_cache(sizes)
    return height, weight


def apply_akc_sizes() -> None:
    """Overwrite height/weight from AKC pages. Wikipedia-only rows are left alone."""
    slugs = akc_slugs()
    extra = json.loads(EXTRA.read_text())
    sizes = load_size_cache()
    ts = BREEDS_TS.read_text()
    names = dict(re.findall(r'id: "([^"]+)"[\s\S]*?name: "([^"]+)"', ts))
    updated = 0
    skipped = 0

    for breed_id in CORE_IDS:
        name = names.get(breed_id, breed_id)
        slug = match_slug(breed_id, name, slugs)
        if not slug:
            skipped += 1
            print("core miss", breed_id)
            continue
        url = f"https://www.akc.org/dog-breeds/{slug}/"
        pair = size_from_page_or_cache(url, sizes)
        if not pair:
            skipped += 1
            print("core no size", breed_id)
            continue
        height, weight = pair
        if height:
            ts = patch_ts_field(ts, breed_id, "height", height)
        if weight:
            ts = patch_ts_field(ts, breed_id, "weight", weight)
        updated += 1
        print("core", breed_id, height, weight)

    BREEDS_TS.write_text(ts)

    for row in extra:
        slug = match_slug(row["id"], row["name"], slugs)
        if not slug:
            skipped += 1
            continue
        url = f"https://www.akc.org/dog-breeds/{slug}/"
        pair = size_from_page_or_cache(url, sizes)
        if not pair:
            skipped += 1
            print("extra no size", row["id"])
            continue
        height, weight = pair
        if height:
            row["height"] = height
        if weight:
            row["weight"] = weight
        updated += 1
        print("extra", row["id"], height, weight)

    EXTRA.write_text(json.dumps(extra, indent=2, ensure_ascii=False) + "\n")
    print("sized", updated, "skipped", skipped)


def main() -> None:
    if "--sizes-only" in __import__("sys").argv:
        apply_akc_sizes()
        return
    extras_only = "--extras-only" in __import__("sys").argv
    slugs = akc_slugs()
    extra = json.loads(EXTRA.read_text())
    cache = load_cache()
    matched = 0
    skipped = 0

    ts = BREEDS_TS.read_text()
    if not extras_only:
        # Core names from the TypeScript file.
        names = dict(
            re.findall(r'id: "([^"]+)"[\s\S]*?name: "([^"]+)"', ts),
        )
        for breed_id in CORE_IDS:
            name = names.get(breed_id, breed_id)
            slug = match_slug(breed_id, name, slugs)
            if not slug:
                skipped += 1
                print("core miss", breed_id)
                continue
            url = f"https://www.akc.org/dog-breeds/{slug}/"
            extract = tidy_text(cache.get(url, "") or "")
            if len(extract) < 80:
                time.sleep(0.35)
                page = fetch(url)
                extract = extract_akc(page)
                cache[url] = extract
                save_cache(cache)
            story = two_paragraphs(name, "", extract)
            ts = patch_ts_field(ts, breed_id, "sourceUrl", url)
            ts = patch_ts_field(ts, breed_id, "sourceLabel", AKC_LABEL)
            ts = patch_ts_field(ts, breed_id, "story", story)
            matched += 1
            print("core", breed_id, "->", slug, len(extract))
        BREEDS_TS.write_text(ts)

    for row in extra:
        slug = match_slug(row["id"], row["name"], slugs)
        if not slug:
            skipped += 1
            continue
        url = f"https://www.akc.org/dog-breeds/{slug}/"
        extract = tidy_text(cache.get(url, "") or "")
        if len(extract) < 80:
            time.sleep(0.35)
            try:
                page = fetch(url)
            except Exception as err:
                print("fail", row["id"], err)
                skipped += 1
                continue
            extract = extract_akc(page)
            cache[url] = extract
            save_cache(cache)
        if len(extract) < 80:
            print("thin", row["id"], slug, len(extract))
            skipped += 1
            continue
        row["story"] = two_paragraphs(row["name"], row.get("origin") or "", extract)
        row["sourceUrl"] = url
        row["sourceLabel"] = AKC_LABEL
        matched += 1
        print("extra", row["id"], "->", slug)

    EXTRA.write_text(json.dumps(extra, indent=2, ensure_ascii=False) + "\n")
    print("matched", matched, "left on wikipedia", skipped)


if __name__ == "__main__":
    main()
