import { isExclusiveDogUnlocked } from "@/lib/dogs/challenges";
import { normalizeUsername, validateUsername } from "@/lib/friends/username";
import {
  isExclusiveDogId,
  resolveDogId,
  type DogId,
} from "@/lib/theme/dogs";
import type { Profile, UserData } from "./types";

function coerceDogId(
  dogId: string | undefined,
  username: string,
  userData?: UserData,
): DogId {
  const resolved = resolveDogId(dogId, { username });
  if (
    isExclusiveDogId(resolved) &&
    userData &&
    !isExclusiveDogUnlocked(resolved, userData)
  ) {
    return "golden";
  }
  return resolved;
}

export function randomUsername(): string {
  return `pup_${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Normalize stored profile data; migrates legacy `name` → `username`. */
export function coerceProfile(
  raw?: Partial<Profile> & { name?: string; dogId?: string },
  userData?: UserData,
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
    dogId: coerceDogId(raw?.dogId, username, userData),
  };
}
