"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDailyPuzzle } from "@/lib/daily/puzzle";
import { loadDailyResultLocal } from "@/lib/daily/local";

export type DailyLeaderboardEntry = {
  userId: string;
  elapsedSeconds: number;
  mistakes: number;
  solved: boolean;
  completedAt: string;
};

export type DailySubmitResult = { ok: boolean; error?: string };

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
 * Submits a daily result via the server verify endpoint.
 * When solved, `board` must be the full 81-char solution grid.
 */
export async function submitDailyResult(
  dateStr: string,
  elapsedSeconds: number,
  mistakes: number,
  solved: boolean,
  board?: string,
): Promise<DailySubmitResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Not configured" };

  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return { ok: false, error: "Not signed in" };

  const payload = {
    dateStr,
    elapsedSeconds,
    mistakes,
    solved,
    board: solved ? board : undefined,
  };

  const post = async (): Promise<DailySubmitResult> => {
    try {
      const res = await fetch("/api/daily/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { ok: true };
      let message = `Submit failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // ignore parse errors
      }
      return { ok: false, error: message };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Network error",
      };
    }
  };

  const first = await post();
  if (first.ok) return first;
  // One retry for transient network failures only.
  if (first.error === "Network error") {
    return post();
  }
  return first;
}

/**
 * If this device finished today's daily but the cloud row is missing
 * (e.g. elapsed floor rejected a fast solve), re-submit from local storage.
 */
export async function ensureDailyResultSynced(dateStr: string): Promise<boolean> {
  const remote = await fetchMyDailyResult(dateStr);
  if (remote) return true;

  const local = loadDailyResultLocal(dateStr);
  if (!local) return false;

  const board = local.solved ? getDailyPuzzle(dateStr).solution : undefined;
  const result = await submitDailyResult(
    dateStr,
    local.elapsedSeconds,
    0,
    local.solved,
    board,
  );
  return result.ok;
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

  const solved = entries
    .filter((e) => e.solved)
    .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);
  const failed = entries.filter((e) => !e.solved);

  return [...solved, ...failed];
}
