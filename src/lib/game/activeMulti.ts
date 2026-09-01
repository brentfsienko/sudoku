import { scopedKey } from "@/lib/auth/storageScope";
import type { Difficulty, GameMode } from "@/lib/game/types";

const STORAGE_KEY = "floof-active-multi";
export const ACTIVE_MULTI_UPDATED_EVENT = "sudogku:active-multi-updated";

export type ActiveMultiSave = {
  code: string;
  mode: GameMode;
  difficulty: Difficulty;
  joinedAt: number;
};

export function saveActiveMulti(data: ActiveMultiSave): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(data));
    window.dispatchEvent(new Event(ACTIVE_MULTI_UPDATED_EVENT));
  } catch {
    // quota / private mode
  }
}

export function loadActiveMulti(): ActiveMultiSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(scopedKey(STORAGE_KEY));
    if (!raw) return null;
    return JSON.parse(raw) as ActiveMultiSave;
  } catch {
    return null;
  }
}

export function clearActiveMulti(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(scopedKey(STORAGE_KEY));
    window.dispatchEvent(new Event(ACTIVE_MULTI_UPDATED_EVENT));
  } catch {
    // ignore
  }
}
