import type { GameSnapshot } from "@/lib/game/store";

/** Bones earned from correctly filling hidden bonus cells this game. */
export function countCollectedBones(
  snapshot: Pick<GameSnapshot, "cells">,
  boneCells: Set<number> | Iterable<number>,
): number {
  let n = 0;
  for (const index of boneCells) {
    if (snapshot.cells[index]?.correct) n += 1;
  }
  return n;
}
