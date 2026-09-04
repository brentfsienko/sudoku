"use client";

import { getSupabase } from "@/lib/supabase/client";

export type GameFinishMode = "solo" | "daily" | "multiplayer";

export type GameFinishEvent = {
  mode: GameFinishMode;
  solved: boolean;
  difficulty: string;
  elapsedSeconds: number;
  mistakes: number;
};

export type GameStartEvent = {
  mode: GameFinishMode;
  difficulty: string;
};

/**
 * Fire-and-forget game-start metric → `/api/metrics/game-start`.
 * Shows up in Vercel Runtime Logs (search `[metric] game_start`).
 */
export function trackGameStart(event: GameStartEvent): void {
  void sendMetric("/api/metrics/game-start", event);
}

/**
 * Fire-and-forget game-finish metric → `/api/metrics/game-finish`.
 * Shows up in Vercel Runtime Logs on Hobby (search `[metric] game_finish`).
 */
export function trackGameFinish(event: GameFinishEvent): void {
  void sendMetric("/api/metrics/game-finish", event);
}

async function sendMetric(
  path: string,
  event: GameStartEvent | GameFinishEvent,
): Promise<void> {
  try {
    const sb = getSupabase();
    const session = (await sb?.auth.getSession())?.data.session ?? null;
    const userId = session?.user?.id ?? "anonymous";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    await fetch(path, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...event, userId }),
      keepalive: true,
    });
  } catch {
    // Metrics must never break gameplay.
  }
}
