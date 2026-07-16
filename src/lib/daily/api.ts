"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DailyLeaderboardEntry = {
  userId: string;
  elapsedSeconds: number;
  mistakes: number;
  solved: boolean;
  completedAt: string;
};

const SELECT_WITH_SOLVED =
  "user_id, elapsed_seconds, mistakes, solved, completed_at";
const SELECT_LEGACY = "user_id, elapsed_seconds, mistakes, completed_at";

function isMissingSolvedColumn(
  error: { message?: string; code?: string } | null,
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42703" ||
    (msg.includes("solved") && msg.includes("does not exist"))
  );
}

function mapRow(row: Record<string, unknown>): DailyLeaderboardEntry {
  return {
    userId: row.user_id as string,
    elapsedSeconds: row.elapsed_seconds as number,
    mistakes: row.mistakes as number,
    solved: (row.solved ?? true) as boolean,
    completedAt: row.completed_at as string,
  };
}

async function selectDailyRows(
  sb: SupabaseClient,
  dateStr: string,
  userIds: string[],
) {
  const withSolved = await sb
    .from("daily_results")
    .select(SELECT_WITH_SOLVED)
    .eq("puzzle_date", dateStr)
    .in("user_id", userIds);

  if (!withSolved.error) {
    return { data: withSolved.data, error: null, usedSolvedColumn: true };
  }

  if (isMissingSolvedColumn(withSolved.error)) {
    const legacy = await sb
      .from("daily_results")
      .select(SELECT_LEGACY)
      .eq("puzzle_date", dateStr)
      .in("user_id", userIds);
    return {
      data: legacy.data,
      error: legacy.error,
      usedSolvedColumn: false,
    };
  }

  return {
    data: withSolved.data,
    error: withSolved.error,
    usedSolvedColumn: true,
  };
}

/**
 * Fetches the current user's own result for a given date, or null if not attempted.
 */
export async function fetchMyDailyResult(
  dateStr: string,
): Promise<DailyLeaderboardEntry | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return null;

  let { data, error } = await sb
    .from("daily_results")
    .select(SELECT_WITH_SOLVED)
    .eq("user_id", session.user.id)
    .eq("puzzle_date", dateStr)
    .maybeSingle();

  if (error && isMissingSolvedColumn(error)) {
    ({ data, error } = await sb
      .from("daily_results")
      .select(SELECT_LEGACY)
      .eq("user_id", session.user.id)
      .eq("puzzle_date", dateStr)
      .maybeSingle());
  }

  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

/**
 * Upserts the current user's result for a given daily puzzle date.
 * For solved attempts: only keeps the best (fastest) time.
 * For failed attempts: always records (so friends can see who tried).
 */
export async function submitDailyResult(
  dateStr: string,
  elapsedSeconds: number,
  mistakes: number,
  solved: boolean,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return;

  const userId = session.user.id;

  // Check if there's already a result for this date.
  let { data: existing, error: existingError } = await sb
    .from("daily_results")
    .select("elapsed_seconds, solved")
    .eq("user_id", userId)
    .eq("puzzle_date", dateStr)
    .maybeSingle();

  let hasSolvedColumn = true;
  if (existingError && isMissingSolvedColumn(existingError)) {
    hasSolvedColumn = false;
    ({ data: existing } = await sb
      .from("daily_results")
      .select("elapsed_seconds")
      .eq("user_id", userId)
      .eq("puzzle_date", dateStr)
      .maybeSingle());
  }

  if (existing) {
    const alreadySolved = (existing as { solved?: boolean }).solved ?? true;
    // If they already have a solved entry, don't overwrite with a failed one.
    if (alreadySolved && !solved) return;
    // If they already have a faster solved time, don't overwrite.
    if (
      alreadySolved &&
      solved &&
      (existing as { elapsed_seconds: number }).elapsed_seconds <= elapsedSeconds
    ) {
      return;
    }
  }

  // Without the solved column, skip persisting failures (would look like a 0s win).
  if (!hasSolvedColumn && !solved) return;

  const payload: Record<string, unknown> = {
    user_id: userId,
    puzzle_date: dateStr,
    elapsed_seconds: solved ? elapsedSeconds : 0,
    mistakes,
    completed_at: new Date().toISOString(),
  };
  if (hasSolvedColumn) payload.solved = solved;

  await sb.from("daily_results").upsert(payload, {
    onConflict: "user_id,puzzle_date",
  });
}

/**
 * Fetches the leaderboard for a given date, filtered to the current user and
 * their friends. Returns solved entries sorted by time, then failed entries.
 */
export async function fetchLeaderboard(
  dateStr: string,
  friendIds: string[],
  myId: string,
): Promise<DailyLeaderboardEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const userIds = [...new Set([myId, ...friendIds].filter(Boolean))];
  if (userIds.length === 0) return [];

  const result = await selectDailyRows(sb, dateStr, userIds);
  if (result.error || !result.data) return [];

  const entries: DailyLeaderboardEntry[] = result.data.map((row) =>
    mapRow(row as Record<string, unknown>),
  );

  // Solved entries first (sorted by time), failed entries at the bottom.
  const solved = entries
    .filter((e) => e.solved)
    .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);
  const failed = entries.filter((e) => !e.solved);

  return [...solved, ...failed];
}
