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

export type DogId = StandardDogId | ExclusiveDogId;

export type Dog = {
  id: DogId;
  breed: string;
  image: string;
  exclusive?: boolean;
};

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

export const DOGS: Dog[] = [...STANDARD_DOGS, ...EXCLUSIVE_DOGS];

export const DOG_IDS: DogId[] = DOGS.map((d) => d.id);

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

/** Profile dog for a user, including fixed usernames and party → pug migration. */
export function dogIdForUsername(
  username: string,
  storedDogId?: string | null,
): DogId {
  const u = normalizeUsername(username);
  const override = USERNAME_DOG_OVERRIDES[u];
  if (override) return override;
  const id = storedDogId?.trim() || "golden";
  if (id === "party") return "pug";
  return resolveDogId(id, { username: u });
}

export function dogById(id: string | null | undefined): Dog {
  const resolved = resolveDogId(id);
  return DOGS.find((d) => d.id === resolved) ?? STANDARD_DOGS[0];
}

export function isExclusiveDogId(id: string): id is ExclusiveDogId {
  return EXCLUSIVE_DOGS.some((d) => d.id === id);
}

export function resolveDogId(
  dogId: string | null | undefined,
  opts?: { username?: string },
): DogId {
  const username = normalizeUsername(opts?.username ?? "");
  const override = USERNAME_DOG_OVERRIDES[username];
  if (override) return override;

  let id = (dogId?.trim() || "golden") as DogId;
  if (LEGACY_DOG_MAP[id]) id = LEGACY_DOG_MAP[id];

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
