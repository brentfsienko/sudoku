import extraBreeds from "./extraBreeds.json";

export type BarkKind = "yap" | "woof" | "deep" | "howl";

export type DailyBreed = {
  id: string;
  name: string;
  origin: string;
  height: string;
  weight: string;
  image: string;
  intro: string;
  story: string;
  pronunciation: string;
  lat: number;
  lng: number;
  sourceUrl: string;
  sourceLabel: string;
  bark: BarkKind;
};

export const CORE_BREEDS: DailyBreed[] = [
  {
    id: "golden-retriever",
    name: "Golden Retriever",
    origin: "Scotland",
    height: "21–24 in",
    weight: "55–75 lb",
    image: "/breeds/golden-retriever.jpg",
    pronunciation: "GOLD-en re-TREE-ver",
    lat: 57.5,
    lng: -4.2,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Golden_Retriever",
    sourceLabel: "Wikipedia",
    intro: "Coming all the way from the Scottish Highlands, is the Golden Retriever.",
    story:
      "In the Scottish Highlands of the 1800s, Lord Tweedmouth wanted a dog that could fetch waterfowl from icy lakes without leaving a mark on the bird. At Guisachan he spent decades on a yellow retriever whose water-repellent coat still dries in a hurry after a swim, and whose mouth is gentle enough for a duck \u2014 or a tennis ball.\n\nThat same eager brain later made goldens favorite guide and therapy dogs, the kind that will work a whole afternoon if you give them a job. They still want a person and a purpose more than a quiet kennel, and they will happily carry both your bird and your day if you ask."
  },
  {
    id: "shiba-inu",
    name: "Shiba Inu",
    origin: "Japan",
    height: "13–17 in",
    weight: "17–23 lb",
    image: "/breeds/shiba-inu.jpg",
    pronunciation: "SHEE-bah EE-noo",
    lat: 36.2,
    lng: 138.2,
    bark: "yap",
    sourceUrl: "https://en.wikipedia.org/wiki/Shiba_Inu",
    sourceLabel: "Wikipedia",
    intro: "Hello pups, today’s daily dog is the Shiba Inu.",
    story:
      "High in Japan\u2019s mountains, the Shiba once hunted small game with a bold, catlike independence that never really left the breed. They still lick themselves clean, keep a cool distance from strangers, and wear the name like a map: shiba means brushwood, the terrain they worked.\n\nThey are one of Japan\u2019s oldest native dogs, and they nearly vanished in the twentieth century before fanciers pulled them back. Cross a Shiba and you may hear the famous scream \u2014 a protest as dramatic as it is loud \u2014 because this is a dog that would rather argue than obey for the sake of it."
  },
  {
    id: "pug",
    name: "Pug",
    origin: "China",
    height: "10–13 in",
    weight: "14–18 lb",
    image: "/breeds/pug.jpg",
    pronunciation: "PUG",
    lat: 34.8,
    lng: 113.6,
    bark: "yap",
    sourceUrl: "https://en.wikipedia.org/wiki/Pug",
    sourceLabel: "Wikipedia",
    intro: "And today we have the Pug — tiny, wrinkled, and very sure of itself.",
    story:
      "For centuries, imperial Chinese courts kept pugs as living lap ornaments. Those deep facial folds were a point of pride; a wrinkle on the forehead was even called a prince mark, as if the dog had been stamped for palace life.\n\nDutch traders carried them west, and European parlors soon learned the snorts, sneezes, and single-minded quest for a lap. The trade-off is a short snout that makes hot days hard work. A pug would rather share a sofa than a long run in the sun, and it will remind you of that with every snuffling sigh."
  },
  {
    id: "beagle",
    name: "Beagle",
    origin: "England",
    height: "13–15 in",
    weight: "20–30 lb",
    image: "/breeds/beagle.jpg",
    pronunciation: "BEE-gul",
    lat: 52.2,
    lng: -1.2,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Beagle",
    sourceLabel: "Wikipedia",
    intro: "Rolling in from the English hedgerows: the Beagle.",
    story:
      "English packs once followed beagles through hedgerows by sound as much as sight. Their bay is a rolling howl that says the trail is live, and a beagle\u2019s nose can pick up a scent days old \u2014 which is why they still work at airports, quietly checking bags while looking like they only came for the snacks.\n\nThey were bred to work in a chorus, so a lonely beagle can sound like a one-dog choir. Snoopy did not hurt the fame, but the real beagle is less philosopher than detective: a counter of unattended food never stands a chance, and a walk without a sniff is barely a walk at all."
  },
  {
    id: "poodle",
    name: "Poodle",
    origin: "Germany / France",
    height: "10–15 in (mini) · 15+ in (standard)",
    weight: "10–70 lb depending on size",
    image: "/breeds/poodle.jpg",
    pronunciation: "POO-dul",
    lat: 48.8,
    lng: 2.3,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Poodle",
    sourceLabel: "Wikipedia",
    intro: "Please welcome a splash of pomp and brains, the Poodle.",
    story:
      "That fancy clip began as workwear. Hunters left hair on the joints so a water retriever would not freeze, and the name likely comes from the German pudel, to splash. Under the pom-poms is still a dog built to swim out and bring a bird back.\n\nWhether toy, miniature, or standard, the poodle is one of the sharpest students in dog sport, and a low-shedding coat that allergy-conscious families still seek out. They would rather learn a trick than sit still, and all three sizes share that same busy, splash-ready mind."
  },
  {
    id: "pomeranian",
    name: "Pomeranian",
    origin: "Pomerania (Germany / Poland)",
    height: "6–7 in",
    weight: "3–7 lb",
    image: "/breeds/pomeranian.jpg",
    pronunciation: "pom-er-AY-nee-un",
    lat: 54.4,
    lng: 18.4,
    bark: "yap",
    sourceUrl: "https://en.wikipedia.org/wiki/Pomeranian_dog",
    sourceLabel: "Wikipedia",
    intro: "Coming all the way from old Pomerania, is the Pomeranian.",
    story:
      "Pomeranians once looked more like small sled dogs, spitz cousins with a job in the cold. Queen Victoria\u2019s tiny companions helped shrink the breed into the fox-faced puffball we know, complete with a ruff of double coat and a plume tail curled over the back.\n\nWhat did not shrink was the watchdog instinct. A Pom will announce the mail carrier as if the house were under siege, and they will remind you they are still northern dogs every time a leaf moves outside. Tiny frame, full-size opinions."
  },
  {
    id: "siberian-husky",
    name: "Siberian Husky",
    origin: "Siberia",
    height: "20–24 in",
    weight: "35–60 lb",
    image: "/breeds/siberian-husky.jpg",
    pronunciation: "sy-BEER-ee-un HUS-kee",
    lat: 66.0,
    lng: 170.0,
    bark: "howl",
    sourceUrl: "https://en.wikipedia.org/wiki/Siberian_Husky",
    sourceLabel: "Wikipedia",
    intro: "Straight off the ice, today’s guest is the Siberian Husky.",
    story:
      "The Chukchi people of Siberia needed a dog that could pull light loads across endless ice without burning out. Huskies still carry that endurance, often with ice-blue eyes \u2014 or one of each color \u2014 and they would rather howl and \u201ctalk\u201d than bark, a leftover conversation from the trail.\n\nThey are famous escape artists. A bored husky will cheerfully redesign the yard into a new sled route, then look innocent about the hole in the fence. This is a dog that was built for miles with a team, not for an empty afternoon on a couch."
  },
  {
    id: "pembroke-welsh-corgi",
    name: "Pembroke Welsh Corgi",
    origin: "Wales",
    height: "10–12 in",
    weight: "22–30 lb",
    image: "/breeds/pembroke-welsh-corgi.jpg",
    pronunciation: "PEM-brook WELSH KOR-gee",
    lat: 51.8,
    lng: -4.8,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Pembroke_Welsh_Corgi",
    sourceLabel: "Wikipedia",
    intro: "From the farms of Wales, please say hi to the Pembroke Welsh Corgi.",
    story:
      "On Welsh farms, a corgi\u2019s job was to nip cattle heels while staying under the kick line \u2014 hence those famous short legs. Folklore says the dogs were gifts from woodland fairies, which is a charming way to explain a dog that thinks it runs the pasture.\n\nQueen Elizabeth II kept more than thirty Pembrokes, which turned a herding dog into a royal icon. Pembroke and Cardigan corgis are actually separate breeds, and that heel-nipping instinct still shows up on ankles in the hallway. A tired corgi is a pleasant housemate; an idle one has opinions about your feet."
  },
  {
    id: "dalmatian",
    name: "Dalmatian",
    origin: "Croatia (Dalmatia)",
    height: "19–24 in",
    weight: "45–70 lb",
    image: "/breeds/dalmatian.jpg",
    pronunciation: "dal-MAY-shun",
    lat: 44.1,
    lng: 16.2,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Dalmatian_dog",
    sourceLabel: "Wikipedia",
    intro: "Spots, coaches, and a whole lot of trot — meet the Dalmatian.",
    story:
      "Dalmatian puppies arrive as blank white canvases. The spots bloom in the first weeks, each coat as unique as a fingerprint, a slow-developing map of the dog they will be.\n\nThey once ran beside horse-drawn fire coaches, clearing the road and guarding the horses at the scene. That partnership is why they still live in firehouses in people\u2019s imaginations \u2014 and sometimes in real ones. They were built for miles at a trot, so a short walk around the block rarely feels like a full day\u2019s work."
  },
  {
    id: "greyhound",
    name: "Greyhound",
    origin: "England / Middle East",
    height: "27–30 in",
    weight: "60–70 lb",
    image: "/breeds/greyhound.jpg",
    pronunciation: "GRAY-hound",
    lat: 52.5,
    lng: -1.9,
    bark: "howl",
    sourceUrl: "https://en.wikipedia.org/wiki/Greyhound",
    sourceLabel: "Wikipedia",
    intro: "And today we have the Greyhound, built like a rocket and napping like a cat.",
    story:
      "A greyhound\u2019s deep chest and springy spine can push them past forty miles an hour, among the fastest of land mammals. They hunt by sight, not scent, which is why a flash of motion can still light the afterburners even in a quiet suburb.\n\nThe surprise is what happens after the sprint: they are legendary couch potatoes. Give them a burst of speed, then a soft blanket, and they have had a perfect day. That is why retired racers often make such quiet house pets \u2014 the rocket is real, and so is the nap."
  },
  {
    id: "basenji",
    name: "Basenji",
    origin: "Central Africa",
    height: "16–17 in",
    weight: "22–24 lb",
    image: "/breeds/basenji.jpg",
    pronunciation: "buh-SEN-jee",
    lat: 1.0,
    lng: 22.0,
    bark: "howl",
    sourceUrl: "https://en.wikipedia.org/wiki/Basenji",
    sourceLabel: "Wikipedia",
    intro: "Hello pups, today’s daily dog is the Basenji — the one that yodels.",
    story:
      "In Central Africa the Basenji hunted in silence, and an unusual larynx still makes them yodel instead of bark. They groom like cats, carry almost no doggy smell, and typically come into season only once a year, leftovers from a hunting past that never fully left the breed.\n\nLook at ancient Egyptian art and you will see dogs that could walk off the wall into a modern Basenji ring. Even a devoted Basenji keeps a streak of independence. They will love you, and they will still decide whether your plan is interesting enough to join."
  },
  {
    id: "border-collie",
    name: "Border Collie",
    origin: "England / Scotland border",
    height: "18–22 in",
    weight: "30–55 lb",
    image: "/breeds/border-collie.jpg",
    pronunciation: "BOR-der KOL-ee",
    lat: 55.4,
    lng: -2.8,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Border_Collie",
    sourceLabel: "Wikipedia",
    intro: "From the English–Scottish border, here comes the Border Collie.",
    story:
      "Along the English\u2013Scottish border, shepherds needed a dog that could move a flock with a stare. That intense \u201ceye\u201d still makes Border Collies the world\u2019s top sheepdogs, a living remote control for wool on the hillside.\n\nOne famous collie named Chaser learned more than a thousand toy names \u2014 proof that this breed needs a job, not just a backyard. Without sheep they will herd children, bicycles, and vacuum cleaners. A tired Border Collie is a pleasant one, and an idle one invents chaos."
  },
  {
    id: "german-shepherd",
    name: "German Shepherd",
    origin: "Germany",
    height: "22–26 in",
    weight: "50–90 lb",
    image: "/breeds/german-shepherd.jpg",
    pronunciation: "JER-mun SHEP-erd",
    lat: 51.2,
    lng: 10.4,
    bark: "deep",
    sourceUrl: "https://en.wikipedia.org/wiki/German_Shepherd",
    sourceLabel: "Wikipedia",
    intro: "Reporting for duty: the German Shepherd.",
    story:
      "Captain Max von Stephanitz set out to build one versatile German working dog, and the shepherd that resulted still leads police and rescue lines. Loyalty and a serious work ethic were never a costume; they were the design.\n\nA World War I stray named Rin Tin Tin then carried the breed onto Hollywood screens, but the real dog still needs a task with a point \u2014 training, tracking, or a long purposeful walk. Leave them without one and they may invent a job of their own, usually involving the garden or the curtains."
  },
  {
    id: "labrador-retriever",
    name: "Labrador Retriever",
    origin: "Newfoundland (Canada)",
    height: "21–25 in",
    weight: "55–80 lb",
    image: "/breeds/labrador-retriever.jpg",
    pronunciation: "LAB-ruh-dor re-TREE-ver",
    lat: 48.6,
    lng: -56.3,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Labrador_Retriever",
    sourceLabel: "Wikipedia",
    intro: "Coming all the way from the harbors of Newfoundland, is the Labrador Retriever.",
    story:
      "Off the coast of Newfoundland, fishermen needed a dog that could haul nets and grab fish that wriggled free. The Labrador\u2019s otter tail still steers like a rudder in cold water, and the webbed feet and soft mouth were tools long before they were cute.\n\nBack on land they became America\u2019s most registered breed, a family dog that never quite forgot the harbor. Yellow, black, and chocolate are all the same dog in different coats. Give them water, a retrieve, or a person with a ball, and the old fishing partner shows up in the living room."
  },
  {
    id: "french-bulldog",
    name: "French Bulldog",
    origin: "France / England",
    height: "11–13 in",
    weight: "16–28 lb",
    image: "/breeds/french-bulldog.jpg",
    pronunciation: "FRENCH BULL-dog",
    lat: 48.9,
    lng: 2.3,
    bark: "yap",
    sourceUrl: "https://en.wikipedia.org/wiki/French_Bulldog",
    sourceLabel: "Wikipedia",
    intro: "And today we have the French Bulldog, bat ears and all.",
    story:
      "Lace workers leaving England for France tucked small bulldogs into their luggage, and those dogs grew the bat ears that now define the Frenchie. Those ears were once a fault and became the hallmark, a city dog\u2019s silhouette.\n\nThe compact, front-heavy body is charming on a couch and clumsy in a pool. Most would rather snore beside you than swim a lap, and they overheat quickly, so August is for air-conditioning, not park sprints. A Frenchie is a companion with a soundtrack of snorts, not a weekend athlete."
  },
  {
    id: "dachshund",
    name: "Dachshund",
    origin: "Germany",
    height: "5–9 in",
    weight: "11–32 lb",
    image: "/breeds/dachshund.jpg",
    pronunciation: "DAHKS-hund",
    lat: 50.1,
    lng: 8.7,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Dachshund",
    sourceLabel: "Wikipedia",
    intro: "Hello pups, today’s daily dog is the Dachshund — a badger hunter in a loaf.",
    story:
      "The name means \u201cbadger dog,\u201d and the long, low body was built to follow prey down a burrow. Smooth, longhaired, or wirehaired, in two sizes, the dachshund still thinks it is bigger than the badger.\n\nThat same spine is strong in the tunnel and fragile on the sofa \u2014 jumping off furniture is a real risk. A dachshund on a scent will cheerfully forget that it was supposed to come when called. They were never a lapdog that happens to be short. They are a hunter that happens to fit under a chair."
  },
  {
    id: "australian-shepherd",
    name: "Australian Shepherd",
    origin: "United States",
    height: "18–23 in",
    weight: "40–65 lb",
    image: "/breeds/australian-shepherd.jpg",
    pronunciation: "aw-STRAYL-yun SHEP-erd",
    lat: 39.8,
    lng: -98.6,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Australian_Shepherd",
    sourceLabel: "Wikipedia",
    intro: "Despite the name, this one grew up in America: the Australian Shepherd.",
    story:
      "Despite the name, the modern Aussie grew up on American ranches, not Australian stations. Basque shepherds in the American West helped shape the dog we have now: a herding partner with a merle coat that can pair with two different eye colors, and many born with a naturally bobbed tail.\n\nPut them on cattle \u2014 or a frisbee \u2014 and the herding brain lights up. A quiet house all day is usually not enough of a job. They will invent work from the mail slot, the cat, and your running shoes, because the ranch never really left their heads."
  },
  {
    id: "boxer",
    name: "Boxer",
    origin: "Germany",
    height: "21–25 in",
    weight: "50–80 lb",
    image: "/breeds/boxer.jpg",
    pronunciation: "BOX-er",
    lat: 50.9,
    lng: 6.9,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Boxer_(dog)",
    sourceLabel: "Wikipedia",
    intro: "Please welcome a clown with biceps, the Boxer.",
    story:
      "Watch a boxer play and you may see the namesake move: they rise and bat with their front paws. German police and army kennels were among the first to put that athletic build to work, a clown with biceps on a serious chassis.\n\nA wrinkled brow and undershot jaw give them an almost human look, as if they are always about to tell a joke. They stay puppyish for years, and a boxer looping the yard is simply using the engine they were given. They want a person in the game, not a backyard they patrol alone."
  },
  {
    id: "chihuahua",
    name: "Chihuahua",
    origin: "Mexico",
    height: "5–8 in",
    weight: "under 6 lb",
    image: "/breeds/chihuahua.jpg",
    pronunciation: "chee-WAH-wah",
    lat: 28.6,
    lng: -106.1,
    bark: "yap",
    sourceUrl: "https://en.wikipedia.org/wiki/Chihuahua_(dog)",
    sourceLabel: "Wikipedia",
    intro: "Coming all the way from Mexico, is the Chihuahua.",
    story:
      "Named for the Mexican state where travelers first fell for them in the 1800s, Chihuahuas are the smallest recognized breed and among the surest they are large. The apple-shaped skull is a hallmark, and some puppies are even born with a soft spot called a molera.\n\nThey come in smooth and long coats, both with oversized views on the world. What they lack in pounds they spend in watchdog opinions, and a sweater in winter is practical: that tiny body loses heat fast. They will love you fiercely and still scold the universe from the arm of the couch."
  },
  {
    id: "great-dane",
    name: "Great Dane",
    origin: "Germany",
    height: "28–32 in",
    weight: "110–175 lb",
    image: "/breeds/great-dane.jpg",
    pronunciation: "GRAYT DAYN",
    lat: 51.3,
    lng: 9.5,
    bark: "deep",
    sourceUrl: "https://en.wikipedia.org/wiki/Great_Dane",
    sourceLabel: "Wikipedia",
    intro: "And today we have the Great Dane, a gentle giant in a very tall coat.",
    story:
      "Some Great Danes stand more than three feet at the shoulder, a size once aimed at wild boar and later at estate gates. They were once called Deutsche Dogge \u2014 German mastiff \u2014 and they grow up in a hurry, giant hearts included.\n\nOff duty they are gentle giants who think they are lapdogs. Scooby-Doo did not hurt: a cartoon Dane taught the world to expect a goofy heart in a towering frame. Expect them to lean, to snore, and to believe your sofa was measured for them."
  },
  {
    id: "rottweiler",
    name: "Rottweiler",
    origin: "Germany",
    height: "22–27 in",
    weight: "80–135 lb",
    image: "/breeds/rottweiler.jpg",
    pronunciation: "ROT-wy-ler",
    lat: 48.2,
    lng: 9.2,
    bark: "deep",
    sourceUrl: "https://en.wikipedia.org/wiki/Rottweiler",
    sourceLabel: "Wikipedia",
    intro: "From the German town of Rottweil, meet the Rottweiler.",
    story:
      "Roman drover dogs marched with the legions, and in the German town of Rottweil their descendants pulled butchers\u2019 carts and guarded the day\u2019s coins. When railways replaced cattle drives the breed nearly vanished before fanciers rebuilt it.\n\nA proper Rottweiler is calm and confident, not a constant barker. The story is work first, reputation second. A well-raised Rottweiler is still a steady shadow, not a show of teeth \u2014 a dog that would rather stand beside you than perform for a crowd."
  },
  {
    id: "yorkshire-terrier",
    name: "Yorkshire Terrier",
    origin: "England",
    height: "7–8 in",
    weight: "under 7 lb",
    image: "/breeds/yorkshire-terrier.jpg",
    pronunciation: "YORK-sher TAIR-ee-er",
    lat: 53.8,
    lng: -1.5,
    bark: "yap",
    sourceUrl: "https://en.wikipedia.org/wiki/Yorkshire_Terrier",
    sourceLabel: "Wikipedia",
    intro: "Hello pups, today’s daily dog is the Yorkshire Terrier.",
    story:
      "In Yorkshire mill towns they earned their keep as ratters, then slipped into Victorian parlors as fashion. The floor-length coat is hair, not fur, often wrapped so it can keep growing. Puppies start black and tan; the steel-blue adult color arrives like a slow costume change.\n\nUnder the bow is still a terrier. Many pet Yorkies wear a shorter cut and would chase a rat if you offered one. They are small enough for a handbag and stubborn enough for a barn, which is the whole joke and the whole charm."
  },
  {
    id: "boston-terrier",
    name: "Boston Terrier",
    origin: "United States",
    height: "15–17 in",
    weight: "12–25 lb",
    image: "/breeds/boston-terrier.jpg",
    pronunciation: "BOS-tun TAIR-ee-er",
    lat: 42.4,
    lng: -71.1,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Boston_Terrier",
    sourceLabel: "Wikipedia",
    intro: "Born in Boston and dressed for dinner: the Boston Terrier.",
    story:
      "One of the first American-born breeds, the Boston Terrier earned the nickname American Gentleman for its tuxedo markings \u2014 white blaze, chest, and socks. They were built to be companions in a growing city, not hunters on a moor.\n\nThat short muzzle means plenty of snoring and snuffling. Massachusetts named them the state dog in 1979, and they still suit apartments, provided you do not mind the soundtrack. A Boston wants to be in the room with you, dressed for dinner, breathing like a little engine."
  },
  {
    id: "akita",
    name: "Akita",
    origin: "Japan",
    height: "24–28 in",
    weight: "70–130 lb",
    image: "/breeds/akita.jpg",
    pronunciation: "ah-KEE-tah",
    lat: 39.7,
    lng: 140.1,
    bark: "deep",
    sourceUrl: "https://en.wikipedia.org/wiki/Akita_(dog)",
    sourceLabel: "Wikipedia",
    intro: "Coming all the way from Japan, is the Akita.",
    story:
      "Once reserved for Japanese nobility and large game, the Akita carries a thick double coat and a curled tail like other northern spitz dogs. They remain reserved with strangers and devoted at home, a palace dog that never quite became a party dog.\n\nThe most famous of them, Hachik\u014d, waited at a Tokyo station for his person long after the last train. Helen Keller later helped introduce Akitas to the United States. Loyalty is not a slogan for this breed; it is the plot, and they will write it quietly at the door."
  },
  {
    id: "samoyed",
    name: "Samoyed",
    origin: "Siberia",
    height: "19–24 in",
    weight: "35–65 lb",
    image: "/breeds/samoyed.jpg",
    pronunciation: "SAM-oy-ed",
    lat: 67.5,
    lng: 86.0,
    bark: "howl",
    sourceUrl: "https://en.wikipedia.org/wiki/Samoyed_dog",
    sourceLabel: "Wikipedia",
    intro: "Straight from the Siberian tents, today’s fluffy guest is the Samoyed.",
    story:
      "The Samoyede people of Siberia used these white dogs to herd reindeer, pull sleds, and sleep as living heaters. They lived in the tents, not out in a yard, and the upturned \u201cSammy smile\u201d kept drool from freezing on the trail.\n\nTheir coat is so dense that shed fur is sometimes spun into yarn \u2014 a sweater from a snow cloud. A lonely Sammy will invent a song the neighbors will learn by heart, because this is a dog that was bred to stay close to people in the cold, not to wait outside it."
  },
  {
    id: "bernese-mountain-dog",
    name: "Bernese Mountain Dog",
    origin: "Switzerland",
    height: "23–28 in",
    weight: "70–115 lb",
    image: "/breeds/bernese-mountain-dog.jpg",
    pronunciation: "bur-NEEZ MOUN-tin dog",
    lat: 46.9,
    lng: 7.5,
    bark: "deep",
    sourceUrl: "https://en.wikipedia.org/wiki/Bernese_Mountain_Dog",
    sourceLabel: "Wikipedia",
    intro: "From the Swiss Alps, please welcome the Bernese Mountain Dog.",
    story:
      "In the Swiss canton of Bern, these tri-color farm dogs drafted carts of milk and cheese between alpine villages. Black, rust, and white is not just pretty \u2014 it is the breed\u2019s uniform, and they are one of four Swiss mountain dogs.\n\nThey are gentle giants who would rather a cool morning than a hot afternoon. They are not a long-lived breed, which makes those calm years feel even more precious. A Berner wants to be near the work and near the people, preferably both at once, on a road that smells like grass."
  },
  {
    id: "newfoundland",
    name: "Newfoundland",
    origin: "Canada",
    height: "26–28 in",
    weight: "100–150 lb",
    image: "/breeds/newfoundland.jpg",
    pronunciation: "NEW-fund-land",
    lat: 49.2,
    lng: -56.0,
    bark: "deep",
    sourceUrl: "https://en.wikipedia.org/wiki/Newfoundland_dog",
    sourceLabel: "Wikipedia",
    intro: "Coming all the way from Canada, is the Newfoundland.",
    story:
      "Webbed feet, a waterproof coat, and huge lungs made the Newfoundland a born lifeguard in icy Atlantic water. Fishermen used them as living tow-lines, and they still swim with a kind of breaststroke that looks almost human from the shore.\n\nJ.M. Barrie\u2019s dog Luath inspired Nana in Peter Pan, the nanny who thought in woofs. Calm rescue instinct is still the breed\u2019s quiet superpower. Expect drool, wet floors, and a dog that treats every puddle like a drill \u2014 then leans on you as if you were the one who needed saving."
  },
  {
    id: "whippet",
    name: "Whippet",
    origin: "England",
    height: "18–22 in",
    weight: "25–40 lb",
    image: "/breeds/whippet.jpg",
    pronunciation: "WIP-it",
    lat: 54.9,
    lng: -1.6,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Whippet",
    sourceLabel: "Wikipedia",
    intro: "And today we have the Whippet, a pocket racehorse with a blanket habit.",
    story:
      "English mill towns once called the whippet the poor man\u2019s racehorse: a sighthound in miniature that could hit about 35 miles an hour. Families also kept them as hearth companions, a pocket sprinter who came inside when the mill whistle blew.\n\nAfter the burst they want a blanket, because thin skin and low fat make them chilly. Speed, then snuggle, is the whole personality. A squirrel can still make a whippet forget its own name for twenty seconds, and then it will steal your spot on the sofa as if nothing happened."
  },
  {
    id: "maltese",
    name: "Maltese",
    origin: "Malta / Mediterranean",
    height: "7–9 in",
    weight: "under 7 lb",
    image: "/breeds/maltese.jpg",
    pronunciation: "mawl-TEEZ",
    lat: 35.9,
    lng: 14.4,
    bark: "yap",
    sourceUrl: "https://en.wikipedia.org/wiki/Maltese_dog",
    sourceLabel: "Wikipedia",
    intro: "Hello pups, today’s daily dog is the Maltese — a little white cloud with a very old passport.",
    story:
      "Greek and Roman writers already described small white dogs from Mediterranean islands. The Maltese coat has little undercoat, so it hardly sheds and can grow to the floor \u2014 single-layered hair that can also be kept in a short pet trim.\n\nEuropean nobles kept them as living jewelry, lap warmers for people who could afford not to hunt. They have a very old passport and a very current job: sit close, look like a cloud, and announce visitors as if the palace still had a gate."
  },
  {
    id: "saint-bernard",
    name: "Saint Bernard",
    origin: "Switzerland / Italy",
    height: "26–30 in",
    weight: "120–180 lb",
    image: "/breeds/saint-bernard.jpg",
    pronunciation: "saynt ber-NARD",
    lat: 45.9,
    lng: 7.2,
    bark: "deep",
    sourceUrl: "https://en.wikipedia.org/wiki/St._Bernard_(dog)",
    sourceLabel: "Wikipedia",
    intro: "From the mountain hospices, here comes the Saint Bernard.",
    story:
      "Hospice monks in the Alps sent these dogs into blizzards to find lost travelers. The brandy barrel is a painter\u2019s myth, not a packing list. A nineteenth-century Saint named Barry is still credited with dozens of mountain rescues \u2014 a reminder that the real tool was a nose, not a cask.\n\nThe original hospice dogs were smaller and shorter-haired than the Saints in paintings, and avalanche work has mostly passed to machines. The drooly giant remains, a dog whose story is still about finding someone in the weather, even if the weather is just your front hall after a walk."
  },
  {
    id: "australian-cattle-dog",
    name: "Australian Cattle Dog",
    origin: "Australia",
    height: "17–20 in",
    weight: "30–50 lb",
    image: "/breeds/australian-cattle-dog.jpg",
    pronunciation: "aw-STRAYL-yun KAT-ul dog",
    lat: -25.3,
    lng: 133.8,
    bark: "woof",
    sourceUrl: "https://en.wikipedia.org/wiki/Australian_Cattle_Dog",
    sourceLabel: "Wikipedia",
    intro: "Coming all the way from Australian cattle country, is the Australian Cattle Dog.",
    story:
      "On huge Australian stations, these dogs drove cattle by nipping heels across distances that would melt a softer breed. They were mixed with dingoes and collies to handle wild cattle, and puppies are born white; the blue or red speckle fills in like a developing photograph.\n\nOne cattle dog named Bluey is often listed among the longest-lived dogs ever recorded, which fits a breed built for years of hard miles. A cattle dog without a job will invent one \u2014 usually involving your ankles. They want a herd, and if you do not have cattle, you will do."
  },
  {
    id: "weimaraner",
    name: "Weimaraner",
    origin: "Germany",
    height: "23–27 in",
    weight: "55–90 lb",
    image: "/breeds/weimaraner.jpg",
    pronunciation: "VY-muh-rah-ner",
    lat: 50.98,
    lng: 11.33,
    bark: "deep",
    sourceUrl: "https://en.wikipedia.org/wiki/Weimaraner",
    sourceLabel: "Wikipedia",
    intro: "And today we have the Weimaraner, the Grey Ghost of Weimar.",
    story:
      "Nobles in Weimar kept this silver hunting dog to themselves for big game, and the nickname Grey Ghost still fits the coat and the light eyes. They were once so closely held that leaving Weimar with one was almost a scandal.\n\nPhotographer William Wegman later posed Weimaraners like people, and the world fell for the deadpan stare. Under the art-school fame is still a dog that wants to range, and they still suffer if left alone. The Grey Ghost wants a person, not a kennel, and a day with something to hunt \u2014 even if the quarry is a tennis ball in tall grass."
  },
];

/** Local calendar date YYYY-MM-DD — new Daily Dog at midnight in the user's timezone. */
export function todayDateKey(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function msUntilNextLocalMidnight(now = Date.now()): number {
  const d = new Date(now);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return next.getTime() - now;
}

export const DAILY_BREEDS: DailyBreed[] = [
  ...CORE_BREEDS,
  ...(extraBreeds as DailyBreed[]),
];

function dayOfYear(key: string): number {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86_400_000);
}

export function breedForDateKey(key: string): DailyBreed {
  const n = DAILY_BREEDS.length;
  return DAILY_BREEDS[dayOfYear(key) % n]!;
}

export function breedForDay(now = Date.now()): DailyBreed {
  return breedForDateKey(todayDateKey(now));
}
