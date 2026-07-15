"use client";

/**
 * "show" key is written once when a brand-new profile is first created.
 * It is NOT written for returning users (even on a fresh device/browser).
 * The coachmark is shown only when this key exists and the "seen" key does not.
 */
const SHOW_KEY = "sudogku-profile-coachmark-show";
const SEEN_KEY = "sudogku-profile-coachmark-seen";

/** Called once from getProfile() when a profile is created for the very first time. */
export function flagNewUserCoachmark(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(SEEN_KEY)) {
    localStorage.setItem(SHOW_KEY, "1");
  }
}

export function shouldShowProfileCoachmark(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !!localStorage.getItem(SHOW_KEY) && !localStorage.getItem(SEEN_KEY)
  );
}

export function markProfileCoachmarkSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SHOW_KEY);
  localStorage.setItem(SEEN_KEY, "1");
}
