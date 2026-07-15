"use client";

const COACHMARK_KEY = "sudogku-profile-coachmark-seen";

export function hasSeenProfileCoachmark(): boolean {
  if (typeof window === "undefined") return true;
  return !!localStorage.getItem(COACHMARK_KEY);
}

export function markProfileCoachmarkSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COACHMARK_KEY, "1");
}
