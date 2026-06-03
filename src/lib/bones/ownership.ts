import type { ExclusiveDogId } from "@/lib/theme/dogs";
import type { UserData } from "@/lib/stats/types";

export function ownsExclusiveDog(
  dogId: ExclusiveDogId,
  data: UserData | null | undefined,
): boolean {
  return data?.ownedExclusiveDogs?.includes(dogId) ?? false;
}
