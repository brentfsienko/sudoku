#!/usr/bin/env python3
"""Expand Daily Dog stories into two narrative paragraphs each."""

from __future__ import annotations

import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path("/Users/brentsienko/code/sudoku")
EXTRA = ROOT / "src/lib/dailyDog/extraBreeds.json"
BREEDS_TS = ROOT / "src/lib/dailyDog/breeds.ts"

UA = "SudogkuDailyDog/1.0 (https://playsudogku.com; story expand)"
CTX = ssl.create_default_context()

# Hand-written two-paragraph stories for the 32 core Daily Dogs.
CORE_STORIES = {
    "golden-retriever": (
        "In the Scottish Highlands of the 1800s, Lord Tweedmouth wanted a dog that could fetch waterfowl from icy lakes without leaving a mark on the bird. At Guisachan he spent decades on a yellow retriever whose water-repellent coat still dries in a hurry after a swim, and whose mouth is gentle enough for a duck — or a tennis ball.\n\n"
        "That same eager brain later made goldens favorite guide and therapy dogs, the kind that will work a whole afternoon if you give them a job. They still want a person and a purpose more than a quiet kennel, and they will happily carry both your bird and your day if you ask."
    ),
    "shiba-inu": (
        "High in Japan’s mountains, the Shiba once hunted small game with a bold, catlike independence that never really left the breed. They still lick themselves clean, keep a cool distance from strangers, and wear the name like a map: shiba means brushwood, the terrain they worked.\n\n"
        "They are one of Japan’s oldest native dogs, and they nearly vanished in the twentieth century before fanciers pulled them back. Cross a Shiba and you may hear the famous scream — a protest as dramatic as it is loud — because this is a dog that would rather argue than obey for the sake of it."
    ),
    "pug": (
        "For centuries, imperial Chinese courts kept pugs as living lap ornaments. Those deep facial folds were a point of pride; a wrinkle on the forehead was even called a prince mark, as if the dog had been stamped for palace life.\n\n"
        "Dutch traders carried them west, and European parlors soon learned the snorts, sneezes, and single-minded quest for a lap. The trade-off is a short snout that makes hot days hard work. A pug would rather share a sofa than a long run in the sun, and it will remind you of that with every snuffling sigh."
    ),
    "beagle": (
        "English packs once followed beagles through hedgerows by sound as much as sight. Their bay is a rolling howl that says the trail is live, and a beagle’s nose can pick up a scent days old — which is why they still work at airports, quietly checking bags while looking like they only came for the snacks.\n\n"
        "They were bred to work in a chorus, so a lonely beagle can sound like a one-dog choir. Snoopy did not hurt the fame, but the real beagle is less philosopher than detective: a counter of unattended food never stands a chance, and a walk without a sniff is barely a walk at all."
    ),
    "poodle": (
        "That fancy clip began as workwear. Hunters left hair on the joints so a water retriever would not freeze, and the name likely comes from the German pudel, to splash. Under the pom-poms is still a dog built to swim out and bring a bird back.\n\n"
        "Whether toy, miniature, or standard, the poodle is one of the sharpest students in dog sport, and a low-shedding coat that allergy-conscious families still seek out. They would rather learn a trick than sit still, and all three sizes share that same busy, splash-ready mind."
    ),
    "pomeranian": (
        "Pomeranians once looked more like small sled dogs, spitz cousins with a job in the cold. Queen Victoria’s tiny companions helped shrink the breed into the fox-faced puffball we know, complete with a ruff of double coat and a plume tail curled over the back.\n\n"
        "What did not shrink was the watchdog instinct. A Pom will announce the mail carrier as if the house were under siege, and they will remind you they are still northern dogs every time a leaf moves outside. Tiny frame, full-size opinions."
    ),
    "siberian-husky": (
        "The Chukchi people of Siberia needed a dog that could pull light loads across endless ice without burning out. Huskies still carry that endurance, often with ice-blue eyes — or one of each color — and they would rather howl and “talk” than bark, a leftover conversation from the trail.\n\n"
        "They are famous escape artists. A bored husky will cheerfully redesign the yard into a new sled route, then look innocent about the hole in the fence. This is a dog that was built for miles with a team, not for an empty afternoon on a couch."
    ),
    "pembroke-welsh-corgi": (
        "On Welsh farms, a corgi’s job was to nip cattle heels while staying under the kick line — hence those famous short legs. Folklore says the dogs were gifts from woodland fairies, which is a charming way to explain a dog that thinks it runs the pasture.\n\n"
        "Queen Elizabeth II kept more than thirty Pembrokes, which turned a herding dog into a royal icon. Pembroke and Cardigan corgis are actually separate breeds, and that heel-nipping instinct still shows up on ankles in the hallway. A tired corgi is a pleasant housemate; an idle one has opinions about your feet."
    ),
    "dalmatian": (
        "Dalmatian puppies arrive as blank white canvases. The spots bloom in the first weeks, each coat as unique as a fingerprint, a slow-developing map of the dog they will be.\n\n"
        "They once ran beside horse-drawn fire coaches, clearing the road and guarding the horses at the scene. That partnership is why they still live in firehouses in people’s imaginations — and sometimes in real ones. They were built for miles at a trot, so a short walk around the block rarely feels like a full day’s work."
    ),
    "greyhound": (
        "A greyhound’s deep chest and springy spine can push them past forty miles an hour, among the fastest of land mammals. They hunt by sight, not scent, which is why a flash of motion can still light the afterburners even in a quiet suburb.\n\n"
        "The surprise is what happens after the sprint: they are legendary couch potatoes. Give them a burst of speed, then a soft blanket, and they have had a perfect day. That is why retired racers often make such quiet house pets — the rocket is real, and so is the nap."
    ),
    "basenji": (
        "In Central Africa the Basenji hunted in silence, and an unusual larynx still makes them yodel instead of bark. They groom like cats, carry almost no doggy smell, and typically come into season only once a year, leftovers from a hunting past that never fully left the breed.\n\n"
        "Look at ancient Egyptian art and you will see dogs that could walk off the wall into a modern Basenji ring. Even a devoted Basenji keeps a streak of independence. They will love you, and they will still decide whether your plan is interesting enough to join."
    ),
    "border-collie": (
        "Along the English–Scottish border, shepherds needed a dog that could move a flock with a stare. That intense “eye” still makes Border Collies the world’s top sheepdogs, a living remote control for wool on the hillside.\n\n"
        "One famous collie named Chaser learned more than a thousand toy names — proof that this breed needs a job, not just a backyard. Without sheep they will herd children, bicycles, and vacuum cleaners. A tired Border Collie is a pleasant one, and an idle one invents chaos."
    ),
    "german-shepherd": (
        "Captain Max von Stephanitz set out to build one versatile German working dog, and the shepherd that resulted still leads police and rescue lines. Loyalty and a serious work ethic were never a costume; they were the design.\n\n"
        "A World War I stray named Rin Tin Tin then carried the breed onto Hollywood screens, but the real dog still needs a task with a point — training, tracking, or a long purposeful walk. Leave them without one and they may invent a job of their own, usually involving the garden or the curtains."
    ),
    "labrador-retriever": (
        "Off the coast of Newfoundland, fishermen needed a dog that could haul nets and grab fish that wriggled free. The Labrador’s otter tail still steers like a rudder in cold water, and the webbed feet and soft mouth were tools long before they were cute.\n\n"
        "Back on land they became America’s most registered breed, a family dog that never quite forgot the harbor. Yellow, black, and chocolate are all the same dog in different coats. Give them water, a retrieve, or a person with a ball, and the old fishing partner shows up in the living room."
    ),
    "french-bulldog": (
        "Lace workers leaving England for France tucked small bulldogs into their luggage, and those dogs grew the bat ears that now define the Frenchie. Those ears were once a fault and became the hallmark, a city dog’s silhouette.\n\n"
        "The compact, front-heavy body is charming on a couch and clumsy in a pool. Most would rather snore beside you than swim a lap, and they overheat quickly, so August is for air-conditioning, not park sprints. A Frenchie is a companion with a soundtrack of snorts, not a weekend athlete."
    ),
    "dachshund": (
        "The name means “badger dog,” and the long, low body was built to follow prey down a burrow. Smooth, longhaired, or wirehaired, in two sizes, the dachshund still thinks it is bigger than the badger.\n\n"
        "That same spine is strong in the tunnel and fragile on the sofa — jumping off furniture is a real risk. A dachshund on a scent will cheerfully forget that it was supposed to come when called. They were never a lapdog that happens to be short. They are a hunter that happens to fit under a chair."
    ),
    "australian-shepherd": (
        "Despite the name, the modern Aussie grew up on American ranches, not Australian stations. Basque shepherds in the American West helped shape the dog we have now: a herding partner with a merle coat that can pair with two different eye colors, and many born with a naturally bobbed tail.\n\n"
        "Put them on cattle — or a frisbee — and the herding brain lights up. A quiet house all day is usually not enough of a job. They will invent work from the mail slot, the cat, and your running shoes, because the ranch never really left their heads."
    ),
    "boxer": (
        "Watch a boxer play and you may see the namesake move: they rise and bat with their front paws. German police and army kennels were among the first to put that athletic build to work, a clown with biceps on a serious chassis.\n\n"
        "A wrinkled brow and undershot jaw give them an almost human look, as if they are always about to tell a joke. They stay puppyish for years, and a boxer looping the yard is simply using the engine they were given. They want a person in the game, not a backyard they patrol alone."
    ),
    "chihuahua": (
        "Named for the Mexican state where travelers first fell for them in the 1800s, Chihuahuas are the smallest recognized breed and among the surest they are large. The apple-shaped skull is a hallmark, and some puppies are even born with a soft spot called a molera.\n\n"
        "They come in smooth and long coats, both with oversized views on the world. What they lack in pounds they spend in watchdog opinions, and a sweater in winter is practical: that tiny body loses heat fast. They will love you fiercely and still scold the universe from the arm of the couch."
    ),
    "great-dane": (
        "Some Great Danes stand more than three feet at the shoulder, a size once aimed at wild boar and later at estate gates. They were once called Deutsche Dogge — German mastiff — and they grow up in a hurry, giant hearts included.\n\n"
        "Off duty they are gentle giants who think they are lapdogs. Scooby-Doo did not hurt: a cartoon Dane taught the world to expect a goofy heart in a towering frame. Expect them to lean, to snore, and to believe your sofa was measured for them."
    ),
    "rottweiler": (
        "Roman drover dogs marched with the legions, and in the German town of Rottweil their descendants pulled butchers’ carts and guarded the day’s coins. When railways replaced cattle drives the breed nearly vanished before fanciers rebuilt it.\n\n"
        "A proper Rottweiler is calm and confident, not a constant barker. The story is work first, reputation second. A well-raised Rottweiler is still a steady shadow, not a show of teeth — a dog that would rather stand beside you than perform for a crowd."
    ),
    "yorkshire-terrier": (
        "In Yorkshire mill towns they earned their keep as ratters, then slipped into Victorian parlors as fashion. The floor-length coat is hair, not fur, often wrapped so it can keep growing. Puppies start black and tan; the steel-blue adult color arrives like a slow costume change.\n\n"
        "Under the bow is still a terrier. Many pet Yorkies wear a shorter cut and would chase a rat if you offered one. They are small enough for a handbag and stubborn enough for a barn, which is the whole joke and the whole charm."
    ),
    "boston-terrier": (
        "One of the first American-born breeds, the Boston Terrier earned the nickname American Gentleman for its tuxedo markings — white blaze, chest, and socks. They were built to be companions in a growing city, not hunters on a moor.\n\n"
        "That short muzzle means plenty of snoring and snuffling. Massachusetts named them the state dog in 1979, and they still suit apartments, provided you do not mind the soundtrack. A Boston wants to be in the room with you, dressed for dinner, breathing like a little engine."
    ),
    "akita": (
        "Once reserved for Japanese nobility and large game, the Akita carries a thick double coat and a curled tail like other northern spitz dogs. They remain reserved with strangers and devoted at home, a palace dog that never quite became a party dog.\n\n"
        "The most famous of them, Hachikō, waited at a Tokyo station for his person long after the last train. Helen Keller later helped introduce Akitas to the United States. Loyalty is not a slogan for this breed; it is the plot, and they will write it quietly at the door."
    ),
    "samoyed": (
        "The Samoyede people of Siberia used these white dogs to herd reindeer, pull sleds, and sleep as living heaters. They lived in the tents, not out in a yard, and the upturned “Sammy smile” kept drool from freezing on the trail.\n\n"
        "Their coat is so dense that shed fur is sometimes spun into yarn — a sweater from a snow cloud. A lonely Sammy will invent a song the neighbors will learn by heart, because this is a dog that was bred to stay close to people in the cold, not to wait outside it."
    ),
    "bernese-mountain-dog": (
        "In the Swiss canton of Bern, these tri-color farm dogs drafted carts of milk and cheese between alpine villages. Black, rust, and white is not just pretty — it is the breed’s uniform, and they are one of four Swiss mountain dogs.\n\n"
        "They are gentle giants who would rather a cool morning than a hot afternoon. They are not a long-lived breed, which makes those calm years feel even more precious. A Berner wants to be near the work and near the people, preferably both at once, on a road that smells like grass."
    ),
    "newfoundland": (
        "Webbed feet, a waterproof coat, and huge lungs made the Newfoundland a born lifeguard in icy Atlantic water. Fishermen used them as living tow-lines, and they still swim with a kind of breaststroke that looks almost human from the shore.\n\n"
        "J.M. Barrie’s dog Luath inspired Nana in Peter Pan, the nanny who thought in woofs. Calm rescue instinct is still the breed’s quiet superpower. Expect drool, wet floors, and a dog that treats every puddle like a drill — then leans on you as if you were the one who needed saving."
    ),
    "whippet": (
        "English mill towns once called the whippet the poor man’s racehorse: a sighthound in miniature that could hit about 35 miles an hour. Families also kept them as hearth companions, a pocket sprinter who came inside when the mill whistle blew.\n\n"
        "After the burst they want a blanket, because thin skin and low fat make them chilly. Speed, then snuggle, is the whole personality. A squirrel can still make a whippet forget its own name for twenty seconds, and then it will steal your spot on the sofa as if nothing happened."
    ),
    "maltese": (
        "Greek and Roman writers already described small white dogs from Mediterranean islands. The Maltese coat has little undercoat, so it hardly sheds and can grow to the floor — single-layered hair that can also be kept in a short pet trim.\n\n"
        "European nobles kept them as living jewelry, lap warmers for people who could afford not to hunt. They have a very old passport and a very current job: sit close, look like a cloud, and announce visitors as if the palace still had a gate."
    ),
    "saint-bernard": (
        "Hospice monks in the Alps sent these dogs into blizzards to find lost travelers. The brandy barrel is a painter’s myth, not a packing list. A nineteenth-century Saint named Barry is still credited with dozens of mountain rescues — a reminder that the real tool was a nose, not a cask.\n\n"
        "The original hospice dogs were smaller and shorter-haired than the Saints in paintings, and avalanche work has mostly passed to machines. The drooly giant remains, a dog whose story is still about finding someone in the weather, even if the weather is just your front hall after a walk."
    ),
    "australian-cattle-dog": (
        "On huge Australian stations, these dogs drove cattle by nipping heels across distances that would melt a softer breed. They were mixed with dingoes and collies to handle wild cattle, and puppies are born white; the blue or red speckle fills in like a developing photograph.\n\n"
        "One cattle dog named Bluey is often listed among the longest-lived dogs ever recorded, which fits a breed built for years of hard miles. A cattle dog without a job will invent one — usually involving your ankles. They want a herd, and if you do not have cattle, you will do."
    ),
    "weimaraner": (
        "Nobles in Weimar kept this silver hunting dog to themselves for big game, and the nickname Grey Ghost still fits the coat and the light eyes. They were once so closely held that leaving Weimar with one was almost a scandal.\n\n"
        "Photographer William Wegman later posed Weimaraners like people, and the world fell for the deadpan stare. Under the art-school fame is still a dog that wants to range, and they still suffer if left alone. The Grey Ghost wants a person, not a kennel, and a day with something to hunt — even if the quarry is a tennis ball in tall grass."
    ),
}

