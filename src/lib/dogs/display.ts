import { ownsExclusiveDog } from "@/lib/bones/ownership";
import {
  isExclusiveDogId,
  isHoneyUser,
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
  const email = opts?.email ?? undefined;
  const resolved = resolveDogId(dogId, {
    username: opts?.username,
    email,
  });

  if (resolved === "bee" && !isHoneyUser({ username: opts?.username, email })) {
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
