"use client";

import {
  emptyUserData,
  normalizeUserData,
  sumHistorySquares,
  type Profile,
  type UserData,
} from "./types";

const DATA_KEY = "floof-sudoku-data";
const LEGACY_STATS_KEY = "floof-sudoku-stats";
const LEGACY_PROFILE_KEY = "floof-sudoku-profile";

/** One-time migration from the old separate stats/profile keys. */
function migrateLegacy(): UserData | null {
  if (typeof window === "undefined") return null;
  try {
    const rawStats = window.localStorage.getItem(LEGACY_STATS_KEY);
    const rawProfile = window.localStorage.getItem(LEGACY_PROFILE_KEY);
    if (!rawStats && !rawProfile) return null;

    const data = emptyUserData();
    if (rawProfile) {
      const p = JSON.parse(rawProfile) as Partial<Profile>;
      data.profile = { ...data.profile, ...p };
    }
    if (rawStats) {
      const s = JSON.parse(rawStats) as Record<string, unknown>;
      data.solo = {
        ...data.solo,
        played: Number(s.gamesPlayed) || 0,
        won: Number(s.gamesWon) || 0,
        bestScore: Number(s.bestScore) || 0,
        totalScore: Number(s.totalScore) || 0,
        totalSolveSeconds: Number(s.totalSolveSeconds) || 0,
        fastestSolveSeconds:
          s.fastestSolveSeconds != null ? Number(s.fastestSolveSeconds) : null,
        perfectGames: Number(s.perfectGames) || 0,
        streak: Number(s.streak) || 0,
        bestStreak: Number(s.bestStreak) || 0,
        lastPlayedDate: (s.lastPlayedDate as string) ?? null,
        bestTimeByDifficulty:
          (s.bestTimeByDifficulty as UserData["solo"]["bestTimeByDifficulty"]) ?? {},
        playsByDifficulty:
          (s.playsByDifficulty as UserData["solo"]["playsByDifficulty"]) ?? {},
      };
    }
    return data;
  } catch {
    return null;
  }
}

export function loadLocal(): UserData {
  if (typeof window === "undefined") return emptyUserData();
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserData>;
      const normalized = normalizeUserData(parsed);
      const needsRepair =
        sumHistorySquares(parsed.history) < sumHistorySquares(normalized.history) ||
        JSON.stringify(parsed.history ?? []) !== JSON.stringify(normalized.history) ||
        JSON.stringify(parsed.multi?.opponents ?? {}) !==
          JSON.stringify(normalized.multi.opponents);
      if (needsRepair) {
        saveLocal(normalized);
      }
      return normalized;
    }
    const migrated = migrateLegacy();
    if (migrated) {
      saveLocal(migrated);
      return migrated;
    }
  } catch {
    // ignore
  }
  return emptyUserData();
}

export function saveLocal(data: UserData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
    // Keep the lightweight profile cache used by game presence in sync.
    window.localStorage.setItem(
      LEGACY_PROFILE_KEY,
      JSON.stringify(data.profile),
    );
  } catch {
    // ignore quota/availability
  }
}

export function resetLocal(): UserData {
  const fresh = loadLocalProfileOnly();
  saveLocal(fresh);
  return fresh;
}

/** Reset stats but keep the current profile. */
function loadLocalProfileOnly(): UserData {
  const current = loadLocal();
  return emptyUserData(current.profile);
}
