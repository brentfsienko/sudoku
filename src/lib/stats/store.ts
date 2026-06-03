"use client";

import { getSupabase } from "@/lib/supabase/client";
import { loadLocal, saveLocal } from "./local";
import { fetchRemote, upsertRemote } from "./remote";
import {
  applyMultiResult,
  applySoloResult,
  mergeUserData,
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
 * Loads and merges stats (local + remote when signed in). Read-only for remote:
 * never upserts here — a slow read-time upsert could overwrite a newer save.
 */
export async function loadUserData(): Promise<UserData> {
  const uid = await currentUserId();
  if (!uid) return loadLocal();

  const local = loadLocal();
  const remote = await withTimeout(fetchRemote(uid), 6000, null);
  if (remote) {
    const merged = mergeUserData(local, remote);
    saveLocal(merged);
    return merged;
  }
  return local;
}

export const STATS_UPDATED_EVENT = "sudogku:stats-updated";

export async function saveUserData(data: UserData): Promise<void> {
  saveLocal(data);
  const uid = await currentUserId();
  if (uid) await upsertRemote(uid, data);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STATS_UPDATED_EVENT));
  }
}

/** Seed first cloud row for a signed-in user with no remote data yet. */
export async function seedRemoteIfMissing(): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const remote = await withTimeout(fetchRemote(uid), 6000, null);
  if (!remote) void upsertRemote(uid, loadLocal());
}

async function loadForWrite(): Promise<UserData> {
  const uid = await currentUserId();
  let data = loadLocal();
  if (!uid) return data;
  const remote = await withTimeout(fetchRemote(uid), 6000, null);
  if (remote) data = mergeUserData(data, remote);
  return data;
}

export async function recordSoloGame(result: SoloResult): Promise<void> {
  const data = await loadForWrite();
  const bonesFound = Math.max(0, result.bonesFound);
  await saveUserData(applySoloResult(data, { ...result, bonesFound }));
}

export async function recordMultiGame(result: MultiResult): Promise<void> {
  const data = await loadForWrite();
  const bonesFound = Math.max(0, result.bonesFound);
  await saveUserData(applyMultiResult(data, { ...result, bonesFound }));
}
