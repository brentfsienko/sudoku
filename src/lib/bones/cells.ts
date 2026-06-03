import type { Difficulty } from "@/lib/game/types";
import { isGiven } from "@/lib/game/engine";
import { BONE_CELLS_BY_DIFFICULTY } from "./config";

/** Deterministic RNG from puzzle string. */
function hashSeed(puzzle: string, difficulty: Difficulty): number {
  let h = difficulty.length * 31;
  for (let i = 0; i < puzzle.length; i++) {
    h = (h * 31 + puzzle.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Indices of cells that grant a bone when filled correctly (non-given cells only). */
export function pickBoneCellIndices(
  puzzle: string,
  difficulty: Difficulty,
): number[] {
  const count = BONE_CELLS_BY_DIFFICULTY[difficulty];
  const rng = mulberry32(hashSeed(puzzle, difficulty));
  const candidates: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (isGiven(puzzle, i)) continue;
    candidates.push(i);
  }
  const picked: number[] = [];
  const pool = [...candidates];
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}
