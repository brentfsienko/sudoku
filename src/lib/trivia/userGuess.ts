"use client";

import { loadUserData } from "@/lib/stats/store";
import type { TriviaUserGuess } from "@/lib/stats/types";
import type { FactTopic } from "./facts";
import { loadUserGuesses, saveUserGuess } from "./stats";

export type UserGuess = TriviaUserGuess;

function normalizeEntry(raw: unknown, factId: string): UserGuess | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<UserGuess>;
  const guess = entry.guess;
  if (guess !== "dog" && guess !== "sudoku") return null;
  return {
    factId: entry.factId ?? factId,
    guess,
    correct: Boolean(entry.correct),
    at: typeof entry.at === "number" ? entry.at : 0,
  };
}

export function guessTopicLabel(guess: FactTopic): string {
  return guess === "dog" ? "Dog" : "Sudoku";
}

/** Load today's guess from local cache and synced account data. */
export async function loadGuessForFact(factId: string): Promise<UserGuess | null> {
  const fromLocal = normalizeEntry(loadUserGuesses()[factId], factId);
  if (fromLocal) return fromLocal;

  try {
    const data = await loadUserData();
    const fromAccount = normalizeEntry(data.triviaGuesses?.[factId], factId);
    if (fromAccount) {
      saveUserGuess(fromAccount);
      return fromAccount;
    }
  } catch {
    // offline / storage blocked
  }

  return null;
}
