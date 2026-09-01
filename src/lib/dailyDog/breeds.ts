export type DailyBreed = {
  id: string;
  name: string;
  origin: string;
  height: string;
  weight: string;
  image: string;
  facts: string[];
};

export const DAILY_BREEDS: DailyBreed[] = [
  {
    id: "golden-retriever",
    name: "Golden Retriever",
    origin: "Scotland",
    height: "21–24 in",
    weight: "55–75 lb",
    image: "/breeds/golden-retriever.jpg",
    facts: [
      "Bred in the 1800s to retrieve waterfowl without damaging the bird.",
      "Their water-repellent double coat dries surprisingly fast after a swim.",
      "One of the most common breeds trained as guide and therapy dogs.",
    ],
  },
  {
    id: "shiba-inu",
    name: "Shiba Inu",
    origin: "Japan",
    height: "13–17 in",
    weight: "17–23 lb",
    image: "/breeds/shiba-inu.jpg",
    facts: [
      "One of Japan’s oldest native breeds, once used to hunt small game in the mountains.",
      "The famous “Shiba scream” is a high-pitched protest when they are unhappy.",
      "They cat-lick themselves clean and often act aloof with strangers.",
    ],
  },
  {
    id: "pug",
    name: "Pug",
    origin: "China",
    height: "10–13 in",
    weight: "14–18 lb",
    image: "/breeds/pug.jpg",
    facts: [
      "Imperial Chinese courts kept pugs as companions for centuries.",
      "Their facial wrinkles were prized; the forehead wrinkle is sometimes called a prince mark.",
      "Pugs are brachycephalic — those short snouts mean they overheat easily.",
    ],
  },
  {
    id: "beagle",
    name: "Beagle",
    origin: "England",
    height: "13–15 in",
    weight: "20–30 lb",
    image: "/breeds/beagle.jpg",
    facts: [
      "Beagles hunt by scent and can follow a trail that is days old.",
      "Their howl is called a bay — packs used it to stay in touch in the field.",
      "Snoopy is a beagle, which helped make the breed a household name.",
    ],
  },
  {
    id: "poodle",
    name: "Poodle",
    origin: "Germany / France",
    height: "10–15 in (mini) · 15+ in (standard)",
    weight: "10–70 lb depending on size",
    image: "/breeds/poodle.jpg",
    facts: [
      "The fancy clip started as a working cut: hair left on joints to keep water retrievers warm.",
      "Poodles are among the most trainable breeds and often dominate dog sports.",
      "A low-shedding coat makes them a frequent pick for allergy-conscious homes.",
    ],
  },
  {
    id: "pomeranian",
    name: "Pomeranian",
    origin: "Pomerania (Germany / Poland)",
    height: "6–7 in",
    weight: "3–7 lb",
    image: "/breeds/pomeranian.jpg",
    facts: [
      "Queen Victoria’s tiny Pom helped shrink the breed from a 30-pound sled-dog cousin.",
      "That fox-like face sits on a double coat that puffs into a round “ruff.”",
      "They are vocal watchdogs and will announce visitors at full volume.",
    ],
  },
  {
    id: "siberian-husky",
    name: "Siberian Husky",
    origin: "Siberia",
    height: "20–24 in",
    weight: "35–60 lb",
    image: "/breeds/siberian-husky.jpg",
    facts: [
      "The Chukchi people bred them to pull light loads over long frozen distances.",
      "Many have striking ice-blue eyes, or one blue and one brown.",
      "Huskies “talk” more than they bark — lots of howls and woo-woos.",
    ],
  },
  {
    id: "pembroke-welsh-corgi",
    name: "Pembroke Welsh Corgi",
    origin: "Wales",
    height: "10–12 in",
    weight: "22–30 lb",
    image: "/breeds/pembroke-welsh-corgi.jpg",
    facts: [
      "Bred to nip at cattle heels; those short legs kept them under kicking range.",
      "Queen Elizabeth II kept more than 30 Pembrokes during her reign.",
      "Welsh folklore says they were gifts from woodland fairies.",
    ],
  },
  {
    id: "dalmatian",
    name: "Dalmatian",
    origin: "Croatia (Dalmatia)",
    height: "19–24 in",
    weight: "45–70 lb",
    image: "/breeds/dalmatian.jpg",
    facts: [
      "Puppies are born pure white; spots fill in during the first weeks of life.",
      "They ran beside horse-drawn fire coaches and became firehouse mascots.",
      "Each coat’s spot pattern is as unique as a fingerprint.",
    ],
  },
  {
    id: "greyhound",
    name: "Greyhound",
    origin: "England / Middle East",
    height: "27–30 in",
    weight: "60–70 lb",
    image: "/breeds/greyhound.jpg",
    facts: [
      "They can sprint over 40 mph, among the fastest of all land mammals.",
      "Off the track they are famous couch potatoes who love long naps.",
      "A deep chest and flexible spine work like a spring with every stride.",
    ],
  },
  {
    id: "basenji",
    name: "Basenji",
    origin: "Central Africa",
    height: "16–17 in",
    weight: "22–24 lb",
    image: "/breeds/basenji.jpg",
    facts: [
      "Often called the barkless dog — they yodel thanks to an unusually shaped larynx.",
      "They groom like cats and have almost no doggy odor.",
      "Ancient Egyptian art shows dogs that look a lot like today’s Basenji.",
    ],
  },
  {
    id: "border-collie",
    name: "Border Collie",
    origin: "England / Scotland border",
    height: "18–22 in",
    weight: "30–55 lb",
    image: "/breeds/border-collie.jpg",
    facts: [
      "Widely considered the world’s top sheepdog, using an intense “eye” to move flocks.",
      "Chaser the Border Collie learned more than 1,000 object names in a lab study.",
      "They need a job — puzzle toys and herding beat a quiet apartment.",
    ],
  },
  {
    id: "german-shepherd",
    name: "German Shepherd",
    origin: "Germany",
    height: "22–26 in",
    weight: "50–90 lb",
    image: "/breeds/german-shepherd.jpg",
    facts: [
      "Captain Max von Stephanitz standardized the breed as a versatile working dog.",
      "Rin Tin Tin, a WWI rescue, made German Shepherds Hollywood stars.",
      "They still lead police, military, and search-and-rescue work worldwide.",
    ],
  },
  {
    id: "labrador-retriever",
    name: "Labrador Retriever",
    origin: "Newfoundland (Canada)",
    height: "21–25 in",
    weight: "55–80 lb",
    image: "/breeds/labrador-retriever.jpg",
    facts: [
      "Fishermen used them to haul nets and retrieve fish that slipped the hook.",
      "An otter-like tail acts as a rudder when they swim.",
      "They have been America’s most registered breed for decades.",
    ],
  },
  {
    id: "french-bulldog",
    name: "French Bulldog",
    origin: "France / England",
    height: "11–13 in",
    weight: "16–28 lb",
    image: "/breeds/french-bulldog.jpg",
    facts: [
      "Bat ears are a breed signature — they should stand up on their own.",
      "Lace makers who moved from England to France brought the early toy bulldogs with them.",
      "Most Frenchies cannot swim well because of that compact, front-heavy build.",
    ],
  },
  {
    id: "dachshund",
    name: "Dachshund",
    origin: "Germany",
    height: "5–9 in",
    weight: "11–32 lb",
    image: "/breeds/dachshund.jpg",
    facts: [
      "The name means “badger dog” — they were bred to go down burrows after prey.",
      "That long back is powerful, but jumping off couches is risky for their spines.",
      "They come in smooth, longhaired, and wirehaired coats.",
    ],
  },
  {
    id: "australian-shepherd",
    name: "Australian Shepherd",
    origin: "United States",
    height: "18–23 in",
    weight: "40–65 lb",
    image: "/breeds/australian-shepherd.jpg",
    facts: [
      "Despite the name, the modern Aussie was developed on American ranches.",
      "Many are born with naturally bobbed tails.",
      "Merle coats and bright eyes are common, including odd-eyed dogs.",
    ],
  },
  {
    id: "boxer",
    name: "Boxer",
    origin: "Germany",
    height: "21–25 in",
    weight: "50–80 lb",
    image: "/breeds/boxer.jpg",
    facts: [
      "The name may come from the way they paw and “box” with their front legs when playing.",
      "They were among the first breeds used as military and police dogs in Germany.",
      "A wrinkled forehead and undershot jaw give them an almost human expression.",
    ],
  },
  {
    id: "chihuahua",
    name: "Chihuahua",
    origin: "Mexico",
    height: "5–8 in",
    weight: "under 6 lb",
    image: "/breeds/chihuahua.jpg",
    facts: [
      "Named for the Mexican state of Chihuahua, where they were popularized in the 1800s.",
      "They are the smallest recognized breed, but many have oversized watchdog energy.",
      "The apple-head skull is a breed hallmark; some are born with a molera (soft spot).",
    ],
  },
  {
    id: "great-dane",
    name: "Great Dane",
    origin: "Germany",
    height: "28–32 in",
    weight: "110–175 lb",
    image: "/breeds/great-dane.jpg",
    facts: [
      "Among the tallest breeds — some Danes stand over 3 feet at the shoulder.",
      "They were used to hunt wild boar, then became estate guardians.",
      "Scooby-Doo is a Great Dane, which did wonders for the breed’s fame.",
    ],
  },
  {
    id: "rottweiler",
    name: "Rottweiler",
    origin: "Germany",
    height: "22–27 in",
    weight: "80–135 lb",
    image: "/breeds/rottweiler.jpg",
    facts: [
      "Descended from Roman drover dogs that marched with the legions.",
      "Butchers in Rottweil used them to pull carts and guard the day’s cash.",
      "A calm, confident temperament is the breed standard — not constant barking.",
    ],
  },
  {
    id: "yorkshire-terrier",
    name: "Yorkshire Terrier",
    origin: "England",
    height: "7–8 in",
    weight: "under 7 lb",
    image: "/breeds/yorkshire-terrier.jpg",
    facts: [
      "Bred in mill towns to catch rats, then became a Victorian fashion companion.",
      "The floor-length coat is hair, not fur, and is often wrapped to keep it growing.",
      "Puppies are born black and tan; the famous steel-blue color comes in later.",
    ],
  },
  {
    id: "boston-terrier",
    name: "Boston Terrier",
    origin: "United States",
    height: "15–17 in",
    weight: "12–25 lb",
    image: "/breeds/boston-terrier.jpg",
    facts: [
      "One of the first American-born breeds, nicknamed the American Gentleman.",
      "Tuxedo markings — white blaze, chest, and socks — are part of the look.",
      "They snore, snort, and snuffle thanks to a short muzzle.",
    ],
  },
  {
    id: "akita",
    name: "Akita",
    origin: "Japan",
    height: "24–28 in",
    weight: "70–130 lb",
    image: "/breeds/akita.jpg",
    facts: [
      "Hachikō, an Akita, waited at a Tokyo station for his owner every day for years.",
      "They were once reserved for Japanese nobility and used to hunt large game.",
      "A thick double coat and curled tail are classic northern-spitz features.",
    ],
  },
  {
    id: "samoyed",
    name: "Samoyed",
    origin: "Siberia",
    height: "19–24 in",
    weight: "35–65 lb",
    image: "/breeds/samoyed.jpg",
    facts: [
      "The Samoyede people used them to herd reindeer, pull sleds, and sleep as living heaters.",
      "The “Sammy smile” is an upturned mouth that keeps drool from turning to ice.",
      "Their white coat is so dense that shed fur is sometimes spun into yarn.",
    ],
  },
  {
    id: "bernese-mountain-dog",
    name: "Bernese Mountain Dog",
    origin: "Switzerland",
    height: "23–28 in",
    weight: "70–115 lb",
    image: "/breeds/bernese-mountain-dog.jpg",
    facts: [
      "Farm dogs from the canton of Bern, used to draft carts of milk and cheese.",
      "The tri-color coat — black, rust, and white — is a breed requirement.",
      "They are gentle giants who generally prefer cool weather to heat.",
    ],
  },
  {
    id: "newfoundland",
    name: "Newfoundland",
    origin: "Canada",
    height: "26–28 in",
    weight: "100–150 lb",
    image: "/breeds/newfoundland.jpg",
    facts: [
      "Webbed feet and a water-resistant coat make them natural lifeguards.",
      "Nana in Peter Pan was inspired by J.M. Barrie’s Newfoundland, Luath.",
      "They have a huge lung capacity and a calm rescue instinct in the water.",
    ],
  },
  {
    id: "whippet",
    name: "Whippet",
    origin: "England",
    height: "18–22 in",
    weight: "25–40 lb",
    image: "/breeds/whippet.jpg",
    facts: [
      "A sighthound built like a miniature Greyhound, once called the poor man’s racehorse.",
      "They can hit about 35 mph in a short burst, then happily share a blanket.",
      "Thin skin and low body fat mean they get cold easily.",
    ],
  },
  {
    id: "maltese",
    name: "Maltese",
    origin: "Malta / Mediterranean",
    height: "7–9 in",
    weight: "under 7 lb",
    image: "/breeds/maltese.jpg",
    facts: [
      "Writers in ancient Greece and Rome already described small white island dogs.",
      "The floor-length white coat has little to no undercoat, so they shed very little.",
      "They were lapdogs of European nobility for centuries.",
    ],
  },
  {
    id: "saint-bernard",
    name: "Saint Bernard",
    origin: "Switzerland / Italy",
    height: "26–30 in",
    weight: "120–180 lb",
    image: "/breeds/saint-bernard.jpg",
    facts: [
      "Hospice monks in the Alps used them to find lost travelers in the snow.",
      "The famous barrel of brandy is a myth popularized by paintings, not history.",
      "Barry, a 19th-century Saint, is credited with dozens of mountain rescues.",
    ],
  },
  {
    id: "australian-cattle-dog",
    name: "Australian Cattle Dog",
    origin: "Australia",
    height: "17–20 in",
    weight: "30–50 lb",
    image: "/breeds/australian-cattle-dog.jpg",
    facts: [
      "Bred to drive cattle across huge Australian stations by nipping at heels.",
      "Puppies are born white; the blue or red speckle fills in as they grow.",
      "Bluey, an ACD, is often cited as one of the longest-lived dogs on record.",
    ],
  },
  {
    id: "weimaraner",
    name: "Weimaraner",
    origin: "Germany",
    height: "23–27 in",
    weight: "55–90 lb",
    image: "/breeds/weimaraner.jpg",
    facts: [
      "Nicknamed the Grey Ghost for that silver coat and light amber or blue-gray eyes.",
      "Nobles in Weimar kept the breed exclusive for big-game hunting.",
      "Photographer William Wegman made Weimaraners pop-culture icons in the 1980s.",
    ],
  },
];

/** Local calendar date YYYY-MM-DD — one breed per day in the user's timezone. */
export function todayDateKey(now = Date.now()): string {
  return new Date(now).toLocaleDateString("en-CA");
}

function hashDateKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function breedForDay(now = Date.now()): DailyBreed {
  const idx = hashDateKey(todayDateKey(now)) % DAILY_BREEDS.length;
  return DAILY_BREEDS[idx]!;
}
