"use client";

import type { Difficulty } from "@/lib/game/types";

const KEY = "floof-sudoku-stats";

export type LocalStats = {
  bestScore: number;
  streak: number;
  lastPlayedDate: string | null;
  gamesPlayed: number;
  gamesWon: number;
  bestTimeByDifficulty: Partial<Record<Difficulty, number>>;
};

const EMPTY: LocalStats = {
  bestScore: 0,
  streak: 0,
  lastPlayedDate: null,
  gamesPlayed: 0,
  gamesWon: 0,
  bestTimeByDifficulty: {},
};

export function loadStats(): LocalStats {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<LocalStats>) };
  } catch {
    return { ...EMPTY };
  }
}

function save(stats: LocalStats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // ignore quota/availability errors
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10);
}

/** Records the result of a finished solo game and returns updated stats. */
export function recordGame(result: {
  won: boolean;
  score: number;
  difficulty: Difficulty;
  elapsedSeconds: number;
}): LocalStats {
  const stats = loadStats();
  const today = todayKey();

  if (stats.lastPlayedDate !== today) {
    if (stats.lastPlayedDate && isYesterday(stats.lastPlayedDate)) {
      stats.streak += 1;
    } else {
      stats.streak = 1;
    }
    stats.lastPlayedDate = today;
  } else if (stats.streak === 0) {
    stats.streak = 1;
  }

  stats.gamesPlayed += 1;
  if (result.won) {
    stats.gamesWon += 1;
    stats.bestScore = Math.max(stats.bestScore, result.score);
    const prev = stats.bestTimeByDifficulty[result.difficulty];
    if (prev == null || result.elapsedSeconds < prev) {
      stats.bestTimeByDifficulty[result.difficulty] = result.elapsedSeconds;
    }
  }

  save(stats);
  return stats;
}
