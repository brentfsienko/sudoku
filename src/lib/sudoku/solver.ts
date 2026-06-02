import type { Grid } from "./types";

/** Returns the indices (0-80) of cells in the same row, col, and box. */
function peersOf(index: number): number[] {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const peers = new Set<number>();

  for (let c = 0; c < 9; c++) peers.add(row * 9 + c);
  for (let r = 0; r < 9; r++) peers.add(r * 9 + col);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      peers.add((boxRow + r) * 9 + (boxCol + c));
    }
  }
  peers.delete(index);
  return [...peers];
}

const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => peersOf(i));

export function isValidPlacement(
  grid: Grid,
  index: number,
  value: number,
): boolean {
  for (const peer of PEERS[index]) {
    if (grid[peer] === value) return false;
  }
  return true;
}

/** Finds the empty cell with the fewest candidates (MRV heuristic). */
function findBestCell(grid: Grid): { index: number; candidates: number[] } | null {
  let best: { index: number; candidates: number[] } | null = null;
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const used = new Set<number>();
    for (const peer of PEERS[i]) {
      if (grid[peer] !== 0) used.add(grid[peer]);
    }
    const candidates: number[] = [];
    for (let v = 1; v <= 9; v++) if (!used.has(v)) candidates.push(v);
    if (candidates.length === 0) return { index: i, candidates };
    if (!best || candidates.length < best.candidates.length) {
      best = { index: i, candidates };
      if (candidates.length === 1) break;
    }
  }
  return best;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fills the grid in place with a valid random complete solution. */
export function fillSolution(grid: Grid, rng: () => number): boolean {
  const cell = findBestCell(grid);
  if (!cell) return true; // solved
  if (cell.candidates.length === 0) return false; // dead end

  for (const value of shuffle(cell.candidates, rng)) {
    grid[cell.index] = value;
    if (fillSolution(grid, rng)) return true;
    grid[cell.index] = 0;
  }
  return false;
}

/**
 * Counts solutions up to `limit`. Used to verify puzzle uniqueness.
 * Returns as soon as the count reaches `limit`.
 */
export function countSolutions(grid: Grid, limit = 2): number {
  const cell = findBestCell(grid);
  if (!cell) return 1;
  if (cell.candidates.length === 0) return 0;

  let count = 0;
  for (const value of cell.candidates) {
    grid[cell.index] = value;
    count += countSolutions(grid, limit - count);
    grid[cell.index] = 0;
    if (count >= limit) break;
  }
  return count;
}

/** Solves a puzzle (returns the first solution found) or null. */
export function solve(grid: Grid): Grid | null {
  const work = [...grid];
  return fillSolution(work, Math.random) ? work : null;
}
