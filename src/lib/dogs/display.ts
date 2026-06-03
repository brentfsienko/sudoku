import { isExclusiveDogUnlocked } from "@/lib/dogs/challenges";
import {
  isExclusiveDogId,
  resolveDogId,
  type DogId,
} from "@/lib/theme/dogs";
import type { UserData } from "@/lib/stats/types";

/** Resolved dog for UI, respecting username overrides and exclusive unlocks. */
export function displayDogId(
  dogId: string | null | undefined,
  opts?: { username?: string; userData?: UserData },
): DogId {
  const resolved = resolveDogId(dogId, { username: opts?.username });
  if (
    isExclusiveDogId(resolved) &&
    opts?.userData &&
    !isExclusiveDogUnlocked(resolved, opts.userData)
  ) {
    return "golden";
  }
  return resolved;
}
