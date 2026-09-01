"use client";

import { scopedKey } from "@/lib/auth/storageScope";

const SEEN_KEY = "floof-daily-dog-seen";

export function hasSeenDailyDog(dateKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(scopedKey(SEEN_KEY)) === dateKey;
  } catch {
    return false;
  }
}

export function markDailyDogSeen(dateKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scopedKey(SEEN_KEY), dateKey);
  } catch {
    // ignore quota / private mode
  }
}
