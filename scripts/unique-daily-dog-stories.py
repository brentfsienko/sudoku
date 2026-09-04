#!/usr/bin/env python3
"""Rewrite extra Daily Dog stories from Wikipedia facts only — no job templates."""

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
CACHE = Path("/tmp/sudoku-wiki-extracts.json")
UA = "SudogkuDailyDog/1.0 (https://playsudogku.com; unique stories)"
CTX = ssl.create_default_context()

HAND_STORIES = {
    "bakhmull": (
        "The Bakhmull is a long-coated aboriginal sighthound kept in the former Soviet Union, closer to Central Asian tazy hunting dogs than to a British greyhound. Russian kennels wanted a dog that could course fox and hare in cold open country, with a coat that took winter seriously.\n\n"
        "Winter coat and all, they still run by eye. A hare on snow is the assignment, not a tennis ball in a hallway."
    ),
    "american-bully": (
        "The American Bully is a twenty-first-century companion from the United States, built on older bully-type dogs and kept for a compact, muscular house dog rather than a farm job. Kennel clubs began registering it in the 2000s, when breeders wanted a shorter, heavier-boned dog than the American Pit Bull Terrier.\n\n"
        "Coat colors and markings vary widely; what stays consistent is a blocky head and a people-facing temperament. They were bred as companions first. A good day is people, a short burst of play, and a nap that uses the entire cushion."
    ),
    "danish-swedish-farmdog": (
        "On farms in Denmark and southern Sweden this small spotted dog earned its keep as a ratter, a cattle-heeler, and an alarm that actually meant it. The native names — Dansk-Svensk Gårdshund and Skånsk terrier — still point to Scanian farmyards, not show rings.\n\n"
        "They are quick, curious, and built for a yard with jobs in it: a barn, a fence line, a person who will walk. A quiet crate all day is a mismatch for a dog that used to police a whole homestead."
    ),
    "dogue-brasileiro": (
        "The Dogue Brasileiro is a Brazilian molosser developed in the late twentieth century, a heavy guardian meant to protect property in a country that already had the Fila Brasileiro. Breeders wanted a slightly different head and a dog that would still fill a doorway.\n\n"
        "They remain uncommon outside Brazil. What they still do best is stay close to a household and look like they mean the perimeter, then flop as a large, serious couch-warmer when the gate is quiet."
    ),
    "illyrian-shepherd": (
        "Illyrian Shepherd is an older name for the livestock guardian of the Šar Mountains, the same mountain dog now usually called Šarplaninac. Shepherds on those high pastures wanted an overnight guardian that would face wolves, not a herding dog that nipped sheep into a pen.\n\n"
        "The coat is dense and weatherproof, the temperament independent. They still think in flock-sized distances. A fenced acre and a person who stays out with them beats a studio apartment they have to invent wolves for."
    ),
    "mallorcan-ratter": (
        "The Ca de Rater Mallorquí — the Mallorcan ratter — is a barn and warehouse dog from the island of Mallorca, built to catch rats among grain and boats. Compact, quick, and often tricolor or black-and-tan, they were never a parlor toy.\n\n"
        "They still treat a rustle in a wall as a job. Without rats they need a puzzle — a toy that crackles, a walk along a harbor wall, someone who will let them work the edges of a room."
    ),
    "afghan-hound": (
        "In Afghanistan this sighthound is still Sag-e Tāzī or Tāžī Spay, a hunter whose huge paw-pads worked as shock absorbers on rock. Other names — Balkh Hound, Balochi Hound, Barakzai Hound — map the same dog across valleys and tribes.\n\n"
        "The long coat is mountain weatherwear, not parlor fashion. They still run by eye over open ground. After the burst they want a quiet room and a person, a tapestry that can outrun a rumor."
    ),
    "belgian-malinois": (
        "The Malinois is the short-coated fawn Belgian shepherd, named for the city of Mechelen, and the variety police and army kennels still reach for. Same hillside brain as the other Belgian shepherds, different jacket: tight fawn hair, black mask, and a body built to work all day.\n\n"
        "Without sheep they will work a sleeve, a tracking line, or a person who trains. An idle Malinois invents traffic in the hallway. A tired one is the partner Belgian shepherds always meant."
    ),
    "belgian-shepherd": (
        "Belgian shepherds were the common farm dog of the low countries until the 1890s, when a club in Brussels tried to freeze four coat types into one breed: Groenendael, Tervueren, Malinois, and Laekenois. They share an ancestor with Dutch and German shepherds, a western European herding dog that actually worked sheep.\n\n"
        "What you call them depends on hair. What they want does not: a job with a point, a person who stays, and enough miles that the old pasture still makes sense."
    ),
    "groenendael": (
        "The Groenendael is the long-haired black Belgian shepherd, named for the Château de Groenendael where Nicholas Rose began breeding the black ones in the 1890s. Under the black coat is the same herding dog as the fawn cousins, not a different species of shadow.\n\n"
        "They still read a flock — or a household — with that intense stare. A Groenendael left without work will herd children and vacuum cleaners. The black jacket is the headline; the job is the plot."
    ),
    "laekenois": (
        "The Laekenois is the rough-haired fawn Belgian shepherd, named for the royal park at Laeken where they once guarded linen drying in the fields. Wiry coat, fawn to red, they look like a shepherd who slept in a hedge and meant it.\n\n"
        "They remain the rarest of the four Belgian coats. The work is still herding and watchfulness. A Laekenois wants weather, a person, and something that needs moving — laundry on a line, or you."
    ),
    "great-anglo-french-tricolour-hound": (
        "The Grand Anglo-Français Tricolore is a pack hound from France, the tricolour result of crossing English Foxhounds with French scenthounds, especially tricoloured Poitevins. Long legs, long ears, a long tail, and a short black-white-and-tan coat made for woodland work, not a city block.\n\n"
        "They still hunt in a chorus because that was how French packs worked. A tricolour left alone in a house is a dog missing its other hounds, not a pet missing a trick."
    ),
    "great-anglo-french-white-and-black-hound": (
        "The Grand Anglo-Français Blanc et Noir wears the white-and-black jacket of French pack hounds crossed with Foxhounds. France kept this one for larger game in cover, a big-boned hound whose color is a map: white ground, black patches, the old Gascon look meeting English bone.\n\n"
        "They were built to run with other hounds, not to amuse a living room. A walk that is only a loop around the block barely counts as a chapter."
    ),
    "great-anglo-french-white-and-orange-hound": (
        "The Grand Anglo-Français Blanc et Orange is the orange-marked Anglo-French hound, the same Foxhound-and-French-scenthound recipe with a coat of white and warm orange instead of black. French packs kept the color as a way to read dogs at a distance in the trees.\n\n"
        "The nose is the instrument. They still want a trail that lasts. House life works when the day includes woods, or at least a long hedgerow and a person willing to wait."
    ),
    "medium-sized-anglo-french-hound": (
        "The Anglo-Français de Petite Vénerie is not a tiny dog — petite vénerie means small game. France used this medium Anglo-French hound on hare and fox, a Foxhound cross that had to turn in tighter country than the grands.\n\n"
        "The name fools people. The dog does not. They still hunt as a pack animal with a serious nose, and a day without a scent is a day they will write themselves, usually along the fence."
    ),
    "alaskan-malamute": (
        "The Mahlemut Inuit of Alaska kept these heavy-coated dogs as freight partners, not sprint racers. Malamutes share a northern silhouette with huskies and Greenland dogs, but they were built to haul, not to fly light over ice for fun.\n\n"
        "The difference still shows: a Malamute wants miles with a load, even if the load is a backpack. An empty afternoon is when the fence starts looking optional."
    ),
    "german-spitz": (
        "German Spitz is the family name for a whole ladder of sizes, from the Wolfsspitz or Keeshond down through Giant, Medium, and Miniature to the Pomeranian. Same prick ears, same plume tail, same weatherproof coat — Germany treated them as one type scaled up or down.\n\n"
        "What changes is the height, not the opinion. A German Spitz of any size will narrate the street. They were watchdogs and barge dogs long before they were sofa ornaments."
    ),
    "german-spitz-mittel": (
        "The Mittelspitz is the middle rung of the German Spitz ladder, bigger than a Pomeranian and smaller than the Giant. German farms and towns kept this size as an all-purpose alarm with a stand-off coat that snow does not easily soak.\n\n"
        "They still stand square and talk. A Mittelspitz wants a person in the house and a window on the world. Too little to haul a sled, too much dog to ignore."
    ),
    "kleinspitz": (
        "The Kleinspitz is the miniature German Spitz, one step above the Pomeranian on the same German size chart. Same fox face and curled tail, less cloud of coat than a show Pom, more farm-watch than handbag.\n\n"
        "They still take the doorbell personally. Compact, sharp, and weatherproof. A Kleinspitz is a northern watchdog that happens to fit on a chair, not a toy that happens to bark."
    ),
    "fila-brasileiro": (
        "The Fila Brasileiro is a Brazilian tracking and cattle dog, a heavy-headed molosser used to hold game and to move herds across rough country. The name fila points to the catch, the moment the dog holds on.\n\n"
        "They remain a serious household guardian, loyal at home and reserved with strangers. This is not a park socialite. They want a person, a property line, and work that uses the nose and the bulk together."
    ),
    "anatolian-shepherd": (
        "In the United States, Anatolian Shepherd became the catch-all name for big Turkish livestock guardians imported as a type, not as one village dog. Ranchers wanted a dog that would live with sheep and face coyotes, a working import rather than a show Kangal from Sivas.\n\n"
        "They still think in pasture distances. Independent, pale or fawn, often masked, they are happiest with a flock or a fence line and a person who does not expect a golden retriever in a giant coat."
    ),
    "kangal-shepherd-dog": (
        "The Kangal is the livestock guardian of Kangal district in Sivas, a pale fawn or wolf-grey dog with a black mask that Turkish shepherds still trust with sheep. The name is a place, not a marketing word.\n\n"
        "Some have been sent to Namibia and East Africa, where they sleep with flocks and keep cheetahs off livestock so ranchers do not shoot the cats. At home they want space, a job, and a household they have already decided belongs to them."
    ),
    "ecuadorian-hairless-dog": (
        "On Ecuador’s coast the Perro Sin Pelo, or Calato, is a local hairless dog kept for hot weather, a cousin of other Andean hairless types rather than a Chinese Crested in disguise. Short, warm-skinned, sometimes with a tuft on the head, they were a household dog of the lowlands.\n\n"
        "They remain rare outside Ecuador. What they still offer is a tropical companion that does not carry a winter coat into a Guayaquil afternoon, and a skin that needs shade, not a sweater."
    ),
    "hairless-dog": (
        "Hairless dogs are not one breed. The Xoloitzcuintli, Peruvian Inca Orchid, Chinese Crested, and several South American pelón types all wear the same trick: little or no coat, often a tuft on the skull or feet, a body built for heat.\n\n"
        "Two genetic roads get there — a dominant mutation and a recessive one — which is why hairless dogs turned up in more than one valley without a single kennel club inventing them. They still want sun with a shady exit, and a person who will oil the skin instead of brushing a ruff."
    ),
    "greek-shepherd": (
        "The Hellenikos Poimenikos, the Greek Shepherd, is a mountain livestock guardian that still walks with transhumant flocks. Shepherds in Greece never needed a herding nipper; they needed a dog that would sleep with the sheep and argue with wolves.\n\n"
        "Neighbors across the Balkans keep similar dogs, and a flock that crosses a border in spring may take its guardians with it. What stays Greek is the work: weather, night watches, and a dog that does not clock out at the farmhouse door."
    ),
    "molossus-of-epirus": (
        "The Molossus of Epirus is the heavy guardian of northwest Greece, named for the Molossian dogs classical writers already treated as a type. Epirote shepherds kept a big-boned flock dog for the same mountains, not a show mastiff from a Roman mosaic.\n\n"
        "They still live with livestock first. A Molossus wants a hillside, a flock, and a person who understands that this is a night dog, not a city sidewalk athlete."
    ),
    "celtic-hounds": (
        "Celtic hounds are the hunting dogs of Irish legend and metalwork — the companions of the Fianna and of Cú Chulainn — drawn lean and long-legged on brooches and in manuscripts. They are a motif and a mythic type, not a kennel-club application.\n\n"
        "When people say Celtic hound today they often mean a wolfhound silhouette: coursing by eye, a greyhound’s hunger in a bigger frame. The stories are older than any modern studbook. The assignment was always the chase."
    ),
    "irish-wolfhound": (
        "Captain George Augustus Graham rebuilt the Irish Wolfhound in the nineteenth century from a handful of remaining giant hounds, deerhounds, and other large dogs, because the old wolf-killers of Ireland had nearly vanished with the wolves.\n\n"
        "They are among the tallest dogs on earth, a sighthound that can still run down game, and since 1902 the Irish Guards have marched with one as a mascot. Off the field they are famously gentle. The size is the headline; the quiet indoors is the plot twist."
    ),
    "canadian-eskimo-dog": (
        "Qimmiq — the Canadian Inuit Dog, often still called Canadian Eskimo Dog — hauled sleds and hunted with Inuit families across the Arctic. By the late twentieth century only a few hundred remained as snowmobiles replaced teams.\n\n"
        "They are a freight and hunting partner, not a Siberian racing husky. A qimmiq wants cold miles and a person. Without a sled they will still pull: a backpack, a toboggan, the idea of a trail."
    ),
    "greenland-dog": (
        "The Greenland Dog came east with the Thule people and is still a working sled dog on the ice. In much of Greenland it is illegal to import other dogs, and teams are chipped and registered so the line stays a sled dog, not a pet mix.\n\n"
        "They remain culturally protected as much as bred. This is a howling freight animal that eats work. A backyard in a temperate city is a mismatch for a dog whose job is still the sledge."
    ),
    "chien-fran-ais-blanc-et-noir": (
        "The Chien Français Blanc et Noir is the black-and-white pack hound of France, a descendant of Saintonge and Gascon scenthounds kept for woodland hunting. Pale tan dots over the eyes and a black mantle are how you read them in cover.\n\n"
        "They still hunt as a chorus. Tan on the cheeks and a mark on the thigh — the so-called roe-buck mark — are old pack details, not fashion. A house without a trail is a quiet they will try to fill with voice."
    ),
    "fran-ais-blanc-et-orange": (
        "The Français Blanc et Orange is the rarest of the three French pack hounds, white with orange patches that must not read as red. Same scenthound job as the black-and-white cousin, different jacket so huntsmen could tell dogs apart in the trees.\n\n"
        "Orange skin under orange hair, white under white: the dog is colored through, not painted. They still want a pack and a line of scent. Rarity is not a personality; the nose is."
    ),
    "gascon-saintongeois": (
        "Baron Joseph de Carayon-Latour rebuilt this hound in the nineteenth century when the old Saintonge dogs were nearly gone, crossing what remained with Bleu de Gascogne blood. The result is a large French pack hound with Gascon voice and Saintonge bone.\n\n"
        "There is a grand size for deer and a smaller one for hare. Either way they hunt by nose in a group. France kept them as working hounds, not as spotted living-room statues."
    ),
    "french-tricolour-hound": (
        "The Chien Français Tricolore is the commonest of the three Français hounds: a wide black mantle, bright tan, white legs, sometimes a grizzle the French call louvard. Pack hunters used the tricolour because it reads in winter woods.\n\n"
        "They were never a solo pet hound. The work is still a day’s scent with other dogs. A tricolour left to invent a trail along the fence will do so, loudly."
    ),
    "catalan-sheepdog": (
        "The Gos d’Atura Català comes from the Pyrenean foothills of Catalonia, a long-haired herding dog that moved sheep and horses through steep country. Shepherds nearly lost them in the twentieth century; clubs in Catalonia and later in northern Europe pulled the type back.\n\n"
        "Two coat lengths still show up. What does not change is the job: gather, hold, and watch. A Catalan Sheepdog wants weather and a person who will walk, not a life that is only a park loop."
    ),
    "german-shorthaired-pointer": (
        "Nineteenth-century German hunters wanted one dog for field, forest, and water, and the Kurzhaar is what they got: a liver or liver-ticked shorthair with webbed feet and a nose for birds. Spanish pointers, English pointers, and local hounds all sit somewhere in the mix.\n\n"
        "They still switch gears in a day — point, retrieve, swim. A GSP without work will invent it, usually involving the garden hose or a tennis ball that never quite dies."
    ),
    "lupo-italiano": (
        "Mario Messi began the Lupo Italiano in 1966, claiming a German Shepherd crossed with an Italian wolf; later genetic work has been less romantic about the wolf. The dogs are not sold on the open market. A caregivers’ association leases them to volunteers, police, and rescue teams.\n\n"
        "What they still do is work: search, patrol, a job with a handler. This is a closed program, not a designer pet. Speed and stamina were the pitch; the lease is the plot."
    ),
    "miniature-american-shepherd": (
        "California horse people scaled the Australian Shepherd down in the late twentieth century and the AKC later registered the result as the Miniature American Shepherd. Same merle options and herding brain, a size that fits a trailer and an arena.\n\n"
        "They still work stock and then go win agility. A Mini American is not a toy Aussie. They want a job with a point — cattle, a course, a person who trains — and they will invent one from the barn aisle if you do not offer it."
    ),
    "miniature-australian-shepherd": (
        "Before the AKC name, small Aussies were already a ranch and horse-show dog, often called Miniature Australian Shepherds by the clubs that kept them. Same origin story as the larger Aussie: American West, Basque shepherds, a compact herding partner.\n\n"
        "The difference is the tape measure, not the homework. They still gather, stare, and bounce. A mini Aussie left idle will herd children and wheelbarrows. The small frame is a convenience. The brain is still ranch-sized."
    ),
    "basque-shepherd-dog": (
        "The Euskal Artzain Txakurra is the herding dog of the Basque Country, still used on Latxa sheep. Two coats walk the same hills: the long-haired Iletsua and the shorter Gorbeiakoa of the Gorbea uplands.\n\n"
        "They move flock with a serious stare, not a circus trick. A Basque shepherd dog wants weather, a slope, and a person. Spain is a map label; the Basque farm is the actual address."
    ),
    "gordon-setter": (
        "The 4th Duke of Gordon’s kennels in Scotland fixed the black-and-tan setter that still carries his name, a heavier, more methodical bird dog than the flashy Irish red. They were built to quarter heather for grouse that sit tight rather than flush at the first footfall.\n\n"
        "The work is still a point: find the bird, freeze, wait for the gun. A Gordon in a house without fields will still hunt the garden. Black coat, tan points, a nose that treats a walk as a search pattern."
    ),
    "irish-red-and-white-setter": (
        "Red-and-white was the older Irish setter color; solid red became the fashion and almost erased this dog. Twentieth-century field trial people in Ireland pulled the parti-colored setter back as a working gundog, not a mahogany show piece.\n\n"
        "They still hunt like the other setters — grouse, snipe, anything that hides — and they are more often found on a beat than on a sofa. The white patches are the old Irish look. The job is the reason they survived."
    ),
    "german-longhaired-pointer": (
        "The Deutsch Langhaar is the long-coated German versatile gun dog, brown and white with feathering that takes mud seriously. When German clubs would not accept the white-headed dogs, those split off as the Large Münsterländer; the Langhaar kept the darker heads.\n\n"
        "They still hunt field and water under a silkier jacket than the Kurzhaar. Germany wanted one dog that could do the whole day. A Longhair without a retrieve will invent a pond."
    ),
    "german-wirehaired-pointer": (
        "The Deutsch Drahthaar was purpose-bred as Germany’s harsh-coated all-purpose hunter: beard, eyebrows, a broken jacket that thorns do not easily own. Field, forest, and water in one dog, more common in American duck blinds than the longhair ever became.\n\n"
        "The wire is workwear. They still point, track wounded game, and swim. A Drahthaar wants weather and a bird. Without them, the backyard becomes a grouse moor of their own invention."
    ),
    "akbash": (
        "Akbash means white head in Turkish, the name shepherds used to tell this western Anatolian guardian from the black-headed Karabaş dogs. A white flock dog is harder for a wolf to pick out among sheep, which is the whole camouflage.\n\n"
        "They still live with livestock, independent and serious. Turkey is full of shepherd dogs; this one is the pale one. A yard without animals is a job they will try to assign to the family."
    ),
    "azores-cattle-dog": (
        "The Cão de Fila de São Miguel is the cattle dog of the Azores, a stocky, often brindle drover that moved cows by grip and noise on volcanic pasture. Fila here means the catch, the hold on a stubborn animal.\n\n"
        "They remain an island working dog first. Visitors meet a muscular herder with a cropped look in older photos and a serious opinion about livestock. A quiet apartment is not São Miguel."
    ),
    "barbado-da-terceira": (
        "The Barbado da Terceira is a herding and farm guardian from Terceira in the Azores, named for that island and for a beard — barbado — that makes a wet cow-dog look like it slept in a hedge.\n\n"
        "They still work cattle on lava pasture and watch a farmyard. An Atlantic island dog wants weather and a job. A crate in a city hallway is not Terceira."
    ),
    "dogo-sardesco": (
        "The Dogo Sardesco is a Sardinian catch dog, a muscular guardian and hunter kept on the island for property and for wild boar. Sardinian farmers wanted a hard dog for rough scrub, not an Italian show mastiff.\n\n"
        "They remain uncommon off the island. What they still do is hold a perimeter. This is a serious working molosser, not a parade breed waiting on papers."
    ),
    "hamiltonst-vare": (
        "The Hamiltonstövare is Sweden’s tricolour scent hound, put together in the late nineteenth century by Adolf Patrick Hamilton, who later helped found the Swedish Kennel Club. English Foxhounds, Harriers, and German hounds went into the mix so Swedish hunters could follow fox and hare through forest.\n\n"
        "They still hunt by nose, a white-black-and-tan dog that works as a solitary trailer more often than as a huge pack. A Hamilton without a scent will write one along the ditch."
    ),
    "great-gascony-blue": (
        "The Grand Bleu de Gascogne is an old Gascon pack hound, slate-mottled and long-eared, the dog other French hounds borrowed from when they needed a voice that carried through woods. Hunters kept them for wolf and then for hare and deer as the big game thinned.\n\n"
        "They still hunt in a chorus. The blue ticking is not decoration; it is how you pick a Gascon out of a thicket. A Grand Bleu wants miles of scent, not a silent suburban hour."
    ),
    "neapolitan-mastiff": (
        "The Mastino Napoletano is the heavy guardian of southern Italy, a wrinkled molosser related to the Cane Corso but built to hold a gate rather than to course. After World War II, Italian fanciers gathered remaining farm mastiffs around Naples and wrote them back into a breed.\n\n"
        "They still move like a slow wall. Loose skin and a serious head were for a dog that met trouble at the door. A Neo wants a household to belong to, and they will occupy as much of the floor as you allow."
    ),
    "cordoba-fighting-dog": (
        "The Córdoba fighting dog was a mastiff mix from Córdoba, Argentina, kept in the late nineteenth and early twentieth centuries for a blood sport that no longer exists. The type was never a family companion; it was a local fighting dog of unknown farm-mastiff ancestry.\n\n"
        "The line died out. What remains is a warning in a name: a city that bred dogs to fight each other until there was nothing left to register."
    ),
    "beauceron": (
        "The Beauceron is the herding dog of the Beauce plains, also called Berger de Beauce or Bas Rouge for the red stockings on a black coat. French shepherds used them on sheep and cattle, a straight-backed worker with a double dewclaw on the hind legs that still marks the breed.\n\n"
        "They remain a serious farm and sport dog. A Beauceron wants a job with a point — livestock, tracking, a long train — and they will herd the household if you leave them unemployed."
    ),
    "cursinu": (
        "The Cursinu is Corsica’s old all-purpose farm dog, used on the island for hunting, herding, and a yard that needed watching. Rough-coated, often brindle or fawn, they were never a French show import; they were the neighbor’s dog that actually worked.\n\n"
        "They still do a bit of everything. A Cursinu wants hills, scent, and a person. Corsica is not a footnote. It is the whole address."
    ),
    "irish-setter": (
        "The solid-red Irish Setter is the mahogany show and field dog that made Ireland’s setter famous, a later fashion than the older red-and-white dogs. They were bred to quarter cover for birds that sit, then freeze on point with that long silk coat flying.\n\n"
        "Friendly to a fault, they still hunt with their whole body. A red setter without a field will hunt the park. The color is the postcard. The nose is the reason."
    ),
    "norfolk-terrier": (
        "The Norfolk Terrier is the drop-eared ratter of East Anglia, the same small working terrier as the Norwich until ears split them into two names. They went to ground after vermin, short-legged and game, a farm pocket dog rather than a parlor toy.\n\n"
        "They still think a rustle in the shed is a job. Smallest of the working terriers along with their prick-eared cousins, a Norfolk wants a person and something to investigate, preferably with teeth."
    ),
    "norwich-terrier": (
        "The Norwich Terrier is the prick-eared ratter from Norwich, bred to hunt rodents in East Anglian stables and later to bolt foxes from cover. They stayed small on purpose: a terrier that could follow into a tight hole and still come out arguing.\n\n"
        "Their drop-eared kin became the Norfolk. A Norwich is still a working attitude in a compact coat. Rare, busy, and sure the household needs a supervisor."
    ),
    "mantiqueira-shepherd": (
        "The Mantiqueira Shepherd is a Brazilian cattle dog from the Serra da Mantiqueira, kept to move herds on steep Atlantic-forest pasture. Ranchers there wanted brains and grit more than a European catalog name.\n\n"
        "Coats come long, medium, or short; the job does not change. They still work stock. A Mantiqueira without cattle will try to organize the yard, because that is what a mountain drover does."
    ),
    "bouvier-des-ardennes": (
        "The Bouvier des Ardennes is the rough cattle dog of the Belgian Ardennes, a rarer, often scruffier cousin of the better-known Flanders bouvier. Farmers used them to drive and guard cattle in hill country that did not flatter a show coat.\n\n"
        "They nearly vanished when draft work faded, then a handful of working dogs were pulled back. An Ardennes bouvier still wants livestock, weather, and a farm that makes noise."
    ),
    "karst-shepherd": (
        "The Kraški ovčar is the livestock guardian of Slovenia’s Karst plateau, an iron-grey mountain dog that slept with sheep on limestone pasture. Shepherds there wanted a night watch, not a herding nipping dog, and the coat color reads like the rock itself.\n\n"
        "They are related to other Balkan guardians but the name is a place: the Karst. A Karst Shepherd still wants a flock or a serious fence line. This is overnight work, not a sidewalk hobby."
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


def fetch_extract(title: str, long: bool) -> str:
    params = {
        "action": "query",
        "format": "json",
        "prop": "extracts",
        "explaintext": "1",
        "redirects": "1",
        "titles": title,
    }
    if long:
        params["exchars"] = "1800"
    else:
        params["exintro"] = "1"
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request(
        "https://en.wikipedia.org/w/api.php?" + q,
        headers={"User-Agent": UA},
    )
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
    s = re.sub(r"\s+", " ", s).strip(" ,;:")
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
        r"recognized by|kennel club|fédération|fci\b|breed standard|may refer to|"
        r"asociación canina|recognised by|national law|disambiguation",
        low,
    ):
        return True
    if re.search(r"also known as .{10,120} among many other names", low):
        return True
    if (s.count('"') + s.count("“") + s.count("”")) >= 4:
        return True
    if re.search(r"dog fighting|dogfight|pit fighting|bull-bait|bear-bait|blood sport|fighting dogs", low):
        return True
    if re.search(
        r"lethal|attacks on humans|legal controls|dangerous dog|banned in|fatal attack",
        low,
    ):
        return True
    if re.search(
        r"the others being|one of fourteen animal|toy dog group|highly dependent on training",
        low,
    ):
        return True
    if re.search(
        r"should ideally|eyes should|according to the breed standard|gold colour",
        low,
    ):
        return True
    if re.search(r"\b(tread is|gait is|in large specimens|croup|withers)\b", low):
        return True
    if s.lstrip().startswith((",", "Association", "a state-funded")):
        return True
    if re.search(r"inappropriate classification|pariah dog", low):
        return True
    if re.search(r"faults are listed|should not be bred|state-funded|cm at the shoulder", low):
        return True
    if re.search(r"slaver|escaped slave", low):
        return True
    if re.search(
        r"may also be kept as a companion|also kept as a companion|"
        r"five distinct varieties|hound of saintonge type|"
        r"original purpose of the breed was to hunt gamebirds|"
        r"closely related to the other german pointer|"
        r"have not yet diverged enough genetically|"
        r"foxi3|ectodermal dysplasia|"
        r"highly intelligent and biddable",
        low,
    ):
        return True
    if re.search(r"bridge of the nose|muzzle is roughly|eyes are oval shaped|well defined stop|skull is broad|almond shaped", low):
        return True
    if re.search(r"generally healthy|inheritable genetic|varied numbers of pups", low):
        return True
    if re.search(r"^they come from [a-z].{0,36}\.$", low) and len(s) < 48:
        return True
    if re.search(r"^the .+ is a dog of .+\.$", low) and len(s) < 56:
        return True
    if re.match(r"^they are an? (?:medium-sized |large |small )?dog breed\.?$", low):
        return True
    if re.match(r"^they are a breed of dog\.?$", low):
        return True
    if re.search(r"a further six are in the process of recognition", low):
        return True
    if re.search(r"no specific health issues", low):
        return True
    if re.search(r"\b\d+\s*[–-]\s*\d+\s*(inches|in\b|pounds|lb|cm|kg)\b", low) and "origin" not in low:
        return True
    if len(s) < 32:
        return True
    return False


def tidy_clause(bit: str) -> str:
    bit = re.sub(r"\s+", " ", bit).strip(" ,;:")
    bit = re.split(
        r"\b(?:and is |and was |and they |while |that originated|that is |that was )\b",
        bit,
        maxsplit=1,
    )[0]
    bit = re.sub(r"\s*\([^)]*\)\s*", " ", bit)
    return re.sub(r"\s+", " ", bit).strip(" ,;:.")


def from_definition(s: str, name: str, origin: str) -> list[str]:
    pieces: list[str] = []
    patterns = [
        (r"originat(?:ed|ing) (?:in|from) (.+)", "They first took shape in {}."),
        (r"native to (.+)", "They come from {}."),
        (r"indigenous to (.+)", "They belong to {}."),
        (r"from (?:the )?(?:département|valley|region|state|town|island|province) of (.+)", "They come from {}."),
        (r"also (?:called|known as) (.+?)(?:[,.]|$)", "People have also called them {}."),
        (
            r"(?:formerly|traditionally|once|historically) (?:kept|used|bred) (as|for|to) (.+)",
            "They once earned their keep {} {}.",
        ),
        (r"used (as|for|to) (.+)", "People kept them {} {}."),
        (r"developed (in|from) (.+)", "They were developed {} {}."),
        (r"named (?:for|after) (.+)", "The name points to {}."),
        (r"descended from (.+)", "They descend from {}."),
    ]
    for pat, tmpl in patterns:
        m = re.search(pat, s, re.I)
        if not m:
            continue
        groups = [tidy_clause(g) for g in m.groups()]
        bit = groups[-1]
        if "breed" in bit.lower() and "standard" in bit.lower():
            continue
        if 12 < len(bit) < 180:
            filled = tmpl.format(*groups) if len(groups) > 1 else tmpl.format(bit)
            if name.lower() in filled.lower()[: len(name) + 8]:
                continue
            pieces.append(finish(filled))
    return pieces[:3]


def rewrite_fact(s: str, name: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s*\([^)]*\)\s*", " ", s)
    s = re.sub(r"^The breed\b,?\s*", "", s, flags=re.I)
    s = re.sub(r"^'s\b", "Their", s)
    s = re.sub(r"^Or\b", "", s)
    s = re.sub(r"^Is a ", "They are a ", s)
    s = re.sub(r"^Name may\b", "The name may", s)
    s = re.sub(r"\bIt come from\b", "They come from", s)
    s = re.sub(r"\bis Portuguese breed\b", "is a Portuguese breed", s)
    s = re.sub(r"\bis Spanish breed\b", "is a Spanish breed", s)
    s = re.sub(r"\bis French breed\b", "is a French breed", s)
    s = re.sub(r"\bis Italian breed\b", "is an Italian breed", s)
    s = re.sub(r"\bis Swiss breed\b", "is a Swiss breed", s)
    if re.match(r"^Name derives\b", s):
        s = "The name derives" + s[4:]
    if re.match(r"^(used|kept|bred|named|developed|raised|found)\b", s, re.I):
        s = "They were " + s[0].lower() + s[1:]
    elif re.match(r"^(come|comes|originated)\b", s, re.I):
        s = "They " + s[0].lower() + s[1:]
    s = re.sub(r"^They used for\b", "They were used for", s, flags=re.I)
    s = re.sub(r"^It come from\b", "They come from", s, flags=re.I)
    verb = re.match(r"^(is|are|was|were|has|have)\b(.*)$", s, re.I)
    if verb:
        mapped = {
            "is": "are",
            "are": "are",
            "was": "were",
            "were": "were",
            "has": "have",
            "have": "have",
        }[verb.group(1).lower()]
        s = "They " + mapped + verb.group(2)
    if re.match(r"^It is (unknown|possible|said|believed|thought|unclear)\b", s, re.I):
        return finish(s)
    if re.match(r"^It (is|was|has|originated)\b", s):
        s = re.sub(
            r"^It (is|was|has|originated)\b",
            lambda m: {
                "is": "They are",
                "was": "They were",
                "has": "They have",
                "originated": "They originated",
            }[m.group(1).lower()],
            s,
        )
    s = re.sub(r"\bare indigenous to\b", "come from", s, flags=re.I)
    s = re.sub(r"\bIt originates in\b", "They come from", s)
    s = re.sub(r"\boriginates in\b", "comes from", s, flags=re.I)
    s = re.sub(r"\bit is commonly kept\b", "they are commonly kept", s, flags=re.I)
    s = re.sub(r"^It possesses\b", "They have", s)
    s = re.sub(r"\bespecially to\b", "especially", s)
    s = re.sub(r"\bbecause it is\b", "because they are", s, flags=re.I)
    if s.lower().startswith("they ") and " and is " in s:
        s = s.replace(" and is ", " and are ")
    if s.lower().startswith("they ") and " and was " in s:
        s = s.replace(" and was ", " and were ")
    return finish(s)


def is_definition(s: str) -> bool:
    return bool(
        re.search(
            r"\b(?:is|are|was|were)\s+an?\s+(?:[A-Za-z][A-Za-z,-]+\s+){0,10}"
            r"(?:breed|dog|landrace|type|variety|hound|terrier|spaniel|mastiff)\b",
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


def fact_key(s: str) -> str:
    return re.sub(r"[^a-z]+", "", s.lower())[:90]


def collect_facts(extract: str, name: str, origin: str) -> list[str]:
    extract = re.sub(r"==+[^=]+==+", " ", extract)
    extract = re.sub(r"\s+", " ", extract).strip()
    out: list[str] = []
    seen: set[str] = set()
    for raw in split_sents(extract):
        raw = re.sub(r"\s*\([^)]*\)\s*", " ", raw)
        raw = re.sub(r"\s+", " ", raw).strip()
        if re.match(r"^(Description|History|See also|References)\b", raw, re.I):
            continue
        if boring(raw):
            continue
        candidates = [rewrite_fact(raw, name)]
        for fact in candidates:
            if not fact or boring(fact):
                continue
            key = fact_key(fact)
            if key in seen:
                continue
            seen.add(key)
            out.append(fact)
        if len(out) >= 10:
            break
    return out


def name_lead(name: str, origin: str, salt: int) -> str:
    place = place_name(origin)
    leads = [
        f"The {name} comes from {place}.",
        f"The {name} is a dog of {place}.",
        f"{place} is home ground for the {name}.",
    ]
    return leads[salt % len(leads)]


def restyle(fact: str, name: str, salt: int) -> str:
    """Swap They → the breed name with real verb agreement, not every time."""
    if salt % 3 == 0 or not fact.startswith("They "):
        return fact
    rest = fact[5:]
    swaps = [
        (r"^are\b", "is"),
        (r"^were\b", "was"),
        (r"^have\b", "has"),
        (r"^come\b", "comes"),
        (r"^belong\b", "belongs"),
        (r"^descend\b", "descends"),
        (r"^first took\b", "first took"),
        (r"^once earned\b", "once earned"),
        (r"^originated\b", "originated"),
    ]
    for pat, verb in swaps:
        if re.match(pat, rest):
            rest = re.sub(pat, verb, rest, count=1)
            return finish(f"The {name} {rest}")
    return fact


def polish(story: str) -> str:
    paras = [re.sub(r"\s+", " ", p).strip() for p in story.split("\n\n")]
    story = "\n\n".join(p for p in paras if p)
    story = re.sub(r"\bIt come from\b", "They come from", story)
    story = re.sub(r"\bName may be\b", "The name may be", story)
    return story.strip()


def two_paragraphs(
    name: str, origin: str, extract: str, breed_id: str, used: set[str]
) -> str:
    if breed_id in HAND_STORIES:
        story = polish(HAND_STORIES[breed_id])
        used.update(ngrams(story))
        return story

    def unused(text: str) -> bool:
        return used.isdisjoint(ngrams(text))

    facts = [f for f in collect_facts(extract, name, origin) if unused(f)]
    if len(facts) < 2:
        for extra in salvage_facts(extract, name):
            if unused(extra) and fact_key(extra) not in {fact_key(f) for f in facts}:
                facts.append(extra)
            if len(facts) >= 4:
                break

    salt = sum(map(ord, breed_id))
    styled = [restyle(f, name, salt + i * 17) for i, f in enumerate(facts)]
    unique: list[str] = []
    seen_starts: set[str] = set()
    for s in styled:
        if not unused(s):
            continue
        start = " ".join(s.split()[:8]).lower()
        if start in seen_starts:
            continue
        seen_starts.add(start)
        unique.append(s)

    if not unique:
        story = polish(salvage_story(name, origin, extract))
        used.update(ngrams(story))
        return story

    mode = salt % 4
    if len(unique) == 1:
        p1, p2 = unique[0], ""
    elif len(unique) == 2:
        p1, p2 = unique[0], unique[1]
    elif len(unique) == 3:
        layouts = [
            (unique[0], " ".join(unique[1:])),
            (" ".join(unique[:2]), unique[2]),
        ]
        p1, p2 = layouts[mode % 2]
    else:
        layouts = [
            (" ".join(unique[:2]), " ".join(unique[2:4])),
            (unique[0], " ".join(unique[1:4])),
            (" ".join(unique[:3]), unique[3]),
        ]
        p1, p2 = layouts[mode % 3]

    p1 = re.sub(r"\s+", " ", p1).strip()
    p2 = re.sub(r"\s+", " ", p2).strip()
    if len(p2) < 40 and len(unique) > 1:
        leftover = [s for s in unique if s not in p1]
        p2 = leftover[0] if leftover else p2
    story = polish(f"{p1}\n\n{p2}" if p2 else p1)
    used.update(ngrams(story))
    return story


def salvage_facts(extract: str, name: str) -> list[str]:
    extract = re.sub(r"==+[^=]+==+", " ", extract)
    out: list[str] = []
    for raw in split_sents(extract):
        raw = re.sub(r"\s*\([^)]*\)\s*", " ", raw)
        raw = re.sub(r"\s+", " ", raw).strip()
        if re.search(
            r"kennel club|fédération|breed standard|faults are listed|dog fighting",
            raw,
            re.I,
        ):
            continue
        fact = rewrite_fact(raw, name)
        if len(fact) >= 40 and not boring(fact):
            out.append(fact)
        if len(out) >= 6:
            break
    return out


def salvage_story(name: str, origin: str, extract: str) -> str:
    bits = salvage_facts(extract, name)
    if len(bits) >= 2:
        return f"{bits[0]}\n\n{bits[1]}"
    if bits:
        return bits[0]
    place = place_name(origin)
    return finish(
        f"The {name} is still a local dog of {place}, with little written down besides the work they were kept to do"
    )


def ngrams(text: str, n: int = 8) -> list[str]:
    words = re.findall(r"[a-z']+", text.lower())
    return [" ".join(words[i : i + n]) for i in range(len(words) - n + 1)]


def main() -> None:
    limit = 0
    for arg in sys.argv[1:]:
        if arg.startswith("--limit="):
            limit = int(arg.split("=", 1)[1])

    extra = json.loads(EXTRA.read_text())
    cache = load_cache()
    rows = extra[:limit] if limit else extra

    used: set[str] = set()
    for i, row in enumerate(rows, 1):
        title = wiki_title(row.get("sourceUrl") or "")
        extract = cache.get(title, "")
        if title and (len(extract) < 280):
            fresh = fetch_extract(title, long=True) if title else ""
            if len(fresh) > len(extract):
                extract = fresh
                cache[title] = extract
            elif title not in cache:
                cache[title] = extract or fetch_extract(title, long=False)
                extract = cache[title]
            time.sleep(0.04)
        elif title and title not in cache:
            extract = fetch_extract(title, long=True)
            cache[title] = extract
            time.sleep(0.04)
        row["story"] = two_paragraphs(
            row["name"],
            row.get("origin") or "",
            extract,
            row["id"],
            used,
        )
        if i % 25 == 0:
            print(f"  {i}/{len(rows)}")
            save_cache(cache)

    save_cache(cache)
    if limit:
        extra[:limit] = rows
        EXTRA.write_text(json.dumps(extra, indent=2, ensure_ascii=False) + "\n")
    else:
        EXTRA.write_text(json.dumps(extra, indent=2, ensure_ascii=False) + "\n")

    grams: dict[str, int] = {}
    for row in extra if not limit else rows:
        for g in ngrams(row["story"]):
            grams[g] = grams.get(g, 0) + 1
    repeats = [(c, g) for g, c in grams.items() if c >= 3]
    repeats.sort(reverse=True)
    print("wrote", len(rows), "extra stories")
    print("8-grams used 3+ times:", len(repeats))
    for c, g in repeats[:12]:
        print(f"  {c}  {g}")


if __name__ == "__main__":
    main()
