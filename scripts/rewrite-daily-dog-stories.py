#!/usr/bin/env python3
"""Rewrite Daily Dog extra catalog stories into readable, informative prose."""

from __future__ import annotations

import json
import re
from pathlib import Path

PATH = Path("/Users/brentsienko/code/sudoku/src/lib/dailyDog/extraBreeds.json")

CLOSERS = [
    "They still make the most sense with a job, even if today’s job is a long walk and a person who likes mud.",
    "House life suits them when they get to use the body and brain they were built with.",
    "A bored one will invent work — usually involving your shoes, the yard, or both.",
    "Give them purpose and company and the old working dog shows up in a modern house.",
    "They are happiest when the day has a task in it, not just a food bowl.",
    "Leave them idle and you will meet the working breed the hard way.",
    "A good home still looks a lot like a partnership, not a decoration on a rug.",
    "They want a person, a purpose, and enough room to be themselves.",
]

OPENERS = {
    "guardian": "These dogs grew up beside the flock, a living fence more than a pet.",
    "herding": "They were bred to move livestock with brain and stamina, not brute force.",
    "sighthound": "They hunt by sight: a flash of motion can still light the afterburners.",
    "scenthound": "A nose like this was the whole point — they follow a trail the way other dogs follow a ball.",
    "terrier": "This is a vermin specialist at heart, bold for its size and not easily impressed.",
    "retriever": "They were built to fetch from water and cover, with a soft mouth and an eager brain.",
    "spaniel": "Flushing and fetching birds shaped this dog — close-working, busy, and happiest in the field.",
    "pointer": "They find game and freeze on it, a living compass for the hunter behind them.",
    "sled": "Cold miles and heavy loads wrote this breed: endurance first, sofa second.",
    "mastiff": "This is a guardian in a heavy frame, bred to hold ground and look like they mean it.",
    "toy": "Tiny on purpose, they were companions and alarm bells more than farm hands.",
    "hairless": "The missing coat is the headline, but the breed is still a real dog underneath — watchful and warm-seeking.",
    "spitz": "Prick ears, a curled tail, and a weatherproof coat: classic northern dog, even far from snow.",
    "default": "Work and weather in their homeland shaped what you see in the breed today.",
}


