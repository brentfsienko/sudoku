"use client";

import { getSupabase } from "@/lib/supabase/client";
import {
  normalizeUserData,
  sumHistorySquares,
  type UserData,
} from "./types";

/** Reads the signed-in user's saved data row, or null if none exists yet. */
export async function fetchRemote(userId: string): Promise<UserData | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[stats] remote fetch failed:", error.message);
    return null;
  }
  if (!data) return null;
  const raw = data.data as Partial<UserData>;
  const normalized = normalizeUserData(raw);
  const needsRepair =
    sumHistorySquares(raw.history) < sumHistorySquares(normalized.history) ||
    JSON.stringify(raw.history ?? []) !== JSON.stringify(normalized.history);
  if (needsRepair) {
    void upsertRemote(userId, normalized);
  }
  return normalized;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("remote upsert timeout")), ms);
    }),
  ]);
}

export async function upsertRemote(userId: string, data: UserData): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const upsert = sb
      .from("user_data")
      .upsert(
        { user_id: userId, data, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    const result = await withTimeout(Promise.resolve(upsert), 12_000);
    if (result.error) console.warn("[stats] remote upsert failed:", result.error.message);
  } catch (err) {
    console.warn("[stats] remote upsert failed:", err);
  }
}
