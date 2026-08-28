"use client";

/**
 * Wipes all user-specific localStorage so that switching accounts
 * (sign-out / sign-in) never shows one account's cached data to another.
 *
 * Keys intentionally NOT cleared (device-level preferences):
 *   sudogku-install-coach-v3:*   — install coach seen, per platform
 *   sudogku.greetingIntroAmSeen  — first-time greeting copy consumed
 *   sudogku.greetingIntroPmSeen
 *   sudogku.greetingDismissedHalf
 *   floof-auth-intro-done        — auth intro seen
 */
export function clearUserStorage(): void {
  if (typeof window === "undefined") return;
  try {
    // Fixed user-data keys
    const fixedKeys = [
      "floof-sudoku-profile",
      "floof-sudoku-data",
      "floof-sudoku-stats", // legacy
      "floof-active-solos",
      "floof-active-solo", // legacy
      "sudogku-finished-solo-ids",
      "sudogku-coachmark-step",
    ];
    for (const key of fixedKeys) {
      localStorage.removeItem(key);
    }

    // Dynamic daily-result keys (one per date: sudogku-daily-result-YYYY-MM-DD)
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sudogku-daily-result-")) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore private-mode / quota errors
  }
}
