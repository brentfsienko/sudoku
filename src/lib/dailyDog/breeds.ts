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

export const DAILY_BREEDS: DailyBreed[] = [
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
      "In the Scottish Highlands of the 1800s, hunters wanted a dog that could fetch waterfowl from icy lakes without leaving a mark on the bird. The golden’s water-repellent coat still dries in a hurry after a swim. That same gentle mouth and eager brain made them one of the world’s favorite guide and therapy dogs. Lord Tweedmouth spent decades refining the yellow retriever at Guisachan, and the breed still wants a job — even if the job is carrying a tennis ball and your whole afternoon."
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
      "High in Japan’s mountains, the Shiba once hunted small game with a bold, catlike independence that never really left the breed. They still lick themselves clean and keep a cool distance from strangers. Cross them, and you may hear the famous Shiba scream — a protest as dramatic as it is loud. Shiba means brushwood, a nod to the terrain they worked, and they are one of Japan’s oldest native breeds after nearly vanishing in the twentieth century."
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
      "For centuries, imperial Chinese courts kept pugs as living lap ornaments, and those deep facial folds were a point of pride — a wrinkle on the forehead was even called a prince mark. The trade-off is a short snout that makes hot days hard work. A pug would rather share a sofa than a long run in the sun. Dutch traders carried them west, and European parlors soon learned the snorts, sneezes, and single-minded quest for a lap."
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
      "English packs once followed beagles through hedgerows by sound as much as sight: their bay is a rolling howl that says “I have the trail.” A beagle’s nose can pick up a scent days old, which is why they still work at airports. And yes — Snoopy is a beagle, which did not hurt the breed’s fame. They were bred to work in a chorus, so a lonely beagle can sound like a one-dog choir, and a counter of unattended snacks never stands a chance."
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
      "That fancy clip began as workwear: hunters left hair on the joints so a water retriever would not freeze. Under the pom-poms is one of the sharpest students in dog sport, and a low-shedding coat that allergy-conscious families still seek out. Whether toy or standard, the poodle would rather learn a trick than sit still. The name likely comes from the German pudel, to splash, and all three sizes share that same busy, splash-ready mind."
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
      "Pomeranians once looked more like small sled dogs. Queen Victoria’s tiny companions helped shrink the breed into the fox-faced puffball we know, complete with a ruff of double coat. What did not shrink was the watchdog instinct — a Pom will announce the mail carrier as if the house were under siege. They are still spitz dogs at heart, plume tail curled over the back, and they will remind you of that every time a leaf moves outside."
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
      "The Chukchi people of Siberia needed a dog that could pull light loads across endless ice without burning out. Huskies still carry that endurance, often with ice-blue eyes — or one of each color. They would rather howl and “talk” than bark, a leftover conversation from the trail. They are famous escape artists, and a bored husky will cheerfully redesign the yard into a new sled route."
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
      "On Welsh farms, a corgi’s job was to nip cattle heels while staying under the kick line — hence those famous short legs. Folklore says the dogs were gifts from woodland fairies. Queen Elizabeth II kept more than thirty Pembrokes, which turned a herding dog into a royal icon. Pembroke and Cardigan corgis are actually separate breeds, and that heel-nipping instinct still shows up on ankles in the hallway."
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
      "Dalmatian puppies arrive as blank white canvases; the spots bloom in the first weeks, each coat as unique as a fingerprint. They once ran beside horse-drawn fire coaches, clearing the road and guarding the horses. That partnership is why they still live in firehouses in people’s imaginations — and sometimes in real ones. They were built for miles at a trot, so a short walk around the block rarely feels like a full day’s work."
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
      "A greyhound’s deep chest and springy spine can push them past 40 miles an hour, among the fastest of land mammals. The surprise is what happens after the sprint: they are legendary couch potatoes. Give them a burst of speed, then a soft blanket, and they have had a perfect day. They hunt by sight, not scent, which is why a flash of motion can still light the afterburners — and why retired racers often make such quiet house pets."
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
      "In Central Africa the Basenji hunted in silence, and an unusual larynx still makes them yodel instead of bark. They groom like cats and carry almost no doggy smell. Look at ancient Egyptian art and you will see dogs that could walk off the wall into a modern Basenji ring. They typically come into season only once a year, another leftover from that hunting past, and even a devoted Basenji keeps a streak of independence."
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
      "Along the English–Scottish border, shepherds needed a dog that could move a flock with a stare. That intense “eye” still makes Border Collies the world’s top sheepdogs. One famous collie named Chaser learned more than a thousand toy names — proof that this breed needs a job, not just a backyard. Without sheep they will herd children, bicycles, and vacuum cleaners; a tired Border Collie is a pleasant one, and an idle one invents chaos."
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
      "Captain Max von Stephanitz set out to build one versatile German working dog, and the shepherd that resulted still leads police and rescue lines. A World War I stray named Rin Tin Tin then carried the breed onto Hollywood screens. Loyalty and a serious work ethic were never just a movie trick. They still need a task with a point — training, tracking, or a long purposeful walk — or they may invent a job of their own."
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
      "Off the coast of Newfoundland, fishermen needed a dog that could haul nets and grab fish that wriggled free. The Labrador’s otter tail still steers like a rudder in cold water. Back on land they became America’s most registered breed — a family dog that never quite forgot the harbor. Yellow, black, and chocolate are all the same dog in different coats, and the webbed feet and soft mouth were tools long before they were cute."
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
      "Lace workers leaving England for France tucked small bulldogs into their luggage, and those dogs grew the bat ears that now define the Frenchie. The compact, front-heavy body is charming on a couch and clumsy in a pool. Most would rather snore beside you than swim a lap. Those ears were once a fault and became the hallmark, and they overheat quickly, so August is for air-conditioning, not park sprints."
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
      "The name means “badger dog,” and the long, low body was built to follow prey down a burrow. That same spine is strong in the tunnel and fragile on the sofa — jumping off furniture is a real risk. Smooth, longhaired, or wirehaired, the dachshund still thinks it is bigger than the badger. They come in two sizes as well as three coats, and a dachshund on a scent will cheerfully forget that it was supposed to come when called."
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
      "Despite the name, the modern Aussie grew up on American ranches, not Australian stations. Many are born with a naturally bobbed tail and a merle coat that can pair with two different eye colors. Put them on cattle — or a frisbee — and the herding brain lights up. Basque shepherds in the American West helped shape the dog we have now, and a quiet house all day is usually not enough of a job."
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
      "Watch a boxer play and you may see the namesake move: they rise and bat with their front paws. German police and army kennels were among the first to put that athletic build to work. A wrinkled brow and undershot jaw give them an almost human look, as if they are always about to tell a joke. They stay puppyish for years, and a boxer looping the yard is simply using the engine they were given."
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
      "Named for the Mexican state where travelers first fell for them in the 1800s, Chihuahuas are the smallest recognized breed and among the surest they are large. The apple-shaped skull is a hallmark, and some puppies are even born with a soft spot called a molera. What they lack in pounds they spend in watchdog opinions. They come in smooth and long coats, both with oversized views on the world, and a sweater in winter is practical: that tiny body loses heat fast."
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
      "Some Great Danes stand more than three feet at the shoulder, a size once aimed at wild boar and later at estate gates. Off duty they are gentle giants who think they are lapdogs. Scooby-Doo did not hurt: a cartoon Dane taught the world to expect a goofy heart in a towering frame. They were once called Deutsche Dogge — German mastiff — and they grow up in a hurry, giant hearts included."
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
      "Roman drover dogs marched with the legions, and in the German town of Rottweil their descendants pulled butchers’ carts and guarded the day’s coins. A proper Rottweiler is calm and confident, not a constant barker. The breed’s story is one of work first, reputation second. When railways replaced cattle drives the breed nearly vanished before fanciers rebuilt it, and a well-raised Rottweiler is still a steady shadow, not a show of teeth."
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
      "In Yorkshire mill towns they earned their keep as ratters, then slipped into Victorian parlors as fashion. The floor-length coat is hair, not fur, often wrapped so it can keep growing. Puppies start black and tan; the steel-blue adult color arrives like a slow costume change. Under the bow is still a terrier, which is why many pet Yorkies wear a shorter cut and would chase a rat if you offered one."
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
      "One of the first American-born breeds, the Boston Terrier earned the nickname American Gentleman for its tuxedo markings — white blaze, chest, and socks. That short muzzle means plenty of snoring and snuffling. They were built to be companions in a growing city, not hunters on a moor. Massachusetts named them the state dog in 1979, and they still suit apartments, provided you do not mind the soundtrack of snores."
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
      "Once reserved for Japanese nobility and large game, the Akita carries a thick double coat and a curled tail like other northern spitz dogs. The most famous of them, Hachikō, waited at a Tokyo station for his person long after the last train. Loyalty is not a slogan for this breed; it is the plot. Helen Keller later helped introduce Akitas to the United States, and they remain reserved with strangers and devoted at home."
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
      "The Samoyede people of Siberia used these white dogs to herd reindeer, pull sleds, and sleep as living heaters. The upturned “Sammy smile” kept drool from freezing on the trail. Their coat is so dense that shed fur is sometimes spun into yarn — a sweater from a snow cloud. They lived in the tents, not out in a yard, and a lonely Sammy will invent a song the neighbors will learn by heart."
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
      "In the Swiss canton of Bern, these tri-color farm dogs drafted carts of milk and cheese between alpine villages. Black, rust, and white is not just pretty — it is the breed’s uniform. They are gentle giants who would rather a cool morning than a hot afternoon. They are one of four Swiss mountain dogs, and they are not a long-lived breed, which makes those calm years feel even more precious."
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
      "Webbed feet, a waterproof coat, and huge lungs made the Newfoundland a born lifeguard in icy Atlantic water. J.M. Barrie’s dog Luath inspired Nana in Peter Pan, the nanny who thought in woofs. Calm rescue instinct is still the breed’s quiet superpower. Fishermen used them as living tow-lines, and they still swim with a kind of breaststroke — expect drool, wet floors, and a dog that treats every puddle like a drill."
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
      "English mill towns once called the whippet the poor man’s racehorse: a sighthound in miniature that could hit about 35 miles an hour. After the burst they want a blanket, because thin skin and low fat make them chilly. Speed, then snuggle, is the whole personality. Families also kept them as hearth companions, and a squirrel can still make a whippet forget its own name for twenty seconds."
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
      "Greek and Roman writers already described small white dogs from Mediterranean islands. The Maltese coat has little undercoat, so it sheds almost not at all and can grow to the floor. European nobles kept them as living jewelry — a lapdog with a very old passport. The coat is single-layered hair that can be kept in a short pet trim, and they were lap warmers for people who could afford not to hunt."
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
      "Hospice monks in the Alps sent these dogs into blizzards to find lost travelers. The brandy barrel is a painter’s myth, not a packing list. A 19th-century Saint named Barry is still credited with dozens of mountain rescues — a reminder that the real tool was a nose, not a cask. The original hospice dogs were smaller and shorter-haired than the Saints in paintings, and avalanche work has mostly passed to machines, but the drooly giant remains."
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
      "On huge Australian stations, these dogs drove cattle by nipping heels across distances that would melt a softer breed. Puppies are born white; the blue or red speckle fills in like a developing photograph. One cattle dog named Bluey is often listed among the longest-lived dogs ever recorded. They were mixed with dingoes and collies to handle wild cattle, and a cattle dog without a job will invent one — usually involving your ankles."
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
      "Nobles in Weimar kept this silver hunting dog to themselves for big game, and the nickname Grey Ghost still fits the coat and the light eyes. Photographer William Wegman later posed Weimaraners like people, and the world fell for the deadpan stare. Under the art-school fame is still a dog that wants to range. They were once so closely held that leaving Weimar with one was almost a scandal, and they still suffer if left alone — the Grey Ghost wants a person, not a kennel."
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
