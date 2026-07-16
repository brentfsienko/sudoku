"use client";

import { getSupabase } from "@/lib/supabase/client";

export type DailyLeaderboardEntry = {
  userId: string;
  elapsedSeconds: number;
  mistakes: number;
  solved: boolean;
  completedAt: string;
};

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

  const { data } = await sb
    .from("daily_results")
    .select("user_id, elapsed_seconds, mistakes, solved, completed_at")
    .eq("user_id", session.user.id)
    .eq("puzzle_date", dateStr)
    .single();

  if (!data) return null;
  return {
    userId: data.user_id as string,
    elapsedSeconds: data.elapsed_seconds as number,
    mistakes: data.mistakes as number,
    solved: (data.solved ?? true) as boolean,
    completedAt: data.completed_at as string,
  };
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
  const { data: existing } = await sb
    .from("daily_results")
    .select("elapsed_seconds, solved")
    .eq("user_id", userId)
    .eq("puzzle_date", dateStr)
    .single();

  if (existing) {
    // If they already have a solved entry, don't overwrite with a failed one.
    if ((existing.solved ?? true) && !solved) return;
    // If they already have a faster solved time, don't overwrite.
    if ((existing.solved ?? true) && solved && existing.elapsed_seconds <= elapsedSeconds) return;
  }

  await sb.from("daily_results").upsert(
    {
      user_id: userId,
      puzzle_date: dateStr,
      elapsed_seconds: solved ? elapsedSeconds : 0,
      mistakes,
      solved,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,puzzle_date" },
  );
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

  const userIds = [...new Set([myId, ...friendIds])];

  const { data, error } = await sb
    .from("daily_results")
    .select("user_id, elapsed_seconds, mistakes, solved, completed_at")
    .eq("puzzle_date", dateStr)
    .in("user_id", userIds);

  if (error || !data) return [];

  const entries: DailyLeaderboardEntry[] = data.map((row) => ({
    userId: row.user_id as string,
    elapsedSeconds: row.elapsed_seconds as number,
    mistakes: row.mistakes as number,
    solved: (row.solved ?? true) as boolean,
    completedAt: row.completed_at as string,
  }));

  // Solved entries first (sorted by time), failed entries at the bottom.
  const solved = entries
    .filter((e) => e.solved)
    .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);
  const failed = entries.filter((e) => !e.solved);

  return [...solved, ...failed];
}
