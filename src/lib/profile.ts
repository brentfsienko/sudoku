"use client";

import { coerceProfile, randomUsername } from "@/lib/stats/profile";
import type { Profile } from "@/lib/stats/types";
import { randomDogId, type DogId } from "@/lib/theme/dogs";

export type { Profile };

const KEY = "floof-sudoku-profile";

export function getProfile(): Profile {
  if (typeof window === "undefined") {
    return { username: randomUsername(), dogId: "golden" };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      return coerceProfile(JSON.parse(raw) as Partial<Profile> & { name?: string });
    }
  } catch {
    // fall through to create
  }
  const profile: Profile = { username: randomUsername(), dogId: randomDogId() };
  setProfile(profile);
  return profile;
}

export function setProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(coerceProfile(profile)));
  } catch {
    // ignore
  }
}
