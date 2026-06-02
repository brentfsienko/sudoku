"use client";

import { getSupabase } from "@/lib/supabase/client";
import { normalizeUserData, type UserData } from "./types";

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
  return normalizeUserData(data.data as Partial<UserData>);
}

export async function upsertRemote(userId: string, data: UserData): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from("user_data")
    .upsert(
      { user_id: userId, data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) console.warn("[stats] remote upsert failed:", error.message);
}
