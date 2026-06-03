"use client";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FactTopic } from "./facts";

const USER_GUESSES_KEY = "floof-trivia-user";
const LOCAL_FACT_PREFIX = "floof-trivia-fact-";

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

function localFactKey(factId: string): string {
  return `${LOCAL_FACT_PREFIX}${factId}`;
}

function loadLocalFactStats(factId: string): GlobalTriviaStats {
  if (typeof window === "undefined") {
    return { correct: 0, wrong: 0 };
  }
  try {
    const raw = window.localStorage.getItem(localFactKey(factId));
    if (raw) return JSON.parse(raw) as GlobalTriviaStats;
  } catch {
    // ignore
  }
  return { correct: 0, wrong: 0 };
}

function saveLocalFactStats(factId: string, stats: GlobalTriviaStats) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localFactKey(factId), JSON.stringify(stats));
}

function mergeStats(
  local: GlobalTriviaStats,
  remote: GlobalTriviaStats,
): GlobalTriviaStats {
  const localTotal = local.correct + local.wrong;
  const remoteTotal = remote.correct + remote.wrong;
  if (localTotal > remoteTotal) return local;
  if (remoteTotal > localTotal) return remote;
  return {
    correct: Math.max(local.correct, remote.correct),
    wrong: Math.max(local.wrong, remote.wrong),
  };
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

export async function fetchFactStats(
  factId: string,
): Promise<GlobalTriviaStats> {
  const local = loadLocalFactStats(factId);
  if (!isSupabaseConfigured) return local;

  try {
    const sb = getSupabase();
    if (!sb) return local;
    const { data, error } = await sb
      .from("trivia_fact_stats")
      .select("correct, wrong")
      .eq("fact_id", factId)
      .maybeSingle();
    if (error || !data) return local;
    const remote: GlobalTriviaStats = {
      correct: Number(data.correct) || 0,
      wrong: Number(data.wrong) || 0,
    };
    const merged = mergeStats(local, remote);
    saveLocalFactStats(factId, merged);
    return merged;
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

  const local = loadLocalFactStats(factId);
  const next: GlobalTriviaStats = {
    correct: local.correct + (wasCorrect ? 1 : 0),
    wrong: local.wrong + (wasCorrect ? 0 : 1),
  };
  saveLocalFactStats(factId, next);

  if (isSupabaseConfigured) {
    try {
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.rpc("record_trivia_guess", {
          p_fact_id: factId,
          was_correct: wasCorrect,
        });
        if (!error) {
          const remote = await fetchFactStats(factId);
          return remote;
        }
      }
    } catch {
      // fall through to local increment
    }
  }

  return next;
}

export function globalPercentages(stats: GlobalTriviaStats): {
  correctPct: number;
  wrongPct: number;
  total: number;
} | null {
  const total = stats.correct + stats.wrong;
  if (total === 0) return null;
  const correctPct = Math.round((stats.correct / total) * 100);
  return { correctPct, wrongPct: 100 - correctPct, total };
}
