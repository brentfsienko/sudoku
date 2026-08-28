import { ownsExclusiveDog } from "@/lib/bones/ownership";
import { normalizeUsername, validateUsername } from "@/lib/friends/username";
import {
  defaultProfileDogId,
  isExclusiveDogId,
  resolveDogId,
  type DogId,
} from "@/lib/theme/dogs";
import type { Profile, UserData } from "./types";

const FUN_ADJECTIVES = [
  "lil", "tiny", "fluffy", "golden", "cozy", "fancy", "jolly", "dizzy",
  "fuzzy", "cheeky", "sassy", "bouncy", "snuggly", "frisky", "peppy",
  "zesty", "goofy", "chill", "plush", "speedy", "witty", "dreamy",
  "spunky", "perky", "mellow", "zany", "silky", "dapper", "lucky",
  "chunky", "puffy", "toasty", "crispy", "sleepy", "wiggly", "feisty",
  "ice", "royal", "cosmic", "noodle", "velvet", "cloud",
];

const FUN_NAMES = [
  "rex", "milo", "coco", "luna", "bean", "pip", "scout", "daisy",
  "olive", "puff", "kiwi", "mango", "toast", "duke", "ace", "blue",
  "ruby", "ginger", "pebble", "biscuit", "pretzel", "waffle", "mochi",
  "peanut", "cookie", "boba", "truffle", "maple", "pepper", "cheddar",
  "nacho", "taco", "nugget", "pickle", "pumpkin", "scone", "tofu",
  "ziggy", "poppet", "sprout", "bubbles", "pudding", "bagel", "muffin",
  "donut", "clover", "doodle", "smudge", "bao", "noodle",
];

function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)]!;
}

/** Letters only — no digits, hyphens, or underscores. */
function asWordUsername(...parts: string[]): string {
  const raw = parts.join("").toLowerCase().replace(/[^a-z]/g, "");
  const sliced = raw.slice(0, 24);
  return sliced.length >= 3 ? sliced : "pup";
}

export function randomUsername(opts?: { extraWord?: boolean }): string {
  if (opts?.extraWord) {
    return asWordUsername(pick(FUN_ADJECTIVES), pick(FUN_NAMES));
  }
  return asWordUsername(pick(FUN_NAMES));
}

function coerceDogId(
  dogId: string | undefined,
  username: string,
  userData?: UserData,
  email?: string | null,
): DogId {
  let raw = dogId?.trim();
  if (!raw) raw = defaultProfileDogId({ username, email });

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
