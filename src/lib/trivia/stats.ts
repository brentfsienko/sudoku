"use client";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FactTopic } from "./facts";

const USER_GUESSES_KEY = "floof-trivia-user";
const LOCAL_GLOBAL_KEY = "floof-trivia-global";

/** Seed so first-time players see plausible community stats. */
const SEED_CORRECT = 1247;
const SEED_WRONG = 892;

export type UserGuess = {
  factId: string;
  guess: FactTopic;
  correct: boolean;
  at: number;
};

export type GlobalTriviaStats = {
  correct: number;
  wrong: number;
};

function loadLocalGlobal(): GlobalTriviaStats {
  if (typeof window === "undefined") {
    return { correct: SEED_CORRECT, wrong: SEED_WRONG };
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_GLOBAL_KEY);
    if (raw) return JSON.parse(raw) as GlobalTriviaStats;
  } catch {
    // ignore
  }
  return { correct: SEED_CORRECT, wrong: SEED_WRONG };
}

function saveLocalGlobal(stats: GlobalTriviaStats) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_GLOBAL_KEY, JSON.stringify(stats));
}

export function loadUserGuesses(): Record<string, UserGuess> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(USER_GUESSES_KEY);
    if (raw) return JSON.parse(raw) as Record<string, UserGuess>;
  } catch {
    // ignore
  }
  return {};
}

export function saveUserGuess(guess: UserGuess) {
  if (typeof window === "undefined") return;
  const all = loadUserGuesses();
  all[guess.factId] = guess;
  window.localStorage.setItem(USER_GUESSES_KEY, JSON.stringify(all));
}

export async function fetchGlobalStats(): Promise<GlobalTriviaStats> {
  const local = loadLocalGlobal();
  if (!isSupabaseConfigured) return local;

  try {
    const sb = getSupabase();
    if (!sb) return local;
    const { data, error } = await sb
      .from("trivia_stats")
      .select("correct, wrong")
      .eq("id", "global")
      .maybeSingle();
    if (error || !data) return local;
    return {
      correct: Number(data.correct) || local.correct,
      wrong: Number(data.wrong) || local.wrong,
    };
  } catch {
    return local;
  }
}

export async function recordGuess(
  factId: string,
  guess: FactTopic,
  wasCorrect: boolean,
): Promise<GlobalTriviaStats> {
  saveUserGuess({ factId, guess, correct: wasCorrect, at: Date.now() });

  const local = loadLocalGlobal();
  const next: GlobalTriviaStats = {
    correct: local.correct + (wasCorrect ? 1 : 0),
    wrong: local.wrong + (wasCorrect ? 0 : 1),
  };
  saveLocalGlobal(next);

  if (isSupabaseConfigured) {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.rpc("record_trivia_guess", { was_correct: wasCorrect });
      }
    } catch {
      // local fallback already updated
    }
    const remote = await fetchGlobalStats();
    return remote;
  }

  return next;
}

export function globalPercentages(stats: GlobalTriviaStats): {
  correctPct: number;
  wrongPct: number;
} {
  const total = stats.correct + stats.wrong;
  if (total === 0) return { correctPct: 50, wrongPct: 50 };
  const correctPct = Math.round((stats.correct / total) * 100);
  return { correctPct, wrongPct: 100 - correctPct };
}
