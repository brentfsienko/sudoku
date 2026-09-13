"use client";

import { useEffect, useState } from "react";

export const GAME_COUNTDOWN_MS = 3200;
const BEAT_MS = 800;

export type CountdownPhase = "3" | "2" | "1" | "go";

/** Future `startedAt` means the clock has not begun — show 3, 2, 1, Go! */
export function countdownPhase(
  startedAt: number | null,
  now: number,
): CountdownPhase | null {
  if (!startedAt) return null;
  const remaining = startedAt - now;
  if (remaining <= 0) return null;
  if (remaining > BEAT_MS * 3) return "3";
  if (remaining > BEAT_MS * 2) return "2";
  if (remaining > BEAT_MS) return "1";
  return "go";
}

export function countdownStartAt(now = Date.now()): number {
  return now + GAME_COUNTDOWN_MS;
}

export function useCountdownPhase(startedAt: number | null): CountdownPhase | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || startedAt <= Date.now()) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= startedAt) window.clearInterval(id);
    }, 50);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return countdownPhase(startedAt, now);
}
