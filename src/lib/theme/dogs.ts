import type { PlayerRole } from "@/lib/game/types";
import { normalizeUsername } from "@/lib/friends/username";

export type StandardDogId =
  | "golden"
  | "shiba"
  | "pug"
  | "beagle"
  | "poodle"
  | "pomeranian"
  | "husky"
  | "corgi";

export type ExclusiveDogId = "royal" | "hero" | "galaxy" | "party";

/** Owner-only pup (not sold in the bone shop). */
export type BeeDogId = "bee";

export type DogId = StandardDogId | ExclusiveDogId | BeeDogId;

export type Dog = {
  id: DogId;
  breed: string;
  image: string;
  exclusive?: boolean;
};

export const HONEY_EMAIL = "brentfsienko@gmail.com";

export const STANDARD_DOGS: Dog[] = [
  { id: "golden", breed: "Golden Retriever", image: "/dogs/golden.png" },
  { id: "shiba", breed: "Shiba Inu", image: "/dogs/shiba.png" },
  { id: "pug", breed: "Pug", image: "/dogs/pug.png" },
  { id: "beagle", breed: "Beagle", image: "/dogs/beagle.png" },
  { id: "poodle", breed: "Poodle", image: "/dogs/poodle.png" },
  { id: "pomeranian", breed: "Pomeranian", image: "/dogs/pomeranian.png" },
  { id: "husky", breed: "Husky", image: "/dogs/husky.png" },
  { id: "corgi", breed: "Corgi", image: "/dogs/corgi.png" },
];

/** Sorted by bone cost (low → high) for the profile picker row. */
export const EXCLUSIVE_DOGS: Dog[] = [
  { id: "royal", breed: "Royal Pup", image: "/dogs/royal.png", exclusive: true },
  { id: "hero", breed: "Hero Hound", image: "/dogs/hero.png", exclusive: true },
  { id: "party", breed: "Party Pup", image: "/dogs/party.png", exclusive: true },
  {
    id: "galaxy",
    breed: "Galaxy Pup",
    image: "/dogs/galaxy.png",
    exclusive: true,
  },
];

export const BEE_DOG: Dog = {
  id: "bee",
  breed: "Bee Pup",
  image: "/dogs/bee.png",
};

export const DOGS: Dog[] = [...STANDARD_DOGS, ...EXCLUSIVE_DOGS];

export const DOG_IDS: DogId[] = [...DOGS.map((d) => d.id), "bee"];

export const STANDARD_DOG_IDS = STANDARD_DOGS.map((d) => d.id) as StandardDogId[];

/** Maps retired SVG-era ids to pixel profile ids. */
const LEGACY_DOG_MAP: Record<string, DogId> = {
  dalmatian: "party",
};

/** Friends who always use a specific profile dog. */
const USERNAME_DOG_OVERRIDES: Record<string, DogId> = {
  j999: "pomeranian",
  milksfavoritecookie: "pug",
  rimboy: "pug",
};

export function isHoneyUser(opts?: {
  username?: string;
  email?: string | null;
}): boolean {
  const e = opts?.email?.trim().toLowerCase();
  if (e === HONEY_EMAIL) return true;
  return normalizeUsername(opts?.username ?? "") === "honey";
}

/** Only honey / brentfsienko@gmail.com may equip or pick the bee pup. */
export const canUseBeePup = isHoneyUser;

export function isBeeDogId(id: string): id is BeeDogId {
  return id === "bee";
}

function usernameDogOverride(username: string): DogId | null {
  return USERNAME_DOG_OVERRIDES[normalizeUsername(username)] ?? null;
}

/** Default pup when none is stored yet. */
export function defaultProfileDogId(opts?: {
  username?: string;
  email?: string | null;
}): DogId {
  if (isHoneyUser(opts)) return "bee";
  return "golden";
}

/** Profile dog for a user, including fixed usernames and party → pug migration. */
export function dogIdForUsername(
  username: string,
  storedDogId?: string | null,
  email?: string | null,
): DogId {
  const u = normalizeUsername(username);
  const override = usernameDogOverride(u);
  if (override) return override;
  const id = storedDogId?.trim() || "golden";
  if (id === "party") return "pug";
  if (id === "bee") {
    return canUseBeePup({ username: u, email }) ? "bee" : "golden";
  }
  return resolveDogId(id, { username: u, email });
}

export function dogById(id: string | null | undefined): Dog {
  if (id === "bee") return BEE_DOG;
  const resolved = resolveDogId(id);
  return DOGS.find((d) => d.id === resolved) ?? STANDARD_DOGS[0];
}

export function isExclusiveDogId(id: string): id is ExclusiveDogId {
  return EXCLUSIVE_DOGS.some((d) => d.id === id);
}

export function resolveDogId(
  dogId: string | null | undefined,
  opts?: { username?: string; email?: string | null },
): DogId {
  const override = usernameDogOverride(opts?.username ?? "");
  if (override) return override;

  let id = (dogId?.trim() || "golden") as DogId;
  if (LEGACY_DOG_MAP[id]) id = LEGACY_DOG_MAP[id];

  if (id === "bee") {
    return canUseBeePup(opts) ? "bee" : "golden";
  }

  if (!DOG_IDS.includes(id)) return "golden";

  return id;
}

export function randomDogId(): StandardDogId {
  return STANDARD_DOG_IDS[
    Math.floor(Math.random() * STANDARD_DOG_IDS.length)
  ];
}

const DOG_NAMES = [
  "Biscuit",
  "Mochi",
  "Waffles",
  "Pepper",
  "Cookie",
  "Marshmallow",
  "Noodle",
  "Pumpkin",
  "Bean",
  "Maple",
  "Buddy",
  "Cocoa",
  "Pretzel",
  "Sprout",
  "Taco",
  "Olive",
];

export function randomDogName(): string {
  return DOG_NAMES[Math.floor(Math.random() * DOG_NAMES.length)];
}

export type PlayerColor = {
  hex: string;
  soft: string;
  label: string;
};

export const PLAYER_COLORS: Record<PlayerRole, PlayerColor> = {
  "player-1": { hex: "#1d6fd8", soft: "#dbeafe", label: "Blue" },
  "player-2": { hex: "#e85d04", soft: "#ffedd5", label: "Orange" },
};

export function playerColor(role: PlayerRole | null | undefined): PlayerColor {
  return role ? PLAYER_COLORS[role] : PLAYER_COLORS["player-1"];
}
