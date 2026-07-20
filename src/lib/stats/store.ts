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
import {
  addBonesRemote,
  applyWallet,
  fetchRemote,
  upsertRemote,
} from "./remote";
import {
  applyMultiResult,
  applySoloResult,
  mergeActiveSolos,
  mergeUserData,
  type MultiResult,
  type SoloResult,
  type UserData,
} from "./types";
import { countCorrectPlaced } from "@/lib/game/engine";
import { elapsedSeconds, type GameSnapshot } from "@/lib/game/store";
import { saveDailyResultLocal } from "@/lib/daily/local";
import { submitDailyResult } from "@/lib/daily/api";
import { liveScore } from "@/lib/game/scoring";

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

const withDeviceActiveSolos = withDeviceData;

function applyActiveSolosToDeviceCache(data: UserData): void {
  replaceActiveSolosLocal(data.activeSolos ?? []);
}

function applyFinishedIdsToDevice(data: UserData): void {
  if (data.finishedSoloIds?.length) {
    applyFinishedIds(data.finishedSoloIds);
  }
}

/**
 * Loads stats. When signed in, gameplay fields merge local+remote, but bones
 * and owned exclusives always come from the central user_data wallet.
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

/** Apply a game result, award bones on the server wallet when signed in. */
async function commitGameWithBones(
  dataBefore: UserData,
  dataAfter: UserData,
): Promise<void> {
  const delta = Math.max(0, (dataAfter.bones ?? 0) - (dataBefore.bones ?? 0));
  let next = dataAfter;
  if (delta > 0) {
    const wallet = await addBonesRemote(delta);
    if (wallet) {
      next = applyWallet(dataAfter, wallet);
    }
  }
  await saveUserData(next);
}

export async function recordSoloGame(
  result: SoloResult,
  opts?: { activeId?: string },
): Promise<void> {
  if (activeSoloPersistTimer) {
    clearTimeout(activeSoloPersistTimer);
    activeSoloPersistTimer = null;
  }

  if (opts?.activeId) {
    // Block duplicate stats/bones if this game was already recorded.
    if (!claimSoloFinish(opts.activeId)) {
      removeActiveSolo(opts.activeId);
      return;
    }
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
  const before = data;
  const after = applySoloResult(data, { ...result, bonesFound });
  await commitGameWithBones(before, after);
}

/**
 * Quit / End Game: remove from active list and append an unsolved recent-game row.
 */
export async function abandonSoloGame(
  activeId: string,
  snapshot: GameSnapshot,
  opts?: { bonesFound?: number },
): Promise<void> {
  const daily = activeId.startsWith("daily-");
  const dateStr = daily ? activeId.slice("daily-".length) : null;
  const now = Date.now();
  const elapsed = elapsedSeconds(snapshot, now);
  const squaresFilled = countCorrectPlaced(snapshot.puzzle, snapshot.cells);
  const score = liveScore({
    difficulty: snapshot.difficulty,
    correctPlaced: squaresFilled,
    mistakes: snapshot.mistakes,
    hintsUsed: snapshot.hintsUsed,
  });

  await recordSoloGame(
    {
      won: false,
      score,
      difficulty: snapshot.difficulty,
      elapsedSeconds: elapsed,
      mistakes: snapshot.mistakes,
      hintsUsed: snapshot.hintsUsed,
      squaresFilled,
      bonesFound: Math.max(0, opts?.bonesFound ?? 0),
      daily: daily || undefined,
    },
    { activeId },
  );

  if (daily && dateStr) {
    saveDailyResultLocal(dateStr, 0, false);
    await submitDailyResult(dateStr, elapsed, snapshot.mistakes, false);
  }
}

/** Remove an active solo without writing history (prefer abandonSoloGame). */
export async function deleteActiveSolo(id: string): Promise<void> {
  if (activeSoloPersistTimer) {
    clearTimeout(activeSoloPersistTimer);
    activeSoloPersistTimer = null;
  }
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
  const after = applyMultiResult(data, { ...result, bonesFound });
  await commitGameWithBones(data, after);
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