THE_ORIGINS = {
    "United States",
    "United Kingdom",
    "Netherlands",
    "Czech Republic",
    "Philippines",
    "Bahamas",
    "Gambia",
    "Sudan",
    "Congo",
    "Dominican Republic",
    "Marshall Islands",
    "Solomon Islands",
    "United Arab Emirates",
    "Democratic Republic of the Congo",
}

OPENERS = {
    "guardian": [
        "In {place}, shepherds needed a dog that would stay out with the flock when wolves came calling. The {name} grew up as a living fence, deciding who belonged on the hill and who did not.",
        "Night watches and hillside weather in {place} wrote this dog. The {name} was never a weekend pet; they were meant to sleep with the sheep and mean it.",
    ],
    "herding": [
        "In {place}, moving livestock was a job for a dog with brains and stamina. The {name} learned to read a herd the way some dogs read a tennis ball.",
        "Someone in {place} needed cattle or sheep shifted without losing half the flock to the next valley. That was the {name}'s first assignment, and it never really left their heads.",
    ],
    "sighthound": [
        "In {place} they hunted with their eyes, not their noses. The {name} still lights up at a flash of motion — a sprinter first, a house dog second.",
        "Open ground in {place} favored a dog that could see game and close the gap in a hurry. The {name} still carries that afterburner, even in a quiet suburb.",
    ],
    "scenthound": [
        "In {place} the work was in the woods or under the hedge, following a trail long after it had gone cold. The {name} was built as a detective with four legs.",
        "A nose like this was the whole point in {place}. The {name} still follows a trail the way other dogs follow a ball, head down and committed.",
    ],
    "terrier": [
        "In {place}, barns and stables needed a small dog that was not impressed by rats — or by bigger dogs. The {name} still thinks it is the one in charge.",
        "This is a vermin specialist at heart. In {place} they earned their keep bustling after what lived in the walls, bold for their size and not easily talked out of a hunt.",
    ],
    "retriever": [
        "In {place} someone needed a dog that would swim out, pick up a bird, and bring it back without a mark. That was the {name}'s first job, and the eager brain never clocked out.",
        "Water, cover, and a soft mouth shaped the {name} in {place}. They still light up at a throw, as if the marsh were just on the other side of the fence.",
    ],
    "spaniel": [
        "In {place} they worked close to the gun, flushing birds from cover and bustling through the hedge. The {name} still wants a field in the day.",
        "Flushing and fetching wrote the {name} in {place}: close-working, busy, and happiest when the afternoon has something to quarter.",
    ],
    "pointer": [
        "Hunters in {place} needed a dog that could find game and freeze on it, a living compass. The {name} still has that on-off switch.",
        "In {place} the {name} learned to lock onto a bird and wait. That statue-still pause is still in there, even when the quarry is a sparrow in the park.",
    ],
    "sled": [
        "In {place} the miles were cold and the loads were heavy. The {name} was bred for endurance first, sofa second, and a voice that would rather talk than whisper.",
        "Snow and distance in {place} asked for a partner who could haul without burning out. The {name} still thinks a day without miles is a day half-done.",
    ],
    "mastiff": [
        "In {place} they wanted a dog that could hold ground and look like they meant it. The {name} is still a guardian in a heavy frame, then a leaner on the people they love.",
        "Bulk was the point in {place}: a dog who could stop trouble by arriving. The {name} still takes up a doorway as if it were a job.",
    ],
    "toy": [
        "In {place} they were companions and alarm bells more than farm hands. The {name} is tiny on purpose — living jewelry that still has opinions.",
        "Palace laps and city parlors in {place} suited a small dog with a big watchdog streak. The {name} still wants a person within reach and a say in who comes through the door.",
    ],
    "hairless": [
        "The missing coat is the headline, but the {name} from {place} is a real dog underneath — watchful, warm-seeking, and not a costume.",
        "In {place} people kept dogs that happened to be bald, not novelties on a pillow. The {name} still wants sweaters, sunbeams, and company.",
    ],
    "spitz": [
        "Prick ears, a curled tail, and a weatherproof coat: the {name} from {place} is a classic northern type, even far from snow, and still sure of itself.",
        "In {place} this kind of dog kept a streak of independence and a voice that carries. The {name} will narrate the neighborhood until you give them a job.",
    ],
    "default": [
        "Work and weather in {place} shaped the {name} you meet today, a body and a brain built for a real task, not just a cute face on a feed.",
        "In {place} this dog earned a place by doing something useful. The {name} still makes the most sense with a partnership — a walk with a point, and a person who stays.",
    ],
}

