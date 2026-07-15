"use client";

import {
  ACTIVE_SOLO_UPDATED_EVENT,
  loadActiveSolos,
  removeActiveSolo,
  replaceActiveSolosLocal,
} from "@/lib/game/activeSolo";
import {
  applyFinishedIds,
  claimSoloFinish,
  getFinishedIds,
} from "@/lib/game/finishedSolo";
import { getSupabase } from "@/lib/supabase/client";
import { loadLocal, saveLocal } from "./local";
import { fetchRemote, upsertRemote } from "./remote";
import {
  applyMultiResult,
  applySoloResult,
  mergeActiveSolos,
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

/** Include this device's in-progress solos AND finished IDs in the blob. */
function withDeviceData(data: UserData): UserData {
  return {
    ...data,
    activeSolos: mergeActiveSolos(data.activeSolos, loadActiveSolos()),
    finishedSoloIds: [...new Set([...(data.finishedSoloIds ?? []), ...getFinishedIds()])],
  };
}

// Keep the old name as a thin alias so call-sites don't change.
const withDeviceActiveSolos = withDeviceData;

function applyActiveSolosToDeviceCache(data: UserData): void {
  replaceActiveSolosLocal(data.activeSolos ?? []);
}

/** Apply cloud-synced finished IDs to this device's localStorage set. */
function applyFinishedIdsToDevice(data: UserData): void {
  if (data.finishedSoloIds?.length) {
    applyFinishedIds(data.finishedSoloIds);
  }
}

/**
 * Loads and merges stats (local + remote when signed in). Read-only for remote:
 * never upserts here — a slow read-time upsert could overwrite a newer save.
 */
export async function loadUserData(): Promise<UserData> {
  const uid = await currentUserId();
  let data = withDeviceActiveSolos(loadLocal());

  if (!uid) {
    applyActiveSolosToDeviceCache(data);
    saveLocal(data);
    return data;
  }

  const remote = await withTimeout(fetchRemote(uid), 6000, null);
  if (remote) {
    data = mergeUserData(data, remote);
  }
  // Propagate cloud-synced finished/quit IDs to this device's localStorage so
  // games completed or quit on another device are immediately hidden here.
  applyFinishedIdsToDevice(data);
  applyActiveSolosToDeviceCache(data);
  saveLocal(data);
  return data;
}

export const STATS_UPDATED_EVENT = "sudogku:stats-updated";

export async function saveUserData(data: UserData): Promise<void> {
  const withActives = withDeviceActiveSolos(data);
  applyActiveSolosToDeviceCache(withActives);
  saveLocal(withActives);
  const uid = await currentUserId();
  if (uid) await upsertRemote(uid, withActives);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STATS_UPDATED_EVENT));
  }
}

/** Seed first cloud row for a signed-in user with no remote data yet. */
export async function seedRemoteIfMissing(): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const remote = await withTimeout(fetchRemote(uid), 6000, null);
  if (!remote) void upsertRemote(uid, withDeviceActiveSolos(loadLocal()));
}

async function loadForWrite(): Promise<UserData> {
  const uid = await currentUserId();
  let data = loadLocal();
  if (!uid) return data;
  const remote = await withTimeout(fetchRemote(uid), 6000, null);
  if (remote) data = mergeUserData(data, remote);
  return data;
}

export async function recordSoloGame(
  result: SoloResult,
  opts?: { activeId?: string },
): Promise<void> {
  // Cancel any pending cloud-sync of active solos so it can't race with this
  // finish write and restore the game as active after we remove it.
  if (activeSoloPersistTimer) {
    clearTimeout(activeSoloPersistTimer);
    activeSoloPersistTimer = null;
  }

  // claimSoloFinish is called by callers, but call it here too as a guard so
  // the ID is in getFinishedIds() before withDeviceData runs below.
  if (opts?.activeId) {
    claimSoloFinish(opts.activeId);
    removeActiveSolo(opts.activeId);
  }

  let data = await loadForWrite();
  if (opts?.activeId) {
    data = {
      ...data,
      activeSolos: mergeActiveSolos([], data.activeSolos).filter(
        (item) => item.id !== opts.activeId,
      ),
    };
  }

  const bonesFound = Math.max(0, result.bonesFound);
  await saveUserData(applySoloResult(data, { ...result, bonesFound }));
}

/**
 * Permanently deletes an active solo from both local and remote storage.
 * Cancels any pending debounced persist so the remote can't race to restore it.
 */
export async function deleteActiveSolo(id: string): Promise<void> {
  if (activeSoloPersistTimer) {
    clearTimeout(activeSoloPersistTimer);
    activeSoloPersistTimer = null;
  }
  // Ensure the ID is in finishedSolo before withDeviceData runs, so it gets
  // included in finishedSoloIds and synced to other devices.
  claimSoloFinish(id);
  removeActiveSolo(id);
  const uid = await currentUserId();
  if (!uid) return;
  try {
    let data = await loadForWrite();
    data = {
      ...data,
      activeSolos: mergeActiveSolos([], data.activeSolos).filter(
        (item) => item.id !== id,
      ),
    };
    await saveUserData(data);
  } catch {
    // local already removed — acceptable failure
  }
}

export async function recordMultiGame(result: MultiResult): Promise<void> {
  const data = await loadForWrite();
  const bonesFound = Math.max(0, result.bonesFound);
  await saveUserData(applyMultiResult(data, { ...result, bonesFound }));
}

let activeSoloPersistTimer: ReturnType<typeof setTimeout> | null = null;

async function persistActiveSolosToAccount(): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const data = withDeviceActiveSolos(await loadForWrite());
    await saveUserData(data);
  } catch {
    // ignore — local actives still on device
  }
}

function schedulePersistActiveSolos(): void {
  if (activeSoloPersistTimer) clearTimeout(activeSoloPersistTimer);
  activeSoloPersistTimer = setTimeout(() => {
    activeSoloPersistTimer = null;
    void persistActiveSolosToAccount();
  }, 500);
}

if (typeof window !== "undefined") {
  window.addEventListener(ACTIVE_SOLO_UPDATED_EVENT, schedulePersistActiveSolos);
}
