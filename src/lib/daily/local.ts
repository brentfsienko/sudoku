"use client";

/**
 * Local fallback storage for daily puzzle results.
 * Stores { elapsedSeconds, solved } per date so the home tab can display
 * the user's result even if the Supabase daily_results table is unavailable.
 */
const KEY_PREFIX = "sudogku-daily-result-";

export type DailyLocalResult = { elapsedSeconds: number; solved: boolean };

export function saveDailyResultLocal(
  dateStr: string,
  elapsedSeconds: number,
  solved: boolean,
): void {
  if (typeof window === "undefined") return;
  try {
    const val: DailyLocalResult = { elapsedSeconds, solved };
    localStorage.setItem(`${KEY_PREFIX}${dateStr}`, JSON.stringify(val));
  } catch {
    // ignore quota
  }
}

export function loadDailyResultLocal(dateStr: string): DailyLocalResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${dateStr}`);
    if (!raw) return null;
    // Backward-compat: old format stored a plain number (always assumed solved).
    const n = Number(raw);
    if (Number.isFinite(n)) return { elapsedSeconds: n, solved: true };
    return JSON.parse(raw) as DailyLocalResult;
  } catch {
    return null;
  }
}
