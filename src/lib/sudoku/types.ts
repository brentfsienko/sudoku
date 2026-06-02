import type { Difficulty } from "@/lib/game/types";

/** 81-length array, 0 = empty, 1-9 = filled. */
export type Grid = number[];

/** Compact 81-char string form ("0" or ".") used over the wire. */
export type GridString = string;

export type GeneratedPuzzle = {
  difficulty: Difficulty;
  /** 81-char puzzle string with "." for blanks. */
  puzzle: GridString;
  /** 81-char fully solved string. */
  solution: GridString;
  /** Number of pre-filled clues. */
  clues: number;
};