CLOSERS = {
    "guardian": [
        "House life still suits them best when they have people and a perimeter to watch, not a day with nothing to guard. Give them a yard and a reason to stay alert, and the old hillside job is still in there.",
        "They would rather keep watch than play fetch. A quiet night on duty is their idea of a good time, and a bored guardian will invent a threat just to have a job.",
    ],
    "herding": [
        "Without sheep or cattle they will herd whatever is handy — children, cats, the vacuum — because the job never left their heads. A tired herding dog is a pleasant housemate; an idle one has opinions about traffic in the hallway.",
        "They still want a flock, and if you do not have one, you will do. A long walk with a purpose beats a quiet crate every time.",
    ],
    "sighthound": [
        "After the sprint they want a soft landing. Speed is the story; the nap is the sequel, and both are the dog.",
        "The rocket is real, and so is the couch. Give them a burst, then a blanket, and they have had a perfect day.",
    ],
    "scenthound": [
        "On a walk they are detectives first. Call them off a scent and you are interrupting a novel they can still smell.",
        "A lonely hound can sound like a one-dog choir, because they were built to work in a chorus. Let them sniff, or they will write the opera themselves.",
    ],
    "terrier": [
        "Give them something to bustle after — a toy, a rustle, a job — and the old barn hunter shows up in a modern hallway. Small does not mean shy, and it never meant easily bored.",
        "They will argue with a leaf, a doorbell, and your other dog, then nap like nothing happened. A terrier without a hunt invents one.",
    ],
    "retriever": [
        "A good day still looks like a retrieve and a person. Take away the work and they will invent a fetch out of your socks.",
        "They still want water, a throw, or a job with a point. Leave them idle and the old fishing partner will redecorate the living room.",
    ],
    "spaniel": [
        "They still want to quarter the grass and check every hedge. A bored spaniel will hunt the living room with great sincerity.",
        "Keep the day busy and close. A spaniel that gets to bustle is a spaniel that sleeps; one that does not will hunt the sofa cushions.",
    ],
    "pointer": [
        "That on-off switch is still there. They will lock onto a sparrow in the park, then melt back into a house dog who wants to be near you.",
        "They want a person in the field, even if the field is a city park. A pointer without a bird will still find something to freeze on.",
    ],
    "sled": [
        "They still need miles. A bored northern dog will sing, dig, and redesign the fence until the day feels like a trail again.",
        "This is a dog built for a team and a route, not an empty afternoon. Give them distance, or they will invent an escape hatch.",
    ],
    "mastiff": [
        "Under the bulk is usually a calm shadow, not a constant alarm. They want to be in the room, taking up most of it.",
        "They would rather stand beside you than perform for a crowd. Expect them to lean, to snore, and to believe the sofa was measured for them.",
    ],
    "toy": [
        "They still want a lap and a say in who comes through the door. Small does not mean quiet, and it never meant shy.",
        "They will love you fiercely and still scold the universe from the arm of the couch. A sweater in winter is practical; so is letting them believe they run the house.",
    ],
    "hairless": [
        "They want sweaters, sunbeams, and company. Treat them like a dog who happens to be bald, not a novelty on a pillow.",
        "Warmth is a need, not a fashion choice. Give them a person, a coat when it is cold, and the dignity of being a real dog.",
    ],
    "spitz": [
        "They keep a streak of independence and a voice that carries. A bored spitz will narrate the neighborhood until you give them a job.",
        "They were never designed to fade into the furniture. Walk them, work them a little, and enjoy the commentary.",
    ],
    "default": [
        "They still make the most sense with a partnership — a walk with a point, a person who stays, and a little work in the day.",
        "Give them something useful to do and they remember why they were kept. A bored working dog will invent a job, usually involving the garden.",
    ],
}


