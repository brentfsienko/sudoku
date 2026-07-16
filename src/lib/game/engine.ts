import type { CellEntry } from "./types";
import { stringToGrid } from "@/lib/sudoku/generator";

export const MAX_MISTAKES = 3;
export const MAX_HINTS = 3;

export type BoardCells = Record<number, CellEntry>;

export function rowOf(index: number): number {
  return Math.floor(index / 9);
}
export function colOf(index: number): number {
  return index % 9;
}
export function boxOf(index: number): number {
  return Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3);
}

function computeRelated(index: number): number[] {
  const r = rowOf(index);
  const c = colOf(index);
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  const set = new Set<number>();
  for (let i = 0; i < 9; i++) {
    set.add(r * 9 + i);
    set.add(i * 9 + c);
  }
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      set.add((br + dr) * 9 + (bc + dc));
    }
  }
  set.delete(index);
  return [...set];
}

const RELATED: number[][] = Array.from({ length: 81 }, (_, i) =>
  computeRelated(i),
);

/** Indices sharing a row/col/box with `index` (for highlighting). */
export function relatedCells(index: number): number[] {
  return RELATED[index];
}

export function isGiven(puzzle: string, index: number): boolean {
  const ch = puzzle[index];
  return ch !== "." && ch !== "0";
}

/** The correct digit (1-9) for a cell from the solution string. */
export function solutionDigit(solution: string, index: number): number {
  return Number(solution[index]);
}

/** The visible value of a cell, factoring in givens + user entries. */
export function valueAt(
  puzzle: string,
  cells: BoardCells,
  index: number,
): number | null {
  if (isGiven(puzzle, index)) return Number(puzzle[index]);
  return cells[index]?.value ?? null;
}

/** Count of each digit (1-9) already correctly placed on the board. */
export function digitCounts(
  puzzle: string,
  solution: string,
  cells: BoardCells,
): Record<number, number> {
  const counts: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
  };
  for (let i = 0; i < 81; i++) {
    const v = valueAt(puzzle, cells, i);
    if (v && v === solutionDigit(solution, i)) counts[v]++;
  }
  return counts;
}

/** True once every cell holds its correct value. */
export function isSolved(
  puzzle: string,
  solution: string,
  cells: BoardCells,
): boolean {
  for (let i = 0; i < 81; i++) {
    if (valueAt(puzzle, cells, i) !== solutionDigit(solution, i)) return false;
  }
  return true;
}

/** Number of non-given cells left empty or wrong. */
export function remainingCells(
  puzzle: string,
  solution: string,
  cells: BoardCells,
): number {
  let remaining = 0;
  for (let i = 0; i < 81; i++) {
    if (isGiven(puzzle, i)) continue;
    if (valueAt(puzzle, cells, i) !== solutionDigit(solution, i)) remaining++;
  }
  return remaining;
}

/** Picks an empty (or wrong) non-given cell to reveal for a hint. */
export function pickHintCell(
  puzzle: string,
  solution: string,
  cells: BoardCells,
  preferred: number | null,
): number | null {
  const isWrong = (i: number) =>
    !isGiven(puzzle, i) &&
    valueAt(puzzle, cells, i) !== solutionDigit(solution, i);

  if (preferred != null && isWrong(preferred)) return preferred;
  for (let i = 0; i < 81; i++) {
    if (isWrong(i)) return i;
  }
  return null;
}

export function emptyCells(): BoardCells {
  return {};
}

/** Correctly-placed cell counts attributed to each player (excludes givens). */
export function cellContributions(
  puzzle: string,
  solution: string,
  cells: BoardCells,
): Record<string, number> & { total: number } {
  const result: Record<string, number> & { total: number } = { total: 0 };
  for (let i = 0; i < 81; i++) {
    if (isGiven(puzzle, i)) continue;
    const entry = cells[i];
    if (!entry || !entry.correct || entry.value == null) continue;
    if (entry.value !== solutionDigit(solution, i)) continue;
    result.total++;
    if (entry.owner) result[entry.owner] = (result[entry.owner] ?? 0) + 1;
  }
  return result;
}

/** Convenience: parse a puzzle string to a numeric grid. */
export function parseGrid(str: string): number[] {
  return stringToGrid(str);
}
