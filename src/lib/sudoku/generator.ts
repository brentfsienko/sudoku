import type { Difficulty } from "@/lib/game/types";
import type { GeneratedPuzzle, Grid, GridString } from "./types";
import { countSolutions, fillSolution } from "./solver";

/** Target number of remaining clues per difficulty (lower = harder). */
const CLUE_TARGETS: Record<Difficulty, number> = {
  easy: 42,
  medium: 35,
  hard: 30,
  expert: 26,
  master: 23,
};

export function gridToString(grid: Grid): GridString {
  return grid.map((v) => (v === 0 ? "." : String(v))).join("");
}

export function stringToGrid(str: GridString): Grid {
  return str.split("").map((c) => (c === "." || c === "0" ? 0 : Number(c)));
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generates a puzzle with a unique solution for the given difficulty.
 * Strategy: build a full solution, then greedily remove clues (in pairs by
 * 180-degree symmetry) as long as the remaining puzzle stays uniquely solvable
 * and we have not removed past the clue target.
 */
export function generatePuzzle(
  difficulty: Difficulty,
  rng: () => number = Math.random,
): GeneratedPuzzle {
  const solution: Grid = new Array(81).fill(0);
  fillSolution(solution, rng);

  const puzzle: Grid = [...solution];
  const target = CLUE_TARGETS[difficulty];

  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );

  let clues = 81;
  for (const pos of positions) {
    if (clues <= target) break;
    const mirror = 80 - pos;

    const toRemove = pos === mirror ? [pos] : [pos, mirror];
    if (toRemove.some((p) => puzzle[p] === 0)) continue;

    const backup = toRemove.map((p) => puzzle[p]);
    toRemove.forEach((p) => (puzzle[p] = 0));

    // Keep removal only if the puzzle remains uniquely solvable.
    if (countSolutions([...puzzle], 2) === 1) {
      clues -= toRemove.length;
    } else {
      toRemove.forEach((p, i) => (puzzle[p] = backup[i]));
    }
  }

  return {
    difficulty,
    puzzle: gridToString(puzzle),
    solution: gridToString(solution),
    clues,
  };
}
