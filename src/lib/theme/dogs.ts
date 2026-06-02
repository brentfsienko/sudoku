import type { PlayerRole } from "@/lib/game/types";

export type DogId =
  | "golden"
  | "corgi"
  | "husky"
  | "shiba"
  | "poodle"
  | "dalmatian"
  | "pug"
  | "beagle";

export type Dog = {
  id: DogId;
  breed: string;
  /** Main fur color. */
  fur: string;
  /** Ear / accent color. */
  ear: string;
  /** Muzzle color. */
  muzzle: string;
  /** True for spotted breeds. */
  spots?: boolean;
};

export const DOGS: Dog[] = [
  { id: "golden", breed: "Golden Retriever", fur: "#f4c87a", ear: "#e0a956", muzzle: "#fbe7c2" },
  { id: "corgi", breed: "Corgi", fur: "#f0a868", ear: "#d98948", muzzle: "#fdf0e1" },
  { id: "husky", breed: "Husky", fur: "#b9c6d4", ear: "#6b7686", muzzle: "#f4f7fb" },
  { id: "shiba", breed: "Shiba Inu", fur: "#e8a25a", ear: "#cf8038", muzzle: "#fbeede" },
  { id: "poodle", breed: "Poodle", fur: "#e8d7c6", ear: "#cdb8a3", muzzle: "#f7eee5" },
  { id: "dalmatian", breed: "Dalmatian", fur: "#f4f1ee", ear: "#2f2f2f", muzzle: "#ffffff", spots: true },
  { id: "pug", breed: "Pug", fur: "#e6c98f", ear: "#5b4a3a", muzzle: "#5b4a3a" },
  { id: "beagle", breed: "Beagle", fur: "#e3b787", ear: "#9a6a3c", muzzle: "#fbeede" },
];

export const DOG_IDS: DogId[] = DOGS.map((d) => d.id);

export function dogById(id: string | null | undefined): Dog {
  return DOGS.find((d) => d.id === id) ?? DOGS[0];
}

export function randomDogId(): DogId {
  return DOG_IDS[Math.floor(Math.random() * DOG_IDS.length)];
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
  /** CSS color. */
  hex: string;
  /** Soft background tint. */
  soft: string;
  label: string;
};

export const PLAYER_COLORS: Record<PlayerRole, PlayerColor> = {
  "player-1": { hex: "#3b82f6", soft: "#dbeafe", label: "Blue" },
  "player-2": { hex: "#ef6f6c", soft: "#fcdcda", label: "Coral" },
};

export function playerColor(role: PlayerRole | null | undefined): PlayerColor {
  return role ? PLAYER_COLORS[role] : PLAYER_COLORS["player-1"];
}
