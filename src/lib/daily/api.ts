"use client";

import { getSupabase } from "@/lib/supabase/client";

export type DailyLeaderboardEntry = {
  userId: string;
  elapsedSeconds: number;
  mistakes: number;
  completedAt: string;
};

/**
 * Upserts the current user's result for a given daily puzzle date.
 * Only the best result (shortest elapsed_seconds) is kept, using an
 * upsert that ignores if a better result already exists.
 */
export async function submitDailyResult(
  dateStr: string,
  elapsedSeconds: number,
  mistakes: number,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return;

  const userId = session.user.id;

  // Check if there's already a result for this date
  const { data: existing } = await sb
    .from("daily_results")
    .select("elapsed_seconds")
    .eq("user_id", userId)
    .eq("puzzle_date", dateStr)
    .single();

  // Only update if this result is better (faster)
  if (existing && existing.elapsed_seconds <= elapsedSeconds) return;

  await sb.from("daily_results").upsert(
    {
      user_id: userId,
      puzzle_date: dateStr,
      elapsed_seconds: elapsedSeconds,
      mistakes,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,puzzle_date" },
  );
}

/**
 * Fetches the leaderboard for a given date, filtered to the current user and
 * their friends. Returns entries sorted by elapsed_seconds ascending.
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
    .select("user_id, elapsed_seconds, mistakes, completed_at")
    .eq("puzzle_date", dateStr)
    .in("user_id", userIds)
    .order("elapsed_seconds", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    userId: row.user_id as string,
    elapsedSeconds: row.elapsed_seconds as number,
    mistakes: row.mistakes as number,
    completedAt: row.completed_at as string,
  }));
}
