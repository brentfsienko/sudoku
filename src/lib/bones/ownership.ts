import { EXCLUSIVE_BONE_COSTS } from "@/lib/bones/config";
import type { ExclusiveDogId } from "@/lib/theme/dogs";
import type { UserData } from "@/lib/stats/types";

export function ownsExclusiveDog(
  dogId: ExclusiveDogId,
  data: UserData | null | undefined,
): boolean {
  return data?.ownedExclusiveDogs?.includes(dogId) ?? false;
}

/** Total bone cost of unlocked exclusive pups. */
export function exclusiveOwnershipCost(
  owned: ExclusiveDogId[] | undefined,
): number {
  if (!owned?.length) return 0;
  return owned.reduce((sum, id) => sum + (EXCLUSIVE_BONE_COSTS[id] ?? 0), 0);
}
