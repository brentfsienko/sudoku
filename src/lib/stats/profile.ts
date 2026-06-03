import { ownsExclusiveDog } from "@/lib/bones/ownership";
import { normalizeUsername, validateUsername } from "@/lib/friends/username";
import {
  isExclusiveDogId,
  resolveDogId,
  type DogId,
} from "@/lib/theme/dogs";
import type { Profile, UserData } from "./types";

export function randomUsername(): string {
  return `pup_${Math.floor(1000 + Math.random() * 9000)}`;
}

function coerceDogId(
  dogId: string | undefined,
  username: string,
  userData?: UserData,
  email?: string | null,
): DogId {
  let raw = dogId;
  if (raw === "party") raw = "pug";

  const resolved = resolveDogId(raw, { username, email });
  if (
    isExclusiveDogId(resolved) &&
    userData &&
    !ownsExclusiveDog(resolved, userData)
  ) {
    return "golden";
  }
  return resolved;
}

/** Normalize stored profile data; migrates legacy `name` → `username`. */
export function coerceProfile(
  raw?: Partial<Profile> & { name?: string; dogId?: string },
  userData?: UserData,
  email?: string | null,
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
    dogId: coerceDogId(raw?.dogId, username, userData, email),
  };
}
