"use client";

/**
 * Tracks solo games that have been fully recorded so we never double-award
 * bones or double-write stats. Uses localStorage (not sessionStorage) so the
 * guard survives page reloads — necessary because the cloud-sync timer can
 * restore a "finished" active after a reload.
 */

const STORAGE_KEY = "sudogku-finished-solo-ids";
const MAX_ENTRIES = 200;

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    // Keep the set bounded so it doesn't grow forever
    const arr = [...set].slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore quota
  }
}

/** Returns false if this game was already recorded (blocks duplicate stats/bones). */
export function claimSoloFinish(activeId: string): boolean {
  const set = readSet();
  if (set.has(activeId)) return false;
  set.add(activeId);
  writeSet(set);
  return true;
}

/** True if this game ID was already fully recorded. */
export function isSoloFinished(activeId: string): boolean {
  return readSet().has(activeId);
}

/** Returns all finished IDs as an array (for cloud sync). */
export function getFinishedIds(): string[] {
  return [...readSet()];
}

/**
 * Merges cloud-synced finished IDs into the local set.
 * Called after loading remote user_data so other devices' completions/quits
 * are honoured on this device.
 */
export function applyFinishedIds(ids: string[]): void {
  if (!ids.length) return;
  const set = readSet();
  let changed = false;
  for (const id of ids) {
    if (!set.has(id)) {
      set.add(id);
      changed = true;
    }
  }
  if (changed) writeSet(set);
}
