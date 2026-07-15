import type { Difficulty } from "@/lib/game/types";
import type { GeneratedPuzzle } from "@/lib/sudoku/types";
import { generatePuzzle } from "@/lib/sudoku/generator";
import { isSoloFinished } from "@/lib/game/finishedSolo";

/**
 * Returns the current PST/PDT calendar date as "YYYY-MM-DD".
 * Uses Intl.DateTimeFormat so it respects Daylight Saving Time.
 */
export function getPSTDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * Maps day-of-week to difficulty.
 * Mon=easy, Tue=easy, Wed=medium, Thu=medium, Fri=hard, Sat=hard, Sun=hard.
 * Max difficulty is "hard" (no expert/master for daily).
 */
export function dayDifficulty(dateStr: string): Difficulty {
  // dateStr: "YYYY-MM-DD"
  const date = new Date(`${dateStr}T12:00:00-08:00`); // noon PST to avoid DST edge cases
  const dow = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Sun=0 -> hard, Mon=1 -> easy, Tue=2 -> easy, Wed=3 -> medium, Thu=4 -> medium, Fri=5 -> hard, Sat=6 -> hard
  if (dow === 1 || dow === 2) return "easy";
  if (dow === 3 || dow === 4) return "medium";
  return "hard";
}

/** Seeded PRNG (mulberry32). Returns a function that returns values in [0, 1). */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Converts a date string "YYYY-MM-DD" to a numeric seed. */
function dateToSeed(dateStr: string): number {
  return dateStr
    .split("")
    .filter((c) => c !== "-")
    .reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
}

/**
 * Deterministically generates the daily puzzle for a given PST date.
 * Same date always yields the same puzzle for all users.
 */
export function getDailyPuzzle(dateStr?: string): GeneratedPuzzle {
  const date = dateStr ?? getPSTDate();
  const difficulty = dayDifficulty(date);
  const seed = dateToSeed(date);
  const rng = mulberry32(seed);
  return generatePuzzle(difficulty, rng);
}

/** The active solo ID used for the daily game on a given date. */
export function getDailyActiveId(dateStr?: string): string {
  return `daily-${dateStr ?? getPSTDate()}`;
}

/** Returns true if today's daily puzzle has already been completed. */
export function isTodayComplete(): boolean {
  return isSoloFinished(getDailyActiveId());
}
