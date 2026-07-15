"use client";

/**
 * Two-step onboarding coachmark for brand-new users only.
 *
 * Step "nav"    → pulsing badge on the Me tab in the bottom nav
 * Step "avatar" → speech bubble coming out of the dog avatar on the Me tab
 * Step absent   → coachmark fully dismissed or user is not new
 *
 * The step key is written only when a brand-new profile is first created
 * (not for returning users loading their profile from storage).
 */
const STEP_KEY = "sudogku-coachmark-step"; // "nav" | "avatar" — absent means done

export type CoachmarkStep = "nav" | "avatar";

/** Called once from getProfile() when a profile is created for the very first time. */
export function flagNewUserCoachmark(): void {
  if (typeof window === "undefined") return;
  // Only flag if no previous coachmark flow has run
  if (!localStorage.getItem(STEP_KEY)) {
    localStorage.setItem(STEP_KEY, "nav");
  }
}

/** Returns the current step, or null if the coachmark is done / user is not new. */
export function getCoachmarkStep(): CoachmarkStep | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STEP_KEY);
  if (v === "nav" || v === "avatar") return v;
  return null;
}

/** Advance from "nav" → "avatar" when the user taps the Me tab. */
export function advanceCoachmarkToAvatar(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(STEP_KEY) === "nav") {
    localStorage.setItem(STEP_KEY, "avatar");
  }
}

/** Fully dismiss the coachmark (user tapped to edit their profile). */
export function dismissCoachmark(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STEP_KEY);
}

// Legacy aliases kept so any stale imports don't break during transition
export const markProfileCoachmarkSeen = dismissCoachmark;
