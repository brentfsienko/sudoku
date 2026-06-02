"use client";

import { getSupabase } from "@/lib/supabase/client";
import { loadLocal, saveLocal } from "./local";
import { fetchRemote, upsertRemote } from "./remote";
import {
  applyMultiResult,
  applySoloResult,
  type MultiResult,
  type SoloResult,
  type UserData,
} from "./types";

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await withTimeout(sb.auth.getSession(), 6000, {
      data: { session: null },
      error: null,
    });
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Loads the active user data. When signed in, the Supabase row wins; if no row
 * exists yet, the current device's local data seeds the account. When signed
 * out, falls back to localStorage. Never blocks indefinitely on remote calls.
 */
export async function loadUserData(): Promise<UserData> {
  const uid = await currentUserId();
  if (uid) {
    const remote = await withTimeout(fetchRemote(uid), 6000, null);
    if (remote) {
      saveLocal(remote);
      return remote;
    }
    const local = loadLocal();
    // Seed cloud in background — don't block the UI on a slow upsert.
    void upsertRemote(uid, local);
    return local;
  }
  return loadLocal();
}

export async function saveUserData(data: UserData): Promise<void> {
  saveLocal(data);
  const uid = await currentUserId();
  if (uid) await upsertRemote(uid, data);
}

export async function recordSoloGame(result: SoloResult): Promise<void> {
  const data = await loadUserData();
  await saveUserData(applySoloResult(data, result));
}

export async function recordMultiGame(result: MultiResult): Promise<void> {
  const data = await loadUserData();
  await saveUserData(applyMultiResult(data, result));
}
