"use client";

const STORAGE_KEY = "sudogku-finished-solo-ids";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore quota
  }
}

/** Returns false if this active game was already recorded (prevents duplicate bones/stats). */
export function claimSoloFinish(activeId: string): boolean {
  const set = readSet();
  if (set.has(activeId)) return false;
  set.add(activeId);
  writeSet(set);
  return true;
}
