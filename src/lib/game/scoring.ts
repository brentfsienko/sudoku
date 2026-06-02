import type { Difficulty } from "./types";

/** Base points awarded for completing a puzzle, by difficulty. */
const BASE_POINTS: Record<Difficulty, number> = {
  easy: 1000,
  medium: 2000,
  hard: 3500,
  expert: 5500,
  master: 8000,
};

const POINTS_PER_CORRECT = 20;
const MISTAKE_PENALTY = 60;
const HINT_PENALTY = 100;

/** Live, in-progress score shown on the board. */
export function liveScore(opts: {
  difficulty: Difficulty;
  correctPlaced: number;
  mistakes: number;
  hintsUsed: number;
}): number {
  const raw =
    opts.correctPlaced * POINTS_PER_CORRECT -
    opts.mistakes * MISTAKE_PENALTY -
    opts.hintsUsed * HINT_PENALTY;
  return Math.max(0, raw);
}

/** Final score including a time bonus that decays as the solve takes longer. */
export function finalScore(opts: {
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
  hintsUsed: number;
}): number {
  const base = BASE_POINTS[opts.difficulty];
  // Time bonus: full base if solved in <3min, decaying to ~0 over ~20min.
  const timeBonus = Math.max(
    0,
    Math.round(base * (1 - Math.min(opts.elapsedSeconds, 1200) / 1200)),
  );
  const penalties =
    opts.mistakes * MISTAKE_PENALTY + opts.hintsUsed * HINT_PENALTY;
  return Math.max(0, base + timeBonus - penalties);
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
}
