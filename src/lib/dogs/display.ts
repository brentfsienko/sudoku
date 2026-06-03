import { ownsExclusiveDog } from "@/lib/bones/ownership";
import {
  canUseBeePup,
  isExclusiveDogId,
  resolveDogId,
  type DogId,
} from "@/lib/theme/dogs";
import type { UserData } from "@/lib/stats/types";

/** Resolved dog for UI, respecting username/email overrides and purchased exclusives. */
export function displayDogId(
  dogId: string | null | undefined,
  opts?: {
    username?: string;
    email?: string | null;
    userData?: UserData;
  },
): DogId {
  const resolved = resolveDogId(dogId, {
    username: opts?.username,
    email: opts?.email,
  });

  if (resolved === "bee" && !canUseBeePup(opts)) {
    return "golden";
  }

  if (
    isExclusiveDogId(resolved) &&
    opts?.userData &&
    !ownsExclusiveDog(resolved, opts.userData)
  ) {
    return "golden";
  }

  return resolved;
}
