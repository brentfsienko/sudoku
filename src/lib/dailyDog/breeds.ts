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
  /** Primary overview source. Prefer the AKC breed page when one exists. */
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
    sourceUrl: "https://www.akc.org/dog-breeds/golden-retriever/",
    sourceLabel: "American Kennel Club",
    intro: "Coming all the way from the Scottish Highlands, is the Golden Retriever.",
    story:
      "They are an exuberant Scottish gundog of great beauty. They stand among America’s most popular dog breeds. They are serious workers at hunting and field work, as guides for the blind, and in search-and-rescue, enjoy obedience and other competitive events, and have an endearing love of life when not at work.\n\nThey are a sturdy, muscular dog of medium size, famous for the dense, lustrous coat of gold that gives the breed its name. The broad head, with its friendly and intelligent eyes, short ears, and straight muzzle, is a breed hallmark."
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
    sourceUrl: "https://www.akc.org/dog-breeds/shiba-inu/",
    sourceLabel: "American Kennel Club",
    intro: "Hello pups, today’s daily dog is the Shiba Inu.",
    story:
      "Brought to America from Japan as recently as 60 years ago, Shibas are growing in popularity in the West and are already the most popular breed in their homeland. Their white markings combined with their coloring and their alert expression and smooth stride makes them almost foxlike.\n\nThey're sturdy, muscular dogs with a bold, confident personality to match. The first documented Shiba to enter the United States was imported by a military family in 1954."
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
    sourceUrl: "https://www.akc.org/dog-breeds/pug/",
    sourceLabel: "American Kennel Club",
    intro: "And today we have the Pug — tiny, wrinkled, and very sure of itself.",
    story:
      "Once the mischievous companion of Chinese emperors, and later the mascot of Holland’s royal House of Orange, the small but solid Pug is today adored by his millions of fans around the world. Pugs live to love and to be loved in return.\n\nTheir motto is the Latin phrase 'multum in parvo' —an apt description of this small but muscular breed. They come in three colors: silver or apricot-fawn with a black face mask, or all black."
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
    sourceUrl: "https://www.akc.org/dog-breeds/beagle/",
    sourceLabel: "American Kennel Club",
    intro: "Rolling in from the English hedgerows: the Beagle.",
    story:
      "There are two Beagle varieties: those standing under 13 inches at the shoulder, and those between 13 and 15 inches. Both varieties are sturdy, solid, and 'big for their inches,' as dog folks say.\n\nThey come in such pleasing colors as lemon, red and white, and tricolor. Their fortune is in his adorable face, with its big brown or hazel eyes set off by long, houndy ears set low on a broad head."
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
    sourceUrl: "https://www.akc.org/dog-breeds/poodle-standard/",
    sourceLabel: "American Kennel Club",
    intro: "Please welcome a splash of pomp and brains, the Poodle.",
    story:
      "Poodles come in three size varieties: Standards should be more than 15 inches tall at the shoulder; Miniatures are 15 inches or under; Toys stand no more than 10 inches. All three varieties have the same build and proportions.\n\nAt dog shows, Poodles are usually seen in the elaborate Continental clip. Most pet owners prefer the simpler Sporting clip, in which the coat is shorn to follow the outline of the squarely built, smoothly muscled body."
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
    sourceUrl: "https://www.akc.org/dog-breeds/pomeranian/",
    sourceLabel: "American Kennel Club",
    intro: "Coming all the way from old Pomerania, is the Pomeranian.",
    story:
      "—The Pomeranian combines a tiny body and a commanding big-dog demeanor. The abundant double coat, with its frill extending over the chest and shoulders, comes in almost two dozen colors, and various patterns and markings, but is most commonly seen in orange or red.\n\nAlert and intelligent, Pomeranians are easily trained and make fine watchdogs and perky pets for families with children old enough to know the difference between a toy dog and a toy. Poms are active but can be exercised with indoor play and short walks, so they are content in both the city and suburbs."
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
    sourceUrl: "https://www.akc.org/dog-breeds/siberian-husky/",
    sourceLabel: "American Kennel Club",
    intro: "Straight off the ice, today’s guest is the Siberian Husky.",
    story:
      "The graceful, medium-sized Siberian Husky's almond-shaped eyes can be either brown or blue—and sometimes one of each—and convey a keen but amiable and even mischievous expression. Quick and nimble-footed, Siberians are known for their powerful but seemingly effortless gait.\n\nTipping the scales at no more than 60 pounds, they are noticeably smaller and lighter than their burly cousin, the Alaskan Malamute. As born pack dogs, they enjoy family life and get on well with other dogs."
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
    sourceUrl: "https://www.akc.org/dog-breeds/pembroke-welsh-corgi/",
    sourceLabel: "American Kennel Club",
    intro: "From the farms of Wales, please say hi to the Pembroke Welsh Corgi.",
    story:
      "At 10 to 12 inches at the shoulder and 27 to 30 pounds, a well-built male Pembroke presents a big dog in a small package. Short but powerful legs, muscular thighs, and a deep chest equip him for a hard day's work.\n\nBuilt long and low, Pembrokes are surprisingly quick and agile. They can be red, sable, fawn, and black and tan, with or without white markings."
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
    sourceUrl: "https://www.akc.org/dog-breeds/dalmatian/",
    sourceLabel: "American Kennel Club",
    intro: "Spots, coaches, and a whole lot of trot — meet the Dalmatian.",
    story:
      "Their delightful, eye-catching spots of black or liver adorn one of the most distinctive coats in the animal kingdom. Beneath the spots is a graceful, elegantly proportioned trotting dog standing between 19 and 23 inches at the shoulder.\n\nDals are muscular, built to go the distance; the powerful hindquarters provide the drive behind the smooth, effortless gait. The Dal was originally bred to guard horses and coaches, and some of the old protective instinct remains."
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
    sourceUrl: "https://www.akc.org/dog-breeds/greyhound/",
    sourceLabel: "American Kennel Club",
    intro: "And today we have the Greyhound, built like a rocket and napping like a cat.",
    story:
      "Greyhounds are the essence of the dog breeder's credo 'Form follows function.' From the narrow, aerodynamic skull to the shock-absorbing pads of the feet, Greyhounds are perfectly constructed for high-speed pursuit. The lean beauty of the Greyhound 'inverted S' shape, created by the deep chest curving gently into a tightly tucked waist, has been an object of fascination for artists, poets, and kings for as long as human beings have called themselves civilized.\n\nGreyhounds are the template from which other coursing hounds have been struck. Prehistoric art depicts doglike creatures and men chasing game, but the Greyhound story begins properly in Egypt some 5,000 years ago."
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
    sourceUrl: "https://www.akc.org/dog-breeds/basenji/",
    sourceLabel: "American Kennel Club",
    intro: "Hello pups, today’s daily dog is the Basenji — the one that yodels.",
    story:
      "Basenjis are small, graceful hounds standing 16 or 17 inches at the shoulder. They are recognizable by their glistening short coat, tightly curled tail, and wrinkled forehead and expressive almond-shaped eyes that convey a variety of subtle, humanlike emotions.\n\nBasenjis are a lovely sight at a standstill but more impressive yet at a fast trot, when they exhibit the long, smooth strides of a mini-racehorse. And yes, it's true, they don't bark, but they make their feelings known with an odd sound described as something between a chortle and a yodel."
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
    sourceUrl: "https://www.akc.org/dog-breeds/border-collie/",
    sourceLabel: "American Kennel Club",
    intro: "From the English–Scottish border, here comes the Border Collie.",
    story:
      "Borders are athletic, medium-sized herders standing 18 to 22 inches at the shoulder. The overall look is that of a muscular but nimble worker unspoiled by passing fads.\n\nBoth the rough coat and the smooth coat come in a variety of colors and patterns. The almond eyes are the focus of an intelligent expression—an intense gaze, the Border's famous 'herding eye', is a breed hallmark."
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
    sourceUrl: "https://www.akc.org/dog-breeds/german-shepherd-dog/",
    sourceLabel: "American Kennel Club",
    intro: "Reporting for duty: the German Shepherd.",
    story:
      "Generally considered dogkind’s finest all-purpose worker, the German Shepherd Dog is a large, agile, muscular dog of noble character and high intelligence. Loyal, confident, courageous, and steady, the German Shepherd is truly a dog lover’s delight.\n\nGerman Shepherd Dogs can stand as high as 26 inches at the shoulder and, when viewed in outline, presents a picture of smooth, graceful curves rather than angles. The natural gait is a free-and-easy trot, but they can turn it up a notch or two and reach great speeds."
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
    sourceUrl: "https://www.akc.org/dog-breeds/labrador-retriever/",
    sourceLabel: "American Kennel Club",
    intro: "Coming all the way from the harbors of Newfoundland, is the Labrador Retriever.",
    story:
      "The sweet-faced, lovable Labrador Retriever is America’s most popular dog breed. Labs are friendly, outgoing, and high-spirited companions who have more than enough affection to go around for a family looking for a medium-to-large dog.\n\nThe sturdy, well-balanced Labrador Retriever can, depending on the sex, stand from 21.5 to 24.5 inches at the shoulder and weigh between 55 to 80 pounds. The dense, hard coat comes in yellow, black, and a luscious chocolate."
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
    sourceUrl: "https://www.akc.org/dog-breeds/french-bulldog/",
    sourceLabel: "American Kennel Club",
    intro: "And today we have the French Bulldog, bat ears and all.",
    story:
      "They are resembles a Bulldog in miniature, except for the large, erect 'bat ears' that are the breed's trademark feature. The head is large and square, with heavy wrinkles rolled above the extremely short nose.\n\nThe body beneath the smooth, brilliant coat is compact and muscular. The bright, affectionate Frenchie is a charmer."
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
    sourceUrl: "https://www.akc.org/dog-breeds/dachshund/",
    sourceLabel: "American Kennel Club",
    intro: "Hello pups, today’s daily dog is the Dachshund — a badger hunter in a loaf.",
    story:
      "The word 'icon' is terribly overworked, but the Dachshund—with his unmistakable long-backed body, little legs, and big personality—is truly an icon of purebred dogdom. Dachshunds can be standard-sized or miniature , and come in one of three coat types: smooth, wirehaired, or longhaired.\n\nDachshunds aren't built for distance running, leaping, or strenuous swimming, but otherwise these tireless hounds are game for anything. Smart and vigilant, with a big-dog bark, they make fine watchdogs."
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
    sourceUrl: "https://www.akc.org/dog-breeds/australian-shepherd/",
    sourceLabel: "American Kennel Club",
    intro: "Despite the name, this one grew up in America: the Australian Shepherd.",
    story:
      "They are the cowboy's herding dog of choice, is a medium-sized worker with a keen, penetrating gaze in the eye. Aussie coats offer different looks, including merle .\n\nIn all ways, they're the picture of rugged and agile movers of stock. Aussies exhibit an irresistible impulse to herd, anything: birds, dogs, kids."
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
    sourceUrl: "https://www.akc.org/dog-breeds/boxer/",
    sourceLabel: "American Kennel Club",
    intro: "Please welcome a clown with biceps, the Boxer.",
    story:
      "A well-made Boxer in peak condition is an awesome sight. A male can stand as high as 25 inches at the shoulder; females run smaller.\n\nTheir muscles ripple beneath a short, tight-fitting coat. The dark brown eyes and wrinkled forehead give the face an alert, curious look."
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
    sourceUrl: "https://www.akc.org/dog-breeds/chihuahua/",
    sourceLabel: "American Kennel Club",
    intro: "Coming all the way from Mexico, is the Chihuahua.",
    story:
      "They are a balanced, graceful dog of terrier-like demeanor, weighing no more than 6 pounds. The rounded \\\"apple\\\" head is a breed hallmark.\n\nThe erect ears and full, luminous eyes are acutely expressive. Coats come in many colors and patterns, and can be long or short."
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
    sourceUrl: "https://www.akc.org/dog-breeds/great-dane/",
    sourceLabel: "American Kennel Club",
    intro: "And today we have the Great Dane, a gentle giant in a very tall coat.",
    story:
      "As tall as 32 inches at the shoulder, Danes tower over most other dogs and when standing on their hind legs, they are taller than most people. These powerful giants are the picture of elegance and balance, with the smooth and easy stride of born noblemen.\n\nThe coat comes in different colors and patterns, perhaps the best-known being the black-and-white patchwork pattern known as \\\"harlequin.\\\" Despite their sweet nature, Danes are alert home guardians. Just the sight of these gentle giants is usually enough to make intruders think twice."
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
    sourceUrl: "https://www.akc.org/dog-breeds/rottweiler/",
    sourceLabel: "American Kennel Club",
    intro: "From the German town of Rottweil, meet the Rottweiler.",
    story:
      "A male Rottweiler will stand anywhere from 24 to 27 muscular inches at the shoulder; females run a bit smaller and lighter. The glistening, short black coat with smart rust markings add to the picture of imposing strength.\n\nA thickly muscled hindquarters powers the Rottie's effortless trotting gait. A well-bred and properly raised Rottie will be calm and confident, courageous but not unduly aggressive."
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
    sourceUrl: "https://www.akc.org/dog-breeds/yorkshire-terrier/",
    sourceLabel: "American Kennel Club",
    intro: "Hello pups, today’s daily dog is the Yorkshire Terrier.",
    story:
      "They are a compact, toy-size terrier of no more than seven pounds whose crowning glory is a floor-length, silky coat of steel blue and a rich golden tan. Don't let the Yorkie's daintiness fool you.\n\nTenacious, feisty, brave, and sometimes bossy, the Yorkie exhibits all the traits of a true terrier. Often named the most popular dog breed in various American cities, Yorkies pack lots of big-town attitude into a small but self-important package."
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
    sourceUrl: "https://www.akc.org/dog-breeds/boston-terrier/",
    sourceLabel: "American Kennel Club",
    intro: "Born in Boston and dressed for dinner: the Boston Terrier.",
    story:
      "Boston Terriers are compact, short-tailed, well-balanced little dogs weighing no more than 25 pounds. The stylish 'tuxedo' coat can be white and either black, brindle, or seal .\n\nThe head is square, the muzzle is short, and the large, round eyes can shine with kindness, curiosity, or mischief. Ever alert to their surroundings, Bostons move with a jaunty, rhythmic step."
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
    sourceUrl: "https://www.akc.org/dog-breeds/akita/",
    sourceLabel: "American Kennel Club",
    intro: "Coming all the way from Japan, is the Akita.",
    story:
      "Akitas are burly, heavy-boned spitz-type dogs of imposing stature. Standing 24 to 28 inches at the shoulder, Akitas have a dense coat that comes in several colors, including white.\n\nThe head is broad and massive, and is balanced in the rear by a full, curled-over tail. The erect ears and dark, shining eyes contribute to an expression of alertness, a hallmark of the breed."
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
    sourceUrl: "https://www.akc.org/dog-breeds/samoyed/",
    sourceLabel: "American Kennel Club",
    intro: "Straight from the Siberian tents, today’s fluffy guest is the Samoyed.",
    story:
      "Samoyeds, the smiling sled dogs, were bred for hard work in the world's coldest locales. In the Siberian town of Oymyakon, for instance, temperatures of minus-60 degrees are common.\n\nThe Sammy's famous white coat is thick enough to protect against such brutal conditions. Powerful, agile, tireless, impervious to cold, Sammies are drop-dead gorgeous but highly functional."
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
    sourceUrl: "https://www.akc.org/dog-breeds/bernese-mountain-dog/",
    sourceLabel: "American Kennel Club",
    intro: "From the Swiss Alps, please welcome the Bernese Mountain Dog.",
    story:
      "They are a large, sturdy worker who can stand over 27 inches at the shoulder. The thick, silky, and moderately long coat is tricolored: jet black, clear white, and rust.\n\nThe distinctive markings on the coat and face are breed hallmarks and, combined with the intelligent gleam in the dark eyes, add to the Berner's aura of majestic nobility. A hardy dog who thrives in cold weather, the Berner's brain and brawn helped him multitask on the farms and pastures of Switzerland."
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
    sourceUrl: "https://www.akc.org/dog-breeds/newfoundland/",
    sourceLabel: "American Kennel Club",
    intro: "Coming all the way from Canada, is the Newfoundland.",
    story:
      "A male Newfoundland can weigh up to 150 pounds and stand 28 inches at the shoulder; females typically go 100 to 120 pounds. The Newf head is majestic, the expression soft and soulful.\n\nColors are gray, brown, black, and a black-and-white coat named for artist Sir Edwin Landseer, who popularized the look in his paintings. The Newfie breed standard says that a sweet temperament is the \\\"most important single characteristic of the breed.\\\" The Newf's sterling character is expressed in their affinity for kids."
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
    sourceUrl: "https://www.akc.org/dog-breeds/whippet/",
    sourceLabel: "American Kennel Club",
    intro: "And today we have the Whippet, a pocket racehorse with a blanket habit.",
    story:
      "At somewhere between 18 and 22 inches at the shoulder, the Whippet looks like a Greyhound, but smaller. They are exhibits the classic 'inverted S' lines of the sighthound.\n\nThe deep chest and trim waist; a lean head supported by a long, arched neck; and slim but sturdy legs combine in a picture of an agile, fleet-footed athlete. Between bursts of intense pursuit, Whippets love to stretch out and relax for long hours, enjoying the role of a loving, and loved, companion."
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
    sourceUrl: "https://www.akc.org/dog-breeds/maltese/",
    sourceLabel: "American Kennel Club",
    intro: "Hello pups, today’s daily dog is the Maltese — a little white cloud with a very old passport.",
    story:
      "Maltese are affectionate toy dogs weighing less than seven pounds, covered by a long, straight, silky coat. Beneath the all-white mantle is a compact body moving with a smooth and effortless gait.\n\nThe overall picture depicts free-flowing elegance and balance. The irresistible Maltese face' with its big, dark eyes and black gumdrop nose' can conquer the most jaded sensibility."
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
    sourceUrl: "https://www.akc.org/dog-breeds/st-bernard/",
    sourceLabel: "American Kennel Club",
    intro: "From the mountain hospices, here comes the Saint Bernard.",
    story:
      "Not ranked particularly high in AKC registrations, this genial giant is nonetheless among the world's most famous and beloved breeds. The Saint's written standard abounds with phrases like \\\"very powerful,\\\" \\\"extraordinarily muscular,\\\" \\\"imposing,\\\" and \\\"massive.\\\" A male stands a minimum 27.5 inches at the shoulder; females will be smaller and more delicately built.\n\nThe huge head features a wrinkled brow, a short muzzle, and dark eyes, combining to give Saints the intelligent, friendly expression that was such a welcome sight to stranded Alpine travelers. In the year 1050, at a snowy pass within the Alps, a monk named Bernard of Menthon established a hospice to aid pilgrims journeying to Rome."
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
    sourceUrl: "https://www.akc.org/dog-breeds/australian-cattle-dog/",
    sourceLabel: "American Kennel Club",
    intro: "Coming all the way from Australian cattle country, is the Australian Cattle Dog.",
    story:
      "Standing between 17 to 20 inches at the shoulder, the Australian Cattle Dog is a sturdy, hard-muscled herder of strength and agility. The ACD is born with a white coat that turns blue-gray or red.\n\nBoth coat varieties feature distinctive mottling or specking patterns. ACDs have immense work drive and excel at hunting, chasing, and, of course, moving livestock."
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
    sourceUrl: "https://www.akc.org/dog-breeds/weimaraner/",
    sourceLabel: "American Kennel Club",
    intro: "And today we have the Weimaraner, the Grey Ghost of Weimar.",
    story:
      "Instantly recognized by a distinctive silvery-gray coat, male Weimaraners stand 25 to 27 inches at the shoulder, and females 23 to 25 inches. A properly bred Weimaraner will be solid colored, with maybe a small white spot on the chest.\n\nThe face, with its amber or blue-gray eyes framed by long velvety ears, is amiable and intelligent. Overall, the breed presents a picture of streamlined grace and balance."
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

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const next = items.slice();
  const rand = mulberry32(seed);
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = next[i]!;
    next[i] = next[j]!;
    next[j] = a;
  }
  return next;
}

