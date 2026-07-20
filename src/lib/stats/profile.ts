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
  "rex", "biscuit", "pretzel", "croissant", "waffle", "mochi", "peanut",
  "cookie", "boba", "truffle", "maple", "pepper", "cheddar", "nacho",
  "taco", "churro", "dumpling", "nugget", "pickle", "pumpkin", "scone",
  "tofu", "wonton", "ziggy", "poppet", "sprout", "bubbles", "pudding",
  "noodle", "bagel", "muffin", "donut", "pretzel", "custard", "gnocchi",
  "pierogi", "bao", "flapjack", "clover", "breezy", "doodle", "smudge",
  "snickerdoodle", "éclair", "macaron", "bon_bon", "s'more",
];

export function randomUsername(): string {
  const adj = FUN_ADJECTIVES[Math.floor(Math.random() * FUN_ADJECTIVES.length)];
  const name = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
  // normalizeUsername strips non-alphanumeric/underscore, so é→e, ' →  stripped
  return `${adj}_${name}`.toLowerCase().replace(/[^a-z0-9_]/g, "");
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
