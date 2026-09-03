"use client";

import { applyFinishedIds } from "@/lib/game/finishedSolo";
import { removeActiveSolo } from "@/lib/game/activeSolo";
import { getDailyActiveId } from "@/lib/daily/puzzle";
import { saveDailyResultLocal } from "@/lib/daily/local";
import type { DailyLeaderboardEntry } from "@/lib/daily/api";

/** Mirror a cloud daily result onto this device so the home card and play gate match. */
export function hydrateDailyFromRemote(
  dateStr: string,
  remote: DailyLeaderboardEntry,
): void {
  saveDailyResultLocal(
    dateStr,
    remote.solved ? remote.elapsedSeconds : 0,
    remote.solved,
  );
  applyFinishedIds([getDailyActiveId(dateStr)]);
  removeActiveSolo(getDailyActiveId(dateStr));
}