CACHE = Path("/tmp/sudoku-wiki-extracts.json")


def wiki_title(url: str) -> str:
    return urllib.parse.unquote(url.rstrip("/").rsplit("/", 1)[-1])


def load_cache() -> dict[str, str]:
    if CACHE.exists():
        try:
            return json.loads(CACHE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=0))


def fetch_extract(title: str) -> str:
    q = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "prop": "extracts",
            "exintro": "1",
            "explaintext": "1",
            "redirects": "1",
            "titles": title,
        }
    )
    url = "https://en.wikipedia.org/w/api.php?" + q
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=25) as r:
            data = json.loads(r.read().decode())
    except Exception:
        return ""
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        if int(page.get("pageid") or 0) < 0:
            return ""
        return re.sub(r"\s+", " ", (page.get("extract") or "").strip())
    return ""


def split_sents(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def finish(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    s = s.strip(" ,;:")
    s = re.sub(r"\s+\.", ".", s)
    s = re.sub(r"\.{2,}", ".", s)
    if s and s[0].islower():
        s = s[0].upper() + s[1:]
    if s and s[-1] not in ".!?":
        s += "."
    return s


def boring(s: str) -> bool:
    low = s.lower()
    if re.search(
        r"recognized by|kennel club|fédération|fci\b|breed standard|may refer to|asociación canina|recognised by|national law",
        low,
    ):
        return True
    if re.search(r"also known as .{10,120} among many other names", low):
        return True
    if (s.count('"') + s.count("“") + s.count("”")) >= 4:
        return True
    if re.search(r"dog fighting|dogfight|pit fighting", low):
        return True
    if re.search(
        r"lethal|attacks on humans|legal controls|dangerous dog|banned in|fatal attack",
        low,
    ):
        return True
    if re.search(r"the others being|one of fourteen animal|toy dog group|highly dependent on training", low):
        return True
    if re.search(r"should ideally|eyes should|according to the breed standard|gold colour", low):
        return True
    if re.search(r"\b(tread is|gait is|in large specimens|croup|withers)\b", low):
        return True
    if ")" in s or s.lstrip().startswith((",", "Association", "a state-funded")):
        return True
    if re.search(r"sexual dimorphism|weight range is from|endangered breed|recovery project", low):
        return True
    if len(re.findall(r"\b(?:Dog|Hound|Husky|Retriever|Terrier|Spaniel|Shepherd|Malamute)\b", s)) >= 3:
        return True
    if re.search(r"\b\d+\s*[–-]\s*\d+\s*(inches|in\b|pounds|lb|cm|kg)\b", low) and "origin" not in low:
        return True
    if len(s) < 28:
        return True
    return False


def is_definition(s: str) -> bool:
    return bool(
        re.search(
            r"\b(?:is|are|was|were)\s+an?\s+(?:[A-Za-z][A-Za-z,-]+\s+){0,10}(?:breed|dog|landrace|type|variety|hound|terrier|spaniel|mastiff)\b",
            s,
        )
    )


def place_name(origin: str) -> str:
    o = (origin or "").strip()
    if not o or o.lower() in {"unknown", "a faraway kennel"}:
        return "their homeland"
    if o.lower().startswith("the "):
        return o
    if o in THE_ORIGINS:
        return "the " + o
    return o


def pick(items: list[str], name: str) -> str:
    return items[sum(map(ord, name)) % len(items)]


def detect_job(name: str, origin: str, extract: str) -> str:
    n = name.lower()
    t = f"{name} {origin} {extract}".lower()
    if any(w in n for w in ("hairless", "xolo", "pila", "crested", "sand terrier", "naked")):
        return "hairless"
    if any(w in n for w in ("malamute", "husky", "laika", "inuit", "greenland")):
        return "sled"
    if any(w in n for w in ("bully", "pit bull", "staffordshire")):
        return "mastiff"
    if any(w in n for w in ("greyhound", "whippet", "saluki", "afghan", "podenco", "galgo", "lurcher", "staghound", "sloughi", "azawakh", "borzoi")):
        return "sighthound"
    if any(w in n for w in ("cocker", "spaniel", "springer")):
        return "spaniel"
    if any(w in n for w in ("pointer", "setter", "braque", "vizsla", "weimaraner", "bracco")):
        return "pointer"
    if any(w in n for w in ("retriever", "labrador")):
        return "retriever"
    if any(w in n for w in ("beagle", "coonhound", "foxhound", "basset", "bloodhound", "drever", "harrier", "otterhound")):
        return "scenthound"
    if any(w in t for w in ("livestock guardian", "flock guardian", "guard sheep", "protecting herds")):
        return "guardian"
    if any(w in n for w in ("sheepdog", "corgi", "collie", "kelpie", "heeler", "cattle dog", "shepherd", "cattledog")):
        return "herding"
    if any(w in n for w in ("mastiff", "molosser", "bulldog", "cane corso", "dogue", "fila")):
        return "mastiff"
    if any(w in n for w in ("terrier", "pinscher", "schnauzer")):
        return "terrier"
    if any(w in n for w in ("chihuahua", "papillon", "maltese", "havanese", "pomeranian")):
        return "toy"
    if any(w in t for w in ("hairless", "naked")):
        return "hairless"
    if any(w in t for w in ("sled", "freight", "sledge", "inuit")):
        return "sled"
    if any(w in t for w in ("livestock guardian", "flock guardian", "guardian dog", "ovcharka", "protecting herds", "guard sheep")):
        return "guardian"
    if any(w in t for w in ("herding", "sheepdog", "cattle dog", "kelpie")):
        return "herding"
    if any(w in t for w in ("sighthound", "gazehound", "by sight", "warren hound")):
        return "sighthound"
    if any(w in t for w in ("scent hound", "scenthound", "coonhound", "by scent", "pack-hunting")):
        return "scenthound"
    if "hound" in n or "hound" in t:
        return "scenthound"
    if "terrier" in t:
        return "terrier"
    if any(w in t for w in ("retriever", "water dog")):
        return "retriever"
    if "spaniel" in t:
        return "spaniel"
    if any(w in t for w in ("pointer", "pointing dog")):
        return "pointer"
    if any(w in t for w in ("mastiff", "molosser", "bulldog")):
        return "mastiff"
    if "spitz" in t:
        return "spitz"
    if any(w in t for w in ("toy dog", "companion dog", "lap dog")):
        return "toy"
    if any(w in t for w in ("watchdog", "guard dog")):
        return "guardian"
    return "default"


def tidy_clause(bit: str) -> str:
    bit = re.sub(r"\s+", " ", bit).strip(" ,;:")
    bit = re.split(r"\b(?:and is |and was |and they |while |that originated|that is |that was )\b", bit, maxsplit=1)[0]
    bit = re.sub(r"\s*\([^)]*\)\s*", " ", bit)
    return re.sub(r"\s+", " ", bit).strip(" ,;:.")


def from_definition(s: str, name: str) -> list[str]:
    pieces: list[str] = []
    patterns = [
        (r"originat(?:ed|ing) (?:in|from) (.+)", "They first took shape in {}."),
        (r"native to (.+)", "They come from {}."),
        (r"indigenous to (.+)", "They belong to {}."),
        (r"from (?:the )?(?:département|valley|region|state|town) of (.+)", "They come from {}."),
        (r"also (?:called|known as) (.+?)(?:[,.]|$)", "People have also called them {}."),
        (r"(?:formerly|traditionally|once|historically) (?:kept|used|bred) (as|for|to) (.+)", "They once earned their keep {} {}."),
        (r"used (as|for|to) (.+)", "People kept them {} {}."),
        (r"developed (in|from) (.+)", "They were developed {} {}."),
    ]
    for pat, tmpl in patterns:
        m = re.search(pat, s, re.I)
        if not m:
            continue
        groups = [tidy_clause(g) for g in m.groups()]
        bit = groups[-1]
        if "breed" in bit.lower() and "standard" in bit.lower():
            continue
        if 12 < len(bit) < 160:
            filled = tmpl.format(*groups) if len(groups) > 1 else tmpl.format(bit)
            if name.lower() in filled.lower()[: len(name) + 8]:
                continue
            pieces.append(finish(filled))
    return pieces[:2]


def rewrite_fact(s: str, name: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s*\([^)]*\)\s*", " ", s)
    s = re.sub(rf"^The {re.escape(name)}s?\b,?\s*", "", s, flags=re.I)
    s = re.sub(rf"^{re.escape(name)}s?\b,?\s*", "", s, flags=re.I)
    s = re.sub(r"^The breed\b,?\s*", "", s, flags=re.I)
    verb = re.match(r"^(is|are|was|were|has|have)\b(.*)$", s, re.I)
    if verb:
        mapped = {"is": "are", "are": "are", "was": "were", "were": "were", "has": "have", "have": "have"}[verb.group(1).lower()]
        s = "They " + mapped + verb.group(2)
    if re.match(r"^It is (unknown|possible|said|believed|thought|unclear)\b", s, re.I):
        return finish(s)
    if re.match(r"^It (is|was|has|originated)\b", s):
        s = re.sub(
            r"^It (is|was|has|originated)\b",
            lambda m: {"is": "They are", "was": "They were", "has": "They have", "originated": "They originated"}[
                m.group(1).lower()
            ],
            s,
        )
    s = re.sub(r"\bare indigenous to\b", "come from", s, flags=re.I)
    s = re.sub(r"\boriginates in\b", "come from", s, flags=re.I)
    s = re.sub(r"\brecognized as a breed\b", "kept as a distinct type", s, flags=re.I)
    s = re.sub(r"\bis a (?:dog )?breed(?: of dog)?\b", "is a dog", s, flags=re.I)
    if s.lower().startswith("they ") and " and is " in s:
        s = s.replace(" and is ", " and are ")
    if s.lower().startswith("they ") and " and was " in s:
        s = s.replace(" and was ", " and were ")
    s = re.sub(r"\bit is commonly kept\b", "they are commonly kept", s, flags=re.I)
    s = re.sub(r"^It possesses\b", "They have", s)
    s = re.sub(r"\bespecially to\b", "especially", s)
    s = re.sub(r"\bbecause it is\b", "because they are", s, flags=re.I)
    s = re.sub(r"\bwhether it is\b", "whether they are", s, flags=re.I)
    s = re.sub(r"\bits weight range is\b", "their weight range is", s, flags=re.I)
    s = re.sub(r"\bits tail is\b", "their tail is", s, flags=re.I)
    s = re.sub(r"\bits local name is\b", "their local name is", s, flags=re.I)
    s = re.sub(r"\s+\.", ".", s)
    s = re.sub(r"\.{2,}", ".", s)
    return finish(s)


def story_beats(extract: str, name: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for raw in split_sents(extract):
        if boring(raw):
            continue
        if is_definition(raw):
            candidates = from_definition(raw, name)
        else:
            candidates = [rewrite_fact(raw, name)]
        for fact in candidates:
            if not fact or boring(fact):
                continue
            if is_definition(fact):
                continue
            key = re.sub(r"[^a-z]+", "", fact.lower())[:80]
            if key in seen:
                continue
            seen.add(key)
            out.append(fact)
    return out[:6]


def overlaps(fact: str, opener: str) -> bool:
    words = {w for w in re.findall(r"[a-z]{5,}", fact.lower())}
    base = {w for w in re.findall(r"[a-z]{5,}", opener.lower())}
    if not words:
        return True
    return len(words & base) / len(words) > 0.45


def two_paragraphs(name: str, origin: str, extract: str) -> str:
    raise SystemExit(
        "job-category templates are retired; run scripts/unique-daily-dog-stories.py"
    )
    job = detect_job(name, origin, extract)
    place = place_name(origin)
    opener = pick(OPENERS[job], name).format(name=name, place=place)
    closer = pick(CLOSERS[job], name)
    beats = [b for b in story_beats(extract, name) if not overlaps(b, opener)]

    p1_bits = [opener]
    if beats and len(beats[0]) < 220:
        p1_bits.append(beats[0])
        beats = beats[1:]
    p1 = " ".join(p1_bits)

    p2_bits = []
    if beats:
        p2_bits.append(beats[0])
    p2_bits.append(closer)
    p2 = " ".join(p2_bits)

    p1 = re.sub(r"\s+", " ", p1).strip()
    p2 = re.sub(r"\s+", " ", p2).strip()
    return f"{p1}\n\n{p2}"


def patch_ts(text: str, breed_id: str, story: str) -> str:
    payload = json.dumps(story, ensure_ascii=False)
    pattern = re.compile(
        rf'(id: "{re.escape(breed_id)}"[\s\S]*?story:\s*)"(?:\\.|[^"\\])*"',
    )

    def repl(m: re.Match[str]) -> str:
        return m.group(1) + payload

    new, n = pattern.subn(repl, text, count=1)
    if n != 1:
        raise SystemExit(f"could not patch core story for {breed_id} (n={n})")
    return new


def main() -> None:
    extras_only = "--extras-only" in sys.argv
    limit = 0
    for arg in sys.argv[1:]:
        if arg.startswith("--limit="):
            limit = int(arg.split("=", 1)[1])

    if not extras_only:
        ts = BREEDS_TS.read_text()
        for bid, story in CORE_STORIES.items():
            ts = patch_ts(ts, bid, story)
        BREEDS_TS.write_text(ts)
        print("patched", len(CORE_STORIES), "core stories")

    extra = json.loads(EXTRA.read_text())
    cache = load_cache()
    rows = extra[:limit] if limit else extra
    for i, row in enumerate(rows, 1):
        title = wiki_title(row.get("sourceUrl") or "")
        if title in cache:
            extract = cache[title]
        else:
            extract = fetch_extract(title) if title else ""
            cache[title] = extract
            time.sleep(0.05)
        row["story"] = two_paragraphs(row["name"], row.get("origin") or "", extract)
        if i % 25 == 0:
            print(f"  {i}/{len(rows)}")
            save_cache(cache)
    save_cache(cache)
    if limit:
        extra[:limit] = rows
    EXTRA.write_text(json.dumps(extra, indent=2, ensure_ascii=False) + "\n")
    print("wrote", len(rows), "extra stories")


if __name__ == "__main__":
    main()