function initialOf(name: string) {
  return name[0]?.toLocaleLowerCase() ?? "";
}

/** Break leftover A–Z clumps after the shuffle (same first letter in a row). */
function spreadInitials<T extends { name: string }>(items: T[]): T[] {
  const next = items.slice();
  for (let i = 1; i < next.length; i++) {
    const prev = initialOf(next[i - 1]!.name);
    if (initialOf(next[i]!.name) !== prev) continue;
    for (let j = i + 1; j < next.length; j++) {
      const cand = initialOf(next[j]!.name);
      const after = next[i + 1] ? initialOf(next[i + 1]!.name) : "";
      if (cand !== prev && cand !== after) {
        const swap = next[i]!;
        next[i] = next[j]!;
        next[j] = swap;
        break;
      }
    }
  }
  return next;
}

const extraList = extraBreeds as DailyBreed[];
const decksByYear = new Map<number, DailyBreed[]>();

/** Keep a specific breed on a calendar day without duplicating it later. */
const PINNED_DATES: Record<string, string> = {
  "2026-09-08": "great-anglo-french-tricolour-hound",
};

function dayOfYear(key: string): number {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86_400_000);
}

function pinDates(deck: DailyBreed[], year: number) {
  for (const [dateKey, breedId] of Object.entries(PINNED_DATES)) {
    if (!dateKey.startsWith(`${year}-`)) continue;
    const want = dayOfYear(dateKey) % deck.length;
    const have = deck.findIndex((b) => b.id === breedId);
    if (have < 0 || have === want) continue;
    const swap = deck[want]!;
    deck[want] = deck[have]!;
    deck[have] = swap;
  }
}

/** Core breeds stay Jan 1–N; extras are shuffled per year so days are not A–Z. */
function breedsForYear(year: number): DailyBreed[] {
  const cached = decksByYear.get(year);
  if (cached) return cached;
  const extras = spreadInitials(seededShuffle(extraList, year ^ 0x51d05));
  const deck = [...CORE_BREEDS, ...extras];
  pinDates(deck, year);
  decksByYear.set(year, deck);
  return deck;
}

export function breedForDateKey(key: string): DailyBreed {
  const year = Number(key.slice(0, 4));
  const deck = breedsForYear(Number.isFinite(year) ? year : 2026);
  return deck[dayOfYear(key) % deck.length]!;
}

export function breedForDay(now = Date.now()): DailyBreed {
  return breedForDateKey(todayDateKey(now));
}
