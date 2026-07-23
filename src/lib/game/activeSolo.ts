"use client";

import { isStaleDailyActiveId } from "@/lib/daily/puzzle";
import { isSoloFinished } from "./finishedSolo";
import { pauseSnapshot, type GameSnapshot } from "./store";

const STORAGE_KEY = "floof-active-solos";
const LEGACY_KEY = "floof-active-solo";

export const ACTIVE_SOLO_UPDATED_EVENT = "sudogku:active-solo-updated";

export type ActiveSoloSave = {
  id: string;
  snapshot: GameSnapshot;
  updatedAt: number;
};

export function isActiveSoloStatus(status: GameSnapshot["status"]): boolean {
  return status === "playing" || status === "paused";
}

export function isActiveSolo(snapshot: GameSnapshot): boolean {
  return isActiveSoloStatus(snapshot.status);
}

export function newActiveSoloId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseList(raw: string | null): ActiveSoloSave[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ActiveSoloSave[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item?.id &&
        item.snapshot?.puzzle &&
        item.snapshot.solution &&
        isActiveSolo(item.snapshot) &&
        !isSoloFinished(item.id),
    );
  } catch {
    return [];
  }
}

function migrateLegacy(): ActiveSoloSave[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { snapshot?: GameSnapshot };
    if (!parsed?.snapshot || !isActiveSolo(parsed.snapshot)) return [];
    window.localStorage.removeItem(LEGACY_KEY);
    return [
      {
        id: newActiveSoloId(),
        snapshot: parsed.snapshot,
        updatedAt: Date.now(),
      },
    ];
  } catch {
    return [];
  }
}

function writeList(list: ActiveSoloSave[], notify = true): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (notify) window.dispatchEvent(new Event(ACTIVE_SOLO_UPDATED_EVENT));
  } catch {
    // ignore quota errors
  }
}

/** Replace device cache (e.g. after cloud sync) without triggering a cloud upsert. */
export function replaceActiveSolosLocal(list: ActiveSoloSave[]): void {
  if (typeof window === "undefined") return;
  const valid = list.filter(
    (item) =>
      item?.id &&
      item.snapshot?.puzzle &&
      item.snapshot.solution &&
      isActiveSolo(item.snapshot) &&
      !isSoloFinished(item.id),
  );
  valid.sort((a, b) => b.updatedAt - a.updatedAt);
  writeList(valid, false);
}

export function loadActiveSolos(): ActiveSoloSave[] {
  if (typeof window === "undefined") return [];
  try {
    let list = parseList(window.localStorage.getItem(STORAGE_KEY));
    if (list.length === 0) {
      list = migrateLegacy();
      if (list.length > 0) writeList(list);
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function loadActiveSolo(id: string): ActiveSoloSave | null {
  return loadActiveSolos().find((item) => item.id === id) ?? null;
}

/** Most recently updated active solo (for legacy `?resume=1` links). */
export function loadLatestActiveSolo(): ActiveSoloSave | null {
  const list = loadActiveSolos();
  return list[0] ?? null;
}

export function upsertActiveSolo(
  snapshot: GameSnapshot,
  id: string,
  opts?: { pauseIfPlaying?: boolean },
): void {
  if (typeof window === "undefined") return;
  // Don't revive a daily after the next one has been released.
  if (isStaleDailyActiveId(id)) return;
  if (!isActiveSolo(snapshot)) return;
  const toStore = opts?.pauseIfPlaying ? pauseSnapshot(snapshot) : snapshot;
  if (!isActiveSolo(toStore)) return;

  const list = loadActiveSolos().filter((item) => item.id !== id);
  list.push({ id, snapshot: toStore, updatedAt: Date.now() });
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  writeList(list);
}

export function removeActiveSolo(id: string): void {
  if (typeof window === "undefined") return;
  const list = loadActiveSolos().filter((item) => item.id !== id);
  writeList(list);
}

/** @deprecated Use removeActiveSolo — clears all actives. */
export function clearActiveSolo(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(new Event(ACTIVE_SOLO_UPDATED_EVENT));
  } catch {
    // ignore
  }
}
