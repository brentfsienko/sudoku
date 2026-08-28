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
  isSoloFinished,
} from "@/lib/game/finishedSolo";
import { getSupabase } from "@/lib/supabase/client";
import { setStorageScopeUserId } from "@/lib/auth/storageScope";
import { loadLocal, saveLocal } from "./local";
import {
  applyWallet,
  awardGameBonesRemote,
  getBoneWalletRemote,
  loadRemote,
  upsertRemote,
  walletFromData,
} from "./remote";
import { getInstallPlatform, hasInstallCoachCompleted } from "@/lib/pwa/iosInstall";
import {
  applyMultiResult,
  applySoloResult,
  emptyUserData,
  mergeActiveSolos,
  mergeUserData,
  multiBoneAward,
  soloBoneAward,
  type MultiResult,
  type SoloResult,
  type UserData,
} from "./types";
import { countCorrectPlaced } from "@/lib/game/engine";
import { elapsedSeconds, type GameSnapshot } from "@/lib/game/store";
import { saveDailyResultLocal } from "@/lib/daily/local";
import { submitDailyResult } from "@/lib/daily/api";
import { isStaleDailyActiveId } from "@/lib/daily/puzzle";
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
  const platform = getInstallPlatform();
  const byPlatform = { ...data.installCoachSeenByPlatform };
  if (platform && hasInstallCoachCompleted(platform)) {
    byPlatform[platform] = true;
  }
  return {
    ...data,
    activeSolos: mergeActiveSolos(data.activeSolos, loadActiveSolos()),
    finishedSoloIds: [...new Set([...(data.finishedSoloIds ?? []), ...getFinishedIds()])],
    installCoachSeen: Boolean(data.installCoachSeen),
    installCoachPathSeen: Boolean(data.installCoachPathSeen),
    installCoachSeenByPlatform: byPlatform,
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

async function loadRemoteRetry(uid: string) {
  let loaded = await withTimeout(loadRemote(uid), 6000, { ok: false } as const);
  if (!loaded.ok) {
    loaded = await withTimeout(loadRemote(uid), 6000, { ok: false } as const);
  }
  return loaded;
}

/**
 * Loads stats. When signed in, gameplay fields merge local+remote, but bones
 * and owned exclusives always come from the central user_data wallet.
 */
export async function loadUserData(): Promise<UserData> {
  const uid = await currentUserId();
  setStorageScopeUserId(uid);

  let data = withDeviceActiveSolos(loadLocal());
  if (uid && data.accountId && data.accountId !== uid) {
    data = emptyUserData();
  }

  if (!uid) {
    applyActiveSolosToDeviceCache(data);
    saveLocal(data);
    await expireStaleDailyActives();
    return withDeviceActiveSolos(loadLocal());
  }

  const remote = await loadRemoteRetry(uid);
  if (remote.ok && remote.data) {
    data = mergeUserData(data, remote.data);
  }
  const wallet = await getBoneWalletRemote();
  if (wallet) data = applyWallet(data, wallet);
  data = { ...data, accountId: uid };
  applyFinishedIdsToDevice(data);
  applyActiveSolosToDeviceCache(data);
  saveLocal(data);
  await expireStaleDailyActives();
  return withDeviceActiveSolos(loadLocal());
}

export const STATS_UPDATED_EVENT = "sudogku:stats-updated";

export async function saveUserData(data: UserData): Promise<void> {
  const uid = await currentUserId();
  setStorageScopeUserId(uid);
  let next = withDeviceActiveSolos(uid ? { ...data, accountId: uid } : data);
  applyActiveSolosToDeviceCache(next);
  saveLocal(next);
  if (uid) {
    const saved = await upsertRemote(uid, next);
    if (saved) {
      next = applyWallet(next, walletFromData(saved));
      saveLocal(next);
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STATS_UPDATED_EVENT));
  }
}

/** Seed first cloud row for a signed-in user with no remote data yet. */
export async function seedRemoteIfMissing(): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  setStorageScopeUserId(uid);
  const remote = await loadRemoteRetry(uid);
  if (!remote.ok) return;
  if (!remote.data) void upsertRemote(uid, withDeviceActiveSolos(loadLocal()));
}

async function loadForWrite(): Promise<UserData> {
  const uid = await currentUserId();
  setStorageScopeUserId(uid);
  let data = loadLocal();
  if (uid && data.accountId && data.accountId !== uid) {
    data = emptyUserData();
  }
  if (!uid) return data;
  const remote = await loadRemoteRetry(uid);
  if (remote.ok && remote.data) data = mergeUserData(data, remote.data);
  const wallet = await getBoneWalletRemote();
  if (wallet) data = applyWallet(data, wallet);
  return uid ? { ...data, accountId: uid } : data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Award bones on the server ledger, then pin the returned wallet locally. */
async function commitGameWithBones(
  dataAfter: UserData,
  gameId: string,
  awardAmount: number,
): Promise<void> {
  let next = dataAfter;
  const uid = await currentUserId();
  if (uid) {
    let wallet =
      awardAmount > 0
        ? await awardGameBonesRemote(gameId, awardAmount)
        : await getBoneWalletRemote();
    if (awardAmount > 0 && !wallet) {
      await sleep(500);
      wallet = await awardGameBonesRemote(gameId, awardAmount);
    }
    if (!wallet) wallet = await getBoneWalletRemote();
    if (wallet) {
      next = applyWallet(dataAfter, wallet);
    } else if (awardAmount > 0) {
      // Don't keep an optimistic local total — the DB wallet is source of truth.
      next = {
        ...dataAfter,
        bones: Math.max(0, (dataAfter.bones ?? 0) - awardAmount),
      };
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

  const gameId =
    opts?.activeId ??
    `solo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const awardAmount = soloBoneAward(result);

  if (opts?.activeId) {
    const isNewFinish = claimSoloFinish(opts.activeId);
    removeActiveSolo(opts.activeId);
    if (!isNewFinish) {
      // Duplicate finish (or a leftover finished id) — still credit the ledger.
      const data = await loadForWrite();
      await commitGameWithBones(data, gameId, awardAmount);
      return;
    }
  } else {
    claimSoloFinish(gameId);
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
  const after = applySoloResult(data, { ...result, bonesFound });
  await commitGameWithBones(after, gameId, awardAmount);
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
  // If this game was already recorded (solved/quit elsewhere), only strip the
  // leftover active — don't overwrite a solved daily with "not solved".
  const shouldMarkDailyFail = Boolean(daily && dateStr && !isSoloFinished(activeId));
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

  if (shouldMarkDailyFail && dateStr) {
    saveDailyResultLocal(dateStr, 0, false);
    await submitDailyResult(dateStr, elapsed, snapshot.mistakes, false);
  }
}

/**
 * When the next daily is released, any in-progress daily from a prior PST day
 * is removed from Active games and recorded as not solved.
 */
export async function expireStaleDailyActives(): Promise<void> {
  if (typeof window === "undefined") return;
  const stale = loadActiveSolos().filter((item) => isStaleDailyActiveId(item.id));
  for (const item of stale) {
    await abandonSoloGame(item.id, item.snapshot);
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

export async function recordMultiGame(
  result: MultiResult,
  opts?: { roomCode?: string },
): Promise<void> {
  const gameId = `multi-${opts?.roomCode ?? "room"}-${Date.now()}`;
  claimSoloFinish(gameId);
  const data = await loadForWrite();
  const bonesFound = Math.max(0, result.bonesFound);
  const after = applyMultiResult(data, { ...result, bonesFound });
  await commitGameWithBones(after, gameId, multiBoneAward({ ...result, bonesFound }));
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
