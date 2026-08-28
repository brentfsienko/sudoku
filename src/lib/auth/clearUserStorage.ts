"use client";

/**
 * Clears *unscoped* (pre-account-split) user caches so a guest session
 * never shows the previous account. Keys namespaced with `:${userId}` are
 * left alone so switching accounts on this device keeps each cache intact.
 *
 * Device-level preferences are not touched:
 *   sudogku-install-coach-v3:*   — install coach seen, per platform
 *   sudogku.greetingIntroAmSeen
 *   sudogku.greetingIntroPmSeen
 *   floof-auth-intro-done
 */

const UNSCOPED_FIXED = [
  "floof-sudoku-profile",
  "floof-sudoku-data",
  "floof-sudoku-stats",
  "floof-active-solos",
  "floof-active-solo",
  "sudogku-finished-solo-ids",
  "sudogku-coachmark-step",
  "floof-trivia-user",
];

const DAILY_UNSCOPED = /^sudogku-daily-result-\d{4}-\d{2}-\d{2}$/;

export function clearUnscopedUserStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of UNSCOPED_FIXED) {
      localStorage.removeItem(key);
    }

    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && DAILY_UNSCOPED.test(key)) toRemove.push(key);
    }
    for (const key of toRemove) localStorage.removeItem(key);
  } catch {
    // Ignore private-mode / quota errors
  }
}

/** @deprecated use clearUnscopedUserStorage */
export const clearUserStorage = clearUnscopedUserStorage;
