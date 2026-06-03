import { normalizeUsername, validateUsername } from "@/lib/friends/username";
import type { DogId } from "@/lib/theme/dogs";
import type { Profile } from "./types";

export function randomUsername(): string {
  return `pup_${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Normalize stored profile data; migrates legacy `name` → `username`. */
export function coerceProfile(
  raw?: Partial<Profile> & { name?: string; dogId?: string },
): Profile {
  let username =
    raw?.username?.trim() ||
    (raw?.name ? normalizeUsername(raw.name) : "") ||
    "";

  username = normalizeUsername(username);
  if (!username || validateUsername(username)) {
    username = randomUsername();
  }

  return {
    username,
    dogId: (raw?.dogId as DogId) ?? "golden",
  };
}
