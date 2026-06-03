"use client";

import type { GameSnapshot } from "./store";

const STORAGE_KEY = "floof-active-solo";
export const ACTIVE_SOLO_UPDATED_EVENT = "sudogku:active-solo-updated";

export type ActiveSoloSave = {
  snapshot: GameSnapshot;
};

export function isActiveSoloStatus(status: GameSnapshot["status"]): boolean {
  return status === "playing" || status === "paused";
}

export function isActiveSolo(snapshot: GameSnapshot): boolean {
  return isActiveSoloStatus(snapshot.status);
}

export function loadActiveSolo(): ActiveSoloSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveSoloSave;
    if (!parsed?.snapshot?.puzzle || !parsed.snapshot.solution) return null;
    if (!isActiveSolo(parsed.snapshot)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveSolo(snapshot: GameSnapshot): void {
  if (typeof window === "undefined") return;
  if (!isActiveSolo(snapshot)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ snapshot }));
    window.dispatchEvent(new Event(ACTIVE_SOLO_UPDATED_EVENT));
  } catch {
    // ignore quota errors
  }
}

export function clearActiveSolo(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(ACTIVE_SOLO_UPDATED_EVENT));
  } catch {
    // ignore
  }
}
