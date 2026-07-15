"use client";

/**
 * Local fallback storage for daily puzzle results.
 * Stores elapsed seconds per date so the home tab can display
 * the user's time even if the Supabase daily_results table is unavailable.
 */
const KEY_PREFIX = "sudogku-daily-result-";

export function saveDailyResultLocal(dateStr: string, elapsedSeconds: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${KEY_PREFIX}${dateStr}`, String(elapsedSeconds));
  } catch {
    // ignore quota
  }
}

export function loadDailyResultLocal(dateStr: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${dateStr}`);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
