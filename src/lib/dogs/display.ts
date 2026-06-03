import { ownsExclusiveDog } from "@/lib/bones/ownership";
import {
  isExclusiveDogId,
  resolveDogId,
  type DogId,
} from "@/lib/theme/dogs";
import type { UserData } from "@/lib/stats/types";

/** Resolved dog for UI, respecting username overrides and purchased exclusives. */
export function displayDogId(
  dogId: string | null | undefined,
  opts?: { username?: string; userData?: UserData },
): DogId {
  const resolved = resolveDogId(dogId, { username: opts?.username });
  if (
    isExclusiveDogId(resolved) &&
    opts?.userData &&
    !ownsExclusiveDog(resolved, opts.userData)
  ) {
    return "golden";
  }
  return resolved;
}