def split_sents(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def strip_canned(story: str) -> str:
    story = re.sub(r" Most stand about [^.]*\.", "", story)
    story = re.sub(r" A good .*?couch\.", "", story)
    return story.strip()


def grammar(s: str, name: str) -> str:
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(rf"^The {re.escape(name)}s?\b,?\s*", "", s, flags=re.I)
    s = re.sub(
        r"^The [A-ZÀ-ÖØ-öø-ÿ][\w'’\-]*(?:[ \-][A-ZÀ-ÖØ-öø-ÿ][\w'’\-]*){0,8},?\s+(is|are|was|were)\s+",
        lambda m: "They " + {"is": "are", "are": "are", "was": "were", "were": "were"}[m.group(1).lower()] + " ",
        s,
    )
    s = re.sub(r"^It originated\b", "They originated", s)
    s = re.sub(r"^It falls\b", "They fall", s)
    s = re.sub(
        r"^(Commonly known as|Also known as|Also referred to as|Also called) (.+), is an?\s+",
        r"\1 \2, they are a ",
        s,
    )
    s = re.sub(r"^Also known as (.+), is a dog of\s+", r"Also known as \1, they are a ", s)
    s = re.sub(r"^The ([A-Z][^,]{2,50}), is a\s+", r"The \1 is a ", s)
    s = re.sub(r"\bespecially to (?:the )?", "especially ", s)
    s = re.sub(r"\bparticularly to (?:the )?", "particularly ", s)
    s = re.sub(r"\band to northern areas of\b", "and", s)
    s = re.sub(r"\bIt is unknown if any examples still exist\.", "Nobody is sure whether any still exist.", s)
    s = re.sub(r"\bIt is used as\b", "They are used as", s)
    s = re.sub(r"\bIt is usually kept\b", "They are usually kept", s)
    s = re.sub(r"\bIt became\b", "They became", s)
    s = re.sub(r"\bIt is\b", "They are", s)
    s = re.sub(r"\bThis is a (endurance|energetic|ancient)\b", r"This is an \1", s)
    s = re.sub(r"^They or (?:simply )?", "Also called ", s)
    s = re.sub(r"^They or ([A-Z])", r"Also called \1", s)
    s = re.sub(r"^They, is a\s+", "This is a ", s)
    s = re.sub(r"^They was\s+", "They were ", s)
    s = re.sub(r"^They is\s+", "They are ", s)
    s = re.sub(r"\bThey was\b", "They were", s)
    s = re.sub(r"\bThey is\b", "They are", s)
    s = re.sub(r"\bIt is indigenous to\b", "They come from", s, flags=re.I)
    s = re.sub(r"\bThey are indigenous to\b", "They come from", s, flags=re.I)
    s = re.sub(r"\bThey are a (?:dog )?breed of\s+", "This is a ", s, flags=re.I)
    s = re.sub(r"\bThey are a breed of dog,?\s+", "This is a dog ", s, flags=re.I)
    s = re.sub(r"^They are an?\s+", "This is a ", s)
    s = re.sub(r"^They are a\s+", "This is a ", s)
    s = re.sub(r"\bis a dog breed of\b", "is a", s, flags=re.I)
    s = re.sub(r"\bis a breed of sporting dog\b", "is a sporting dog", s, flags=re.I)
    s = re.sub(r"\bis a (?:dog )?breed(?: of dog)?\b", "is a dog", s, flags=re.I)
    s = re.sub(r"This is a (?:dog )?breed of\s+", "This is a ", s, flags=re.I)
    s = re.sub(r"\bIt is a\b", "They are a", s)
    s = re.sub(r"\bIt was formerly kept as\b", "They were once kept as", s)
    s = re.sub(r"\bIt was\b", "They were", s)
    s = re.sub(r"\bIt has been\b", "They have been", s)
    s = re.sub(r"\bIt has\b", "They have", s)
    s = re.sub(r"\bIt originates\b", "They originate", s)
    s = re.sub(r"\bin the twenty-first century it is commonly kept as\b", "today they are usually", s, flags=re.I)
    s = re.sub(r"\bit is\b", "they are", s)
    s = re.sub(r"\bit was\b", "they were", s)
    s = re.sub(r"\bit has\b", "they have", s)
    s = re.sub(r"This is a This is a ", "This is a ", s)
    s = re.sub(r"\ba ancient\b", "an ancient", s)
    s = re.sub(r"\band is one of\b", "and are one of", s)
    s = re.sub(r"\bespecially Maremma\b", "especially the Maremma", s)
    s = re.sub(r"\ba ([AEIOU])", r"an \1", s)
    if s and s[0].islower():
        s = s[0].upper() + s[1:]
    if s and s[-1] not in ".!?":
        s += "."
    return s


def boring(s: str) -> bool:
    low = s.lower()
    if re.search(
        r"recognized by the|kennel club|fédération|fci\b|foundation stock|breed standard|published breed standard|société centrale|asociación canina|may refer to:",
        low,
    ):
        return True
    if re.search(r"^this is a (?:dog|breed)", low) and not re.search(r"\b(?:from|used|bred|kept|hunt|guard|herd)\b", low) and len(s) < 100:
        return True
    if re.search(r"^this is a .{0,50}(?:breed|type|landrace) of\b", low) and "from" not in low:
        return True
    if re.search(r"\bis an? .{0,40}(?:breed|type|landrace) of\b", low) and not re.search(
        r"\b(?:bred to|used to|used as|developed|kept as)\b", low
    ):
        return True
    if re.match(r"^(?:The|Also called) .{0,70}? is a dog of\b", s):
        return True
    if re.search(r"dog fighting|dogfight", low):
        return True
    if re.search(r"^this is a dog from\b", low):
        return True
    return False


def detect_job(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ("hairless", "naked")):
        return "hairless"
    if any(w in t for w in ("sled", "freight", "sledge", "inuit", "malamute", "laika")):
        return "sled"
    if any(w in t for w in ("livestock guardian", "flock guardian", "guardian dog", "protecting herds", "ovcharka", "watchdog", "guard dog")):
        return "guardian"
    if any(w in t for w in ("herding", "sheepdog", "cattle dog", "heel", "kelpie", "shepherd")):
        return "herding"
    if any(w in t for w in ("sighthound", "greyhound", "gazehound", "by sight", "podenco", "warren hound")):
        return "sighthound"
    if "hound" in t or any(w in t for w in ("scent hound", "scenthound", "coonhound", "pack hunter", "by scent")):
        return "scenthound"
    if "terrier" in t:
        return "terrier"
    if any(w in t for w in ("retriever", "retrieve", "water dog")):
        return "retriever"
    if "spaniel" in t:
        return "spaniel"
    if any(w in t for w in ("pointer", "pointing", "setter", "braque")):
        return "pointer"
    if any(w in t for w in ("mastiff", "molosser", "bulldog type", "boerboel")):
        return "mastiff"
    if "spitz" in t:
        return "spitz"
    if any(w in t for w in ("toy dog", "companion", "lap")):
        return "toy"
    return "default"


ORIGIN_FIX = {
    "abyssinian-sand-terrier": "Africa",
    "africanis": "Southern Africa",
    "american-staghound": "United States",
    "andalusian-hound": "Andalusia, Spain",
    "argentine-pila-dog": "Argentina",
    "australian-silky-terrier": "Australia",
    "basset": "France",
    "bavarian-mountain-hound": "Bavaria, Germany",
    "berner-laufhund": "Switzerland",
    "bichon-fris": "France / Belgium",
    "biewer-terrier": "Germany",
    "bohemian-spotted-dog": "Prague",
    "bucovina-shepherd-dog": "Bukovina",
    "burgos-retriever": "Castile, Spain",
    "buryat-mongolian-wolfhound": "Mongolia",
    "can-de-chira": "Aragon, Spain",
    "cane-toccatore": "Abruzzo, Italy",
    "cantabrian-water-dog": "Cantabria, Spain",
    "catalan-sheepdog": "Catalonia",
    "caucasian-shepherd-dog": "Caucasus",
    "celtic-hounds": "Ireland",
    "cocker-spaniel": "England / United States",
    "continental-toy-spaniel": "Belgium / France",
    "coonhound": "United States",
    "cretan-hound": "Crete",
    "cursinu": "Corsica",
    "danish-swedish-farmdog": "Denmark / Sweden",
    "double-nosed-andean-tiger-hound": "Andes",
    "dumfriesshire-hound": "Scotland",
    "east-european-shepherd": "Ukraine / Russia",
    "english-cocker-spaniel": "England",
    "english-springer-spaniel": "England",
    "french-spaniel": "France",
    "fuegian-dog": "Tierra del Fuego",
    "greek-harehound": "Greece",
    "griffon": "Belgium / France",
    "hairless-dog": "Americas",
    "himalayan-sheepdog": "Himalayas",
    "illyrian-shepherd": "Balkans",
    "irish-red-and-white-setter": "Ireland",
    "irish-terrier": "Ireland",
    "irish-water-spaniel": "Ireland",
    "jonangi": "Andhra Pradesh, India",
    "limer": "Medieval Europe",
    "miniature-australian-shepherd": "United States",
}


def infer_origin(story: str, current: str, breed_id: str = "") -> str:
    if breed_id in ORIGIN_FIX:
        return ORIGIN_FIX[breed_id]
    if current and current not in ("A Faraway Kennel", "Unknown", "a faraway kennel"):
        return current
    patterns = [
        r"indigenous to (?:the )?(?:autonomous community of )?([A-Z][^.,]{2,40})",
        r"originating (?:in|from) ([A-Z][^.,]{2,40})",
        r"native to (?:the )?([A-Z][^.,]{2,40})",
        r"found across ([A-Z][^.,]{2,40})",
        r"from (?:the )?(?:Greek island of )?([A-Z][A-Za-z\-]+(?: [A-Z][A-Za-z\-]+){0,3})",
        r"in the ([A-Z][^.,]{2,30}?)(?:\.|,)",
        r"originat(?:es|ed|ing) in ([A-Z][^.,]{2,40}?)(?:\.|,)",
        r"of ([A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)?) origin",
        r"developed in ([A-Z][^.,]{2,40})",
        r"breed of dog from ([A-Z][^.,]{2,40})",
    ]
    skip_start = (
        "hunting",
        "dogs",
        "the 1",
        "the 2",
        "the 3",
        "the 4",
        "the 5",
        "the 6",
        "the 7",
        "the 8",
        "the 9",
        "middle english",
        "english greyhound",
    )
    for p in patterns:
        m = re.search(p, story)
        if m:
            val = m.group(1).strip()
            val = re.sub(r"\s+(where|which|that|during|in the)\b.*", "", val)
            if val.lower().startswith(skip_start):
                continue
            if 2 < len(val) < 42 and "breed" not in val.lower():
                return val
    return current if current not in ("A Faraway Kennel",) else "Unknown"


def rewrite(b: dict) -> str:
    name = b["name"]
    raw = strip_canned(b["story"])
    origin = infer_origin(raw, b.get("origin") or "", b["id"])
    if origin != b.get("origin"):
        b["origin"] = origin
    job = detect_job(raw + " " + name)
    opener = OPENERS[job]
    if not opener.endswith("."):
        opener += "."

    sents = [grammar(s, name) for s in split_sents(raw)]
    facts = []
    for s in sents:
        if boring(s):
            continue
        low = s.lower()
        if low.startswith("this is a") and "from" not in low and "in " not in low and len(s) < 120:
            continue
        if job in ("herding", "guardian", "scenthound", "terrier", "toy") and low.startswith("this is a") and any(
            w in low for w in (job, "herding", "guardian", "hound", "terrier", "toy", "companion")
        ):
            continue
        if re.match(r"^(?:The|Also called) [A-Z].{2,70} is a dog\b", s):
            continue
        if opener[:40].lower() in low:
            continue
        facts.append(s)
        if len(facts) >= 2:
            break
    if job == "default" and facts:
        opener = facts.pop(0)
        if not opener.endswith("."):
            opener += "."
    fact_bit = " ".join(facts)
    if not fact_bit and job != "default":
        place = origin if origin not in ("Unknown", "A Faraway Kennel", "") else "their homeland"
        fact_bit = f"The work they were bred for in {place} still shows in the body and the brain."
    closer = CLOSERS[sum(ord(c) for c in b["id"]) % len(CLOSERS)]
    if fact_bit and len(opener) + len(fact_bit) > 260:
        story = f"{opener} {fact_bit}"
    else:
        story = f"{opener} {fact_bit} {closer}"
    story = re.sub(r"\s+", " ", story).strip()
    story = re.sub(r"\.\.", ".", story)
    story = re.sub(r" ([.!?])", r"\1", story)
    return story


def place_for_intro(origin: str) -> str:
    if origin in (
        "United States",
        "United Kingdom",
        "Netherlands",
        "Czech Republic",
        "Philippines",
        "Himalayas",
        "Andes",
        "Caucasus",
        "Soviet Union",
    ):
        return f"the {origin}"
    return origin


def fix_intro(intro: str, origin: str, name: str) -> str:
    if "faraway kennel" in intro.lower():
        if origin and origin not in ("Unknown", "A Faraway Kennel"):
            return f"Coming all the way from {place_for_intro(origin)}, is the {name}."
        return f"Hello pups, today’s daily dog is the {name}."
    adj = {
        "Germany": "German",
        "France": "French",
        "Spain": "Spanish",
        "Italy": "Italian",
        "England": "English",
        "Ireland": "Irish",
        "Scotland": "Scottish",
        "Wales": "Welsh",
        "United States": "American",
        "Switzerland": "Swiss",
        "Belgium": "Belgian",
        "Netherlands": "Dutch",
        "Sweden": "Swedish",
        "Norway": "Norwegian",
        "Finland": "Finnish",
        "Denmark": "Danish",
        "Poland": "Polish",
        "Russia": "Russian",
        "China": "Chinese",
        "Japan": "Japanese",
        "India": "Indian",
        "Australia": "Australian",
        "Canada": "Canadian",
        "Mexico": "Mexican",
        "Brazil": "Brazilian",
        "Argentina": "Argentine",
        "Turkey": "Turkish",
        "Greece": "Greek",
        "Portugal": "Portuguese",
        "Austria": "Austrian",
        "Hungary": "Hungarian",
        "Romania": "Romanian",
        "Pakistan": "Pakistani",
        "Egypt": "Egyptian",
        "Brittany": "Breton",
        "Armenia": "Armenian",
    }.get(origin)
    if intro.startswith(f"A {origin} classic"):
        if adj:
            article = "An" if adj[0] in "AEIOU" else "A"
            intro = f"{article} {adj} classic takes the stage: the {name}."
        else:
            intro = f"From {place_for_intro(origin)}, here comes the {name}."
    if adj:
        an = adj[0] in "AEIOU"
        intro = intro.replace(f"a {origin} original", f"{'an' if an else 'a'} {adj} original")
        intro = intro.replace(f"an {origin} original", f"{'an' if an else 'a'} {adj} original")
        intro = intro.replace(f"A {origin} classic", f"{'An' if an else 'A'} {adj} classic")
    intro = intro.replace(f"from {origin}", f"from {place_for_intro(origin)}")
    intro = intro.replace(f"from the the ", "from the ")
    intro = intro.replace(f"Fresh from {origin}", f"Fresh from {place_for_intro(origin)}")
    intro = re.sub(r"^A a ", "A ", intro)
    intro = re.sub(r"^A (Irish|Italian|English|American|Australian|Austrian|Indian|Egyptian|Armenian)\b", r"An \1", intro)
    return intro


# Hand-tuned stories for well-known extras (intro is separate).
HAND = {
    "africanis": "A southern African village dog, they are a landrace more than a show breed — short coat, a black muzzle patch, and a body built by work, not by a closed studbook. They are the dog of the settlement, not the salon.",
    "aidi": "A livestock guardian of the Atlas Mountains, they protected herds of sheep and goats from jackals and strangers. Weatherproof, territorial, and still a mountain dog, not a city novelty.",
    "abyssinian-sand-terrier": "African hairless dogs went by many names, including Abyssinian sand terrier. They were warm-skinned, watchful, and possibly gone — it is unclear whether any still exist.",
    "catahoula-leopard-dog": "Louisiana’s state dog, they herded hogs through swamp and woods with a mottled coat and glass-blue eyes in some lines. A working cur, not a fashion spotted dog — they want a job in the brush.",
    "kintamani": "Bali’s only official breed, they were developed from free-roaming island dogs around Kintamani. Hardy, fox-faced, and still closer to a village dog than to a European show spitz.",
    "eurasier": "A German companion spitz from Chow, Wolfspitz, and Samoyed stock, they are calm, reserved with strangers, and devoted at home. A family dog with a northern coat, not a toy.",
    "biewer-terrier": "A German toy that started as piebald Yorkshire Terriers, they are a companion and show dog in a tri-color coat. Small, people-glued, and still a terrier under the hair bow.",
    "miniature-australian-shepherd": "A compact herding dog from American Aussie lines, they kept the full-size brain in a smaller frame. Bright, biddable, and still sure the household needs managing.",
    "himalayan-sheepdog": "A Himalayan livestock guardian known as Bhote Kukur, Bhotia, or Gaddi Kutta, they work the foothills from Nepal to Kashmir. Big, weatherproof, and bred to decide, not to wait for a whistle.",
    "jonangi": "An Indian village dog from Andhra Pradesh and the eastern coast, they were once common around Kolleru Lake. Lean, heat-proof, and still more a working landrace than a parlor breed.",
    "kromfohrl-nder": "A German hunting and companion terrier-type from the years after World War II, they are wiry, busy, and people-oriented. Not tiny on purpose — they still want a walk with a point.",
    "campeiro-bulldog": "A Brazilian farm bulldog, they worked cattle and guarded the homestead. Muscular, sure of themselves, and still a working dog under the companion coat.",
    "armenian-gampr-dog": "Armenia’s livestock guardian, they belong to the ovcharka family of flock dogs. Independent night watchers, bred to think for themselves beside the sheep.",
    "carolina-dog": "Sometimes called a Dixie dingo or American dingo, they are a primitive-type dog of the American South. Lean, shy with strangers, and still closer to a village dog than to a show breed.",
    "norrbottenspets": "A small Swedish hunting spitz, they found birds and squirrels in the northern woods. Prick ears, curled tail, and a weatherproof coat — still a hunter, not a sofa ornament.",
    "black-russian-terrier": "Soviet military kennels built this large black working dog in the 1940s and 50s. Despite the name they are more giant schnauzer-and-rottweiler than terrier — a serious guardian with a weatherproof coat.",
    "central-asian-shepherd-dog": "Also called Alabai, they are livestock guardians of Central Asia, used with sheep and goats and as a night watch. Independent, massive, and bred to decide, not to wait for a cue.",
    "continental-bulldog": "A Swiss redesign of the English Bulldog, meant to be healthier and more athletic. Still a compact companion, just with more air in the lungs.",
    "danish-swedish-farmdog": "Scandinavia’s small farm all-rounder, once the Danish Pinscher. They ratted, herded, and announced the gate — a busy little worker, not a lap ornament.",
    "german-spaniel": "Germany’s Wachtelhund, a flushing and retrieving hunter developed around 1890 from the old Stöberer. Close-working, versatile, and still a gundog first.",
    "great-anglo-french-white-and-black-hound": "A French pack hound crossed with English Foxhounds, they hunt in a chorus across country. Built for the pack, not for a quiet apartment.",
    "great-anglo-french-white-and-orange-hound": "The orange-and-white cousin of the Anglo-French pack hounds, they were crossed from French scenthounds and English Foxhounds. Trail voices, stamina, and a job that still looks like a hunt.",
    "australian-stumpy-tail-cattle-dog": "Australia’s naturally bobtailed heeler, a cousin of the Cattle Dog from Halls Heeler stock. They drive cattle in heat, and that missing tail is the breed, not a dock.",
    "blue-lacy": "Texas ranch dogs from the mid-19th century, they herded, hunted, and treed. The state dog of Texas — a working cur in blue, red, or tricolor, not a showpiece.",
    "jeju-dog": "Korea’s Jeju island dog, they were down to three animals in 1986 and were pulled back from extinction. A few hundred exist now — a hunting and companion spitz with a very close call.",
    "bavarian-mountain-hound": "A German scent hound used since the early 20th century to trail wounded game in the mountains. Close-working, serious, and still a specialist, not a jogging buddy.",
    "bulgarian-scenthound": "From the Ludogorie in northern Bulgaria, they are the country’s most common smooth-haired hunting dog. A pack and trail hound, built to work, not to decorate.",
    "istrian-coarse-haired-hound": "A Croatian scenthound in a harsh coat, they hunt hare and fox through Istrian cover. Wire, voice, and a nose — still a hunting dog first.",
    "lupo-italiano": "An Italian herding and working dog whose founder claimed wolf blood from a German Shepherd cross. Genetics are less sure; the dog is still a serious, wolfish-looking worker.",
    "cirneco-delletna": "Sicily’s rabbit hunter, named for Mount Etna. A small, elegant sighthound that still works the lava slopes — heat-proof, light-footed, and not a toy.",
    "formosan-mountain-dog": "Taiwan’s native hunting and guard dog, also called the Taiwan Dog. Medium, prick-eared, and still a village and mountain worker.",
    "karelian-bear-dog": "Finland’s bold black-and-white hunter, used on bear and elk. A national treasure with a switch that does not turn off — they need a job, not a quiet hallway.",
    "magyar-ag-r": "Hungary’s short-coated sighthound, the Magyar Agár. Built to course hare across the plains — less coat than a greyhound look, same afterburners.",
    "english-pointer": "The classic English pointing dog: find birds, freeze, wait. Muscle and nose, with a switch that flips from statue to sprint.",
    "american-english-coonhound": "A Southern pack hound, also called the Redtick or English Coonhound. They were built to tree raccoons all night — loud, enduring, and not a solo apartment dog.",
    "bulgarian-hound": "Also called the Barak, a hunting hound of northern and central Bulgaria. A trail dog with a voice, still more hunter than house pet.",
    "chortai": "A Ukrainian and Russian sighthound, sometimes spelled Chortaj. Lean coursers of the steppe, they hunt by sight and still look like they have somewhere to run.",
    "french-tricolour-hound": "France’s tricolor pack hound, a scenthound meant to work in a chorus. Bred for the hunt, not for a quiet sofa.",
    "georgian-shepherd": "Also called Nagazi, a livestock guardian of the Georgian Caucasus. Massive night watchers, independent with the flock.",
    "gaucho-sheepdog": "A herding dog of the Brazilian Pampas, the Ovelheiro Gaúcho. They work sheep on open grassland — a ranch partner, not a city novelty.",
    "mantiqueira-shepherd": "A Brazilian herding dog of the Mantiqueira hills, nicknamed Policialzinho. Medium, busy, and still a livestock dog first.",
    "appenzeller-sennenhund": "One of four Swiss mountain dogs, they come from Appenzell: tricolor, agile, and built to move cattle in the hills. Busy, vocal, and not a quiet apartment dog.",
    "galgo-espa-ol": "Spain’s sighthound, they hunted hare across open country and still have that long, spare gallop. Gentler than their racing reputation, they are mostly quiet house dogs until something runs.",
    "affenpinscher": "On German farms they earned their keep as barn ratters, a tiny pinscher with a monkeyish face that still hunts lint, toes, and anything that rustles. The name nods to that look — Affe is German for monkey. They are busy, bold, and happier with something to boss around.",
    "afghan-hound": "That silky coat and ring-curled tail were made for cold Afghan mountains, not a blow-dryer, though they will steal the sofa. They hunt by sight, independent and a little aloof, then melt into a sighthound sprawl when the sprint is over.",
    "airedale-terrier": "From the valley of the River Aire in Yorkshire, this is the largest of the terrier bunch and has been nicknamed the King of Terriers. They were otter and rat dogs first, then wartime messengers, and they still want a job with a splash of mischief.",
    "alaskan-malamute": "Bred to haul freight across Arctic miles, the Malamute is a freight train in fur, not a sprint husky. They pull, dig, howl, and treat your backyard like a trailhead. Strength and stamina came first; indoor manners are a later negotiation.",
    "alaskan-klee-kai": "A late-20th-century companion spitz, they were meant to look like a pocket husky without the freight-hauling size. They are bright, vocal, and still very much a northern dog — curious, busy, and not a couch potato in a costume.",
    "american-bulldog": "Farm and ranch dogs in the American South, they kept hogs, guarded the place, and still come in a muscular, confident package. A well-raised one is a loyal working companion, not a yard ornament.",
    "american-bully": "A modern companion breed standardized in the 2000s, they were meant to look powerful without being a fighting dog. The best ones are steady family dogs; the look is the headline, but temperament is the whole plot.",
    "basset-hound": "Those ears and that low-slung body are scent tools: they were packed out of France and perfected as slow, thorough trailing hounds. They bay like a one-dog choir and will follow a smell into next week if you let them.",
    "bearded-collie": "A shaggy Scottish herder, they bounce more than they stalk. Under the beard is a bright, weatherproof farm dog who still thinks moving the household is a reasonable hobby.",
    "belgian-malinois": "From Belgian herding stock came a rocket of a working dog, now famous in police and military lines. They need a job with a point — bite work, sport, or serious training — or they will invent one.",
    "bloodhound": "The nose is the breed. From medieval trailing hounds they became the gold standard for following a human scent, and that wrinkled face is part of the scent-trapping kit. They are gentle tanks with a one-track mind.",
    "borzoi": "Russian nobility used these silky sighthounds on wolf and hare. They are mostly quiet house ghosts until something runs, then the old chase comes back in a hurry.",
    "bulldog": "The English Bulldog began as a bull-baiting dog and was later reshaped into the wide, wrinkled companion we know. The trade-off is heat, snoring, and a walk that should not look like a marathon.",
    "bullmastiff": "Gamekeepers needed a silent night dog who could stop a poacher, not maul the countryside. The Bullmastiff is a heavy, watchful guardian who would rather lean on you than start a fight.",
    "cane-corso": "An Italian mastiff of the farm and estate, they guarded, drove stock, and hunted large game. A proper Corso is a serious, trainable guardian — confident, not chaotic.",
    "cavalier-king-charles-spaniel": "Named for a king who adored small spaniels, they are lap dogs with a sporting heart. The long ears and gentle face hide a dog that still likes a sniffy walk more than a purely decorative life.",
    "chow-chow": "From northern China, they have a lion ruff, a blue-black tongue, and a catlike independence. Once hunting and guarding dogs, they still keep a cool distance from strangers and a hot loyalty at home.",
    "dobermann": "Louis Dobermann wanted a tax collector’s bodyguard in 19th-century Germany, and the sleek, athletic Dobermann was the result. They are sharp, loyal, and still look like they have an appointment.",
    "dogo-argentino": "Packed in Argentina as a big-game hunting mastiff, they are white, powerful, and bred to work in a pack. They need a handler who understands a serious hunting dog, not a fashion statement.",
    "dogue-de-bordeaux": "A French mastiff with a massive head and a melting expression, they were baiting and guardian dogs before they were movie extras. They drool, they lean, and they take their people very seriously.",
    "english-springer-spaniel": "Springers flush — “spring” — birds from cover, then fetch. The happy, driving spaniel brain never really clocks out, which is why a tired Springer is a pleasant Springer.",
    "irish-wolfhound": "The tallest of dogs, they were the Irish hunters of wolf and elk, sighthounds in a rough coat. Off the chase they are famously gentle giants who think they belong on the furniture.",
    "jack-russell-terrier": "Parson Jack Russell wanted a fox-working terrier that would go to ground and come back out. They are rocket-powered, clever, and allergic to boredom.",
    "keeshond": "A Dutch barge dog, they kept watch on the canals with a fox face and a spectacular ruff. They are vocal, people-oriented, and still think announcing the neighborhood is part of the job.",
    "komondor": "The corded white coat is camouflage among Hungarian sheep and armor against weather and wolves. Under the dreadlocks is a serious livestock guardian who takes the flock — or the family — personally.",
    "leonberger": "A German estate dog with a lion’s mane, they were drafted as draft and water dogs as well as companions. Big, wet, and usually kind, they still need room and a cool climate.",
    "lhasa-apso": "Tibetan monastery and household watchdogs, they hid a sharp alarm bark in a floor-length coat. They were never just decorations; they still decide who is allowed through the door.",
    "miniature-schnauzer": "A farm ratter from Germany, scaled down from the Standard Schnauzer, with the beard and eyebrows intact. They are busy terrier-cousins who still believe mice (and delivery trucks) need managing.",
    "neapolitan-mastiff": "The loose skin and massive head come from Italian guardian mastiffs meant to look like a nightmare at the gate. They are slow, devoted, and not built for heat or hurry.",
    "nova-scotia-duck-tolling-retriever": "Tollers lure curious waterfowl into range with a foxlike dance, then retrieve the birds. From Nova Scotia, they are the smallest retriever — bright, busy, and vocal when the hunt is on.",
    "rhodesian-ridgeback": "Southern African hunters wanted a dog that could hold a lion at bay. The ridge of backward hair is the signature, and the breed is still an endurance hound with a streak of independence.",
    "samoyed": None,  # core
    "shiba-inu": None,
    "siberian-husky": None,
    "weimaraner": None,
    "cardigan-welsh-corgi": "The Cardigan is the older, longer-tailed Welsh cattle dog, a separate breed from the Pembroke. They still nip heels in their minds, and those low legs were for staying under a kick.",
    "cavalier-king-charles-spaniel": "Charles II’s favorite spaniels became this gentle toy with a sporting streak. They were bred to sit on laps at court, then still want a sniffy ramble like any spaniel.",
    "chinese-crested-dog": "Hairless except for a crest, socks, and a plume, they come in a powderpuff coated variety too. They are true companion dogs who seek warmth the way other dogs seek squirrels.",
    "coton-de-tulear": "From Madagascar, the Coton’s cottony white coat was a companion to merchants and royals in Toliara. They are cheerful, people-glued, and not a backyard-alone breed.",
    "curly-coated-retriever": "One of the oldest retriever types, they wear a crisp curl that sheds water. Less famous than Labs, they are still serious gundogs with an independent streak.",
    "english-mastiff": "Among the heaviest of dogs, the Mastiff is an ancient guardian type, calm when well bred and monumental on the couch. They were never meant to jog in July.",
    "flat-coated-retriever": "A gundog with a shiny, flat coat and an optimistic personality that never quite grows up. They retrieve with style and still think every person is a new best friend.",
    "german-shorthaired-pointer": "A versatile German hunter who points, retrieves, and runs all day. The docked tail and ticked coat are the look; the engine is the story.",
    "german-wirehaired-pointer": "Harsh coat for thorns and cold water, a beard for the brush, and a brain for all-day hunting. They are the GSP’s tougher-coated cousin, still a field dog first.",
    "giant-schnauzer": "The farm and cattle version of the schnauzer, later a police and guard dog in Germany. They are powerful, territorial, and not a casual first dog.",
    "gordon-setter": "Scotland’s black-and-tan setter, a bird dog with more substance than a Pointer and a nose for grouse. They are loyal, slightly stubborn, and happiest when the day includes a field.",
    "great-pyrenees": "White livestock guardians of the Pyrenees, they worked nights with the flock and still have a big, booming bark for anything that doesn’t belong. Calm with sheep, serious at the fence line.",
    "greater-swiss-mountain-dog": "The largest of the Swiss Sennenhunds, they drafted carts and moved cattle in the Alps. Tricolor, sturdy, and not built for hot apartments.",
    "havanese": "Cuba’s companion dog, silky and springy, they were parlor dogs who still clown for an audience. They want to be where the people are.",
    "ibizan-hound": "A rabbit hunter from the Balearic Islands, they jump like deer and hunt by sight and sound. Lean, elegant, and surprisingly clownish at home.",
    "icelandic-sheepdog": "Iceland’s only native breed, a spitz that herded sheep in rough country and still talks with yips and howls. They are friendly, weatherproof, and busy.",
    "italian-greyhound": "A miniature sighthound of Italian courts, they sprint, then burrow under blankets because they have almost no fat. Fragile in the cold, huge in personality.",
    "japanese-chin": "A Japanese and Chinese companion spaniel of the court, they are catlike, clean, and convinced the cushion is a throne.",
    "japanese-spitz": "A white Japanese companion spitz, fox-faced and smiling, they were bred to be family dogs with a big-dog bark in a small package.",
    "kai-ken": "One of Japan’s native hunting spitz, brindle-coated and sure-footed in mountains. They are loyal to their people and reserved with the rest of the world.",
    "kangal-shepherd-dog": "From Sivas in Turkey, these livestock guardians are famous for stopping wolves. Size, a calm head, and a serious night watch come with the job.",
    "kerry-blue-terrier": "Ireland’s blue-gray terrier, they were farm all-rounders and still have opinions about vermin, strangers, and other dogs. The coat colors as they grow, like a slow costume change.",
    "kooikerhondje": "A Dutch duck decoy dog, they lured waterfowl with a plumed tail. Orange-white and cheerful, they are still busy spaniel-cousins at heart.",
    "korean-jindo-dog": "Korea’s double-coated hunting and companion spitz, famously loyal and famously their own boss. They keep a clean house instinct and a cool eye for strangers.",
    "kuvasz": "A white Hungarian flock guardian, they look like a cloud and think like a night watchman. Independent, weatherproof, and not a golden retriever in a costume.",
    "lagotto-romagnolo": "Italy’s truffle dog, a curly water retriever that now hunts fungi instead of ducks. They are busy, sniffy, and happiest when their nose is employed.",
    "lancashire-heeler": "A small British cattle dog that nipped heels, a cousin to the Corgi idea. Short, smart, and still sure the household needs herding.",
    "lhasa-apso": "Sentinel dogs of Tibet, they wore a floor-length coat and a sharp alarm bark. They were never just lap ornaments — they still screen the door.",
    "malinois": None,  # catalog uses belgian-malinois
    "manchester-terrier": "A sleek English ratter, black and tan, they were pit and barn dogs before they were elegant companions. They still have a terrier motor.",
    "miniature-american-shepherd": "A smaller Aussie built for agility and ranch work in a compact package. The herding brain is full-size even when the dog is not.",
    "miniature-pinscher": "Not a tiny Dobermann — an older German ratter with a hackney gait and a huge self-image. They are busy, brave, and loud about the mail.",
    "mudi": "A Hungarian herding spitz, curly-coated and electric. They work cattle and sheep with a lot of noise and even more opinion.",
    "norfolk-terrier": "Drop-eared English farm terriers, small enough for a pocket and bold enough for a barn. They hunt, dig, and still believe they are large.",
    "norwich-terrier": "The prick-eared twin to the Norfolk, another East Anglian ratter. Same engine, different ear set, same inability to mind their own business.",
    "papillon": "Named for moth-wing ears, this continental toy spaniel is a sport dog in a lace package. They are among the brightest of toys and hate being bored.",
    "pekingese": "Imperial Chinese lapdogs, they were bred to look like guardian lions in miniature. Short faces, long coats, and a walk that should never be a hike in the heat.",
    "pharaoh-hound": "Malta’s rabbit hunter, they blush when excited — the nose and ears go rose. Elegant sighthounds with a surprising sense of humor.",
    "plott-hound": "North Carolina’s state dog, a brindle boar and bear hound from German settlers. They are trail-loud, tough, and still a hunter first.",
    "pointer": "The English Pointer is the classic upland statue: find birds, freeze, wait. Muscle and nose, with a switch that flips from still to sprint.",
    "pomeranian": None,
    "poodle": None,
    "pug": None,
    "puli": "Hungary’s corded herding dog, they look like a mop and work like a spring. The coat is weather armor; the brain is all livestock.",
    "pumi": "A Hungarian herder with corkscrew ears and a lot to say. They bounce, herd, and believe every moving thing is their business.",
    "rhodesian-ridgeback": "Bred in southern Africa to hunt and to hold large game at bay, they wear a ridge of hair growing the wrong way down the back. Endurance hounds with a streak of independence.",
    "rottweiler": None,
    "saluki": "A desert sighthound of the Middle East, they were hunting partners for millennia. Feathered ears, huge lungs, and a catlike sense of their own dignity.",
    "schipperke": "A Belgian barge dog, black and foxlike, they were ratters and alarms on the canals. They still announce everything and plot small revolutions.",
    "scottish-terrier": "A low, bearded ratter from Scotland, they were never meant to be cute first. Independent, stubborn, and still sure the garden needs excavating.",
    "shar-pei": "From southern China, they are famous for wrinkles and a blue-black mouth. Once fighting and guarding dogs, they are now stoic companions who still keep a watch.",
    "shetland-sheepdog": "A miniature collie of the Shetland Islands, they herded in rough weather and still try to herd children, vacuums, and joy itself. Vocal, bright, and sensitive.",
    "shiba-inu": None,
    "shih-tzu": "A Tibetan and Chinese palace companion, they were bred to look like little lions. The flowing coat is the costume; the dog underneath wants to be in your lap and in your business.",
    "siberian-husky": None,
    "australian-silky-terrier": "An Australian toy terrier with a silky coat, they were ratters who went to the parlor. Small, bossy, and not a stuffed animal.",
    "soft-coated-wheaten-terrier": "Ireland’s less-spiky terrier, they have a wheat-colored coat and a bouncing greeting. Farm terriers under the fluff.",
    "staffordshire-bull-terrier": "A British bull-and-terrier made into a family companion, they are muscular, people-loving, and still a serious athlete. The reputation is louder than a well-bred Staffy at home.",
    "standard-schnauzer": "The original schnauzer, a German farm ratter and guard, square and bearded. They are the template the Mini and Giant were copied from.",
    "tibetan-mastiff": "A Himalayan livestock guardian, they are night barkers with a massive coat and an independent mind. They were never bred to obey like a shepherd — they were bred to decide.",
    "tibetan-spaniel": "Monastery window dogs in Tibet, they sat on walls and barked at visitors. Small, silky, and still convinced they have a job at the windowsill.",
    "tibetan-terrier": "Not a true terrier, they were herding and companion dogs of Tibet with a blizzard-proof coat and snowshoe feet. They bounce, they watch, they stick to their people.",
    "vizsla": "Hungary’s rust-gold hunting dog, they point and retrieve and melt into whoever they live with. Velvet coat, huge engine, and a need to be in the room.",
    "volpino-italiano": "An Italian spitz, white and smiling, they were watchdogs of farms and palaces. A big bark in a fox-faced package.",
    "weimaraner": None,
    "welsh-springer-spaniel": "The red-and-white Welsh cousin of the Springer, a closer-working bird dog. They are loyal, a little reserved, and still all spaniel in the field.",
    "west-highland-white-terrier": "White Scottish earth terriers from the Highlands, they were bred so hunters could see them in the heather. Small, sturdy, and sure they run the house.",
    "whippet": None,
    "wire-fox-terrier": "The wiry fox-working terrier of English packs, they went to ground and made a scene. Still theatrical, still busy, still not a quiet apartment fern.",
    "xoloitzcuintle": "Mexico’s hairless dog, ancient and warm-skinned, they come in toy to standard sizes. They seek heat, bond hard, and still look like history walking.",
    "yorkshire-terrier": None,
    "american-akita": "An American development of Japan’s Akita, they kept the massive spitz frame and independent mind. Reserved with strangers, devoted at home, and not a Golden Retriever in a thicker coat.",
    "american-cocker-spaniel": "The smaller, rounder-headed cousin of the English Cocker, they diverged in the 20th century under different show standards. A merry spaniel brain remains: busy nose, busy ears, happiest when the day includes a field or at least a long sniff.",
    "american-eskimo-dog": "A white German spitz that was renamed in America, they were circus and companion dogs, not Arctic freight haulers. Fox face, plume tail, and a bark that still thinks the neighborhood needs announcing.",
    "american-foxhound": "George Washington helped shape this pack hound from English and French stock. They run for miles on a fox scent, bay in chorus, and were never meant to be an apartment solo act.",
    "american-pit-bull-terrier": "A bull-and-terrier from 19th-century America, they were farm and family dogs as much as pit athletes. A well-bred one is people-oriented and athletic; the reputation is louder than a steady home dog.",
    "american-staffordshire-terrier": "A stockier American bull-and-terrier, they were companions and farm dogs after the pit era faded. Muscular, loyal, and still a serious athlete under the couch manners.",
    "anatolian-shepherd": "A Turkish livestock guardian, they worked independently with flocks on the Anatolian plateau. Size, a calm head, and a night watch come with the job — they decide, they do not wait for a whistle.",
    "australian-kelpie": "Australia’s endlessly running herder, they work cattle and sheep in heat that would stop a softer dog. Lean, clever, and convinced the livestock — or the household — should keep moving.",
    "azawakh": "A West African sighthound of the Sahel, they were guardians and hunters for nomadic peoples. Lean as a gazelle, reserved with strangers, and built for heat, not for a wet northern winter.",
    "barbet": "France’s woolly water dog, they retrieved from marshes long before they were a curly companion. The beard (barbe) is in the name; the love of mud is in the contract.",
    "beauceron": "A French herding and guard dog from the Beauce plains, they are large, double-dewclawed, and serious. They moved sheep and cattle, then police work, and still want a job with a point.",
    "bedlington-terrier": "A lamb-shaped ratter from Northumberland mining country, they are not as soft as they look. Fast, game, and still a terrier under the lint-colored coat.",
    "belgian-shepherd": "Four coat varieties, one working brain: Groenendael, Tervuren, Malinois, and Laekenois. Belgian herders that became police and sport dogs, they still need a task more than a sofa.",
    "bichon-fris": "A Franco-Belgian powder-puff companion, they sailed with sailors, worked in circuses, and still clown for an audience. Low-shedding white coat, high need to be in the room.",
    "boerboel": "A South African farm mastiff, they guarded homesteads against predators and people. Powerful, territorial, and not a casual first dog — a Boerboel is a gate with a pulse.",
    "border-terrier": "From the English–Scottish border, they were fox-working terriers small enough to follow underground. Wiry, otter-headed, and still sure the garden is a den that needs checking.",
    "bouvier-des-flandres": "A cattle driver of Flanders, harsh-coated and bearded, they drafted, herded, and later did police work. Big, weatherproof, and not a decoration in a studio apartment.",
    "briard": "A long-coated French herder, they moved sheep and guarded the farm. The beard and eyebrows hide a serious working dog who still wants a flock — or a family — to manage.",
    "brittany": "A French pointing dog, orange-and-white or liver-and-white, they hunt close and happy. Compact, birdy, and still a field dog even when the field is a city park.",
    "bull-terrier": "The egg-headed British bull-and-terrier, they were 19th-century gladiators remade as companions. Playful, stubborn, and built like a torpedo with opinions.",
    "cairn-terrier": "A Scottish earth terrier from the cairns of the Highlands, they hunted otter and fox among the rocks. Toto in The Wizard of Oz was this breed — small, sturdy, and not easily impressed.",
    "chesapeake-bay-retriever": "Bred to haul ducks from icy Chesapeake water, they have a wavy, oily coat and a serious work ethic. Less clown than a Lab, more waterproof, and still a retriever who wants a job in the wet.",
    "collie": "Scotland’s long-nosed sheepdog, made famous by Lassie, they herded in rough country and still try to manage the household. The rough coat is the postcard; the brain is the story.",
    "english-cocker-spaniel": "The original cocker, built to flush woodcock from cover, they are merrier and longer-backed than the American show type. A busy spaniel nose, a soft mouth, and a need to be in on every walk.",
    "english-setter": "A speckled English bird dog, they range and point with a waving tail. Gentle in the house, endless in the field, and still happiest when the day smells like grouse.",
    "finnish-spitz": "Finland’s barking bird dog, they locate game and then yodel to call the hunter in. Fox-red, fox-faced, and still a talker — silence is not in the job description.",
    "finnish-lapphund": "A reindeer-herding spitz of Finnish Lapland, they worked in snow and still wear a weatherproof ruff. Friendly, vocal, and not a quiet apartment fern.",
    "german-pinscher": "The original pinscher, a German ratter and watch dog, they sit between the Mini and the Dobermann. Sleek, sharp, and still sure the house needs a manager.",
    "greenland-dog": "An Inuit sled dog of Greenland, they are freight and hunting partners, not indoor pets who happen to look arctic. Tough, pack-minded, and built for ice, not for a hot suburb.",
    "irish-setter": "Ireland’s chestnut gundog, they flush and retrieve with a waving mahogany coat. Merry, birdy, and still a field dog under the show-ring glamour.",
    "irish-terrier": "One of Ireland’s oldest terriers, red-coated and game, they were farm and wartime dogs. Independent, fiery, and still convinced they are larger than the door they just walked through.",
    "irish-water-spaniel": "Ireland’s tall, curly ‘bog dog,’ they retrieved from cold water with a rat-tail and a topknot. Clownish, waterproof, and still a specialist, not a generic spaniel.",
    "english-springer-spaniel": "Springers flush — “spring” — birds from cover, then fetch. The happy, driving spaniel brain never really clocks out, which is why a tired Springer is a pleasant Springer.",
}


def main() -> None:
    data = json.loads(PATH.read_text())
    for b in data:
        hid = HAND.get(b["id"])
        origin = infer_origin(strip_canned(b["story"]), b.get("origin") or "", b["id"])
        if origin and origin != b.get("origin"):
            b["origin"] = origin
        b["intro"] = fix_intro(b.get("intro") or "", b.get("origin") or "", b["name"])
        if hid:
            b["story"] = hid
        else:
            b["story"] = rewrite(b)
            b["intro"] = fix_intro(b["intro"], b.get("origin") or "", b["name"])
        b["story"] = re.sub(r"\s*\([^)]*:[^)]*\)", "", b["story"])
        b["story"] = re.sub(r"\s+", " ", b["story"]).strip()
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    canned = sum(1 for b in data if "walk, a puzzle, or guarding the couch" in b["story"])
    far = sum(1 for b in data if b.get("origin") == "A Faraway Kennel")
    print("rewrote", len(data), "canned_left", canned, "faraway_left", far)
    print("sample affen:", next(b["story"] for b in data if b["id"] == "affenpinscher")[:180])
    print("sample obscure:", next(b["story"] for b in data if b["id"] == "abruzzo-maremma-sheepdog")[:220])


if __name__ == "__main__":
    main()
