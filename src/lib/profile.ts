"use client";

import { randomDogId, randomDogName, type DogId } from "@/lib/theme/dogs";

const KEY = "floof-sudoku-profile";

export type Profile = {
  name: string;
  dogId: DogId;
};

export function getProfile(): Profile {
  if (typeof window === "undefined") {
    return { name: "Pup", dogId: "golden" };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Profile;
  } catch {
    // fall through to create
  }
  const profile: Profile = { name: randomDogName(), dogId: randomDogId() };
  setProfile(profile);
  return profile;
}

export function setProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}
