import type { Difficulty } from "@/lib/game/types";
import type { ExclusiveDogId } from "@/lib/theme/dogs";

export const BONE_IMAGE = "/bone.png";

/** Bones awarded for winning a game (solo, co-op solve, or versus win). */
export const GAME_WIN_BONE_BONUS = 5;

/** Bone cost to unlock each exclusive profile pup. */
export const EXCLUSIVE_BONE_COSTS: Record<ExclusiveDogId, number> = {
  royal: 50,
  hero: 100,
  party: 150,
  galaxy: 250,
};

/** How many hidden bone bonuses are placed on the board by difficulty. */
export const BONE_CELLS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 5,
  expert: 7,
  master: 9,
};
