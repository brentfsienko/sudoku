"use client";

import { scopedKey } from "@/lib/auth/storageScope";

const SEEN_KEY = "sudogku-push-prompt-seen";

export function hasPushPromptBeenSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(scopedKey(SEEN_KEY)) === "1";
  } catch {
    return true;
  }
}

export function markPushPromptSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scopedKey(SEEN_KEY), "1");
  } catch {
    // ignore quota / private mode
  }
}
