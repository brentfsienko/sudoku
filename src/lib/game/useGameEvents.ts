"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOthers, useStorage } from "@/lib/liveblocks/config";
import type { PlayerRole } from "@/lib/game/types";

type Props = {
  /** The local player's role — used to avoid narrating our own moves. */
  myRole: PlayerRole;
  /** Current game mode — determines which events to surface. */
  mode: "coop" | "competitive" | "single";
  /** Whether the game is currently in the playing phase. */
  playing: boolean;
};

/**
 * Fires sonner toasts for meaningful in-game events sourced from Liveblocks:
 *   - Player joined / left
 *   - Game started
 *   - Opponent pulls ahead (competitive only)
 *
 * Must be called inside a Liveblocks RoomProvider.
 */
export function useGameEvents({ myRole, mode, playing }: Props) {
  const others = useOthers();
  const cells = useStorage((root) => root.cells);
  const status = useStorage((root) => root.meta?.status);

  // ── Player join / leave ────────────────────────────────────────────────────
  const prevOtherIds = useRef<Set<string>>(new Set());
  const hasFiredStart = useRef(false);

  useEffect(() => {
    const currentIds = new Set(others.map((o) => o.connectionId.toString()));
    const prev = prevOtherIds.current;

    for (const o of others) {
      const id = o.connectionId.toString();
      if (!prev.has(id) && prev.size > 0) {
        // Someone joined after we were already in the room
        const name = o.presence?.name ?? "a player";
        toast(`🐶 ${name} joined the game`, { duration: 4000 });
      }
    }

    for (const prevId of prev) {
      if (!currentIds.has(prevId) && playing) {
        toast("a player left the game", { duration: 4000 });
      }
    }

    prevOtherIds.current = currentIds;
  }, [others, playing]);

  // ── Game started ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "playing" && !hasFiredStart.current) {
      hasFiredStart.current = true;
      // Small delay so the board has animated in
      const id = setTimeout(() => {
        toast("🧩 puzzle started — good luck!", { duration: 3000 });
      }, 600);
      return () => clearTimeout(id);
    }
  }, [status]);

  // ── Opponent ahead (competitive only) ────────────────────────────────────
  const prevMyCount = useRef(0);
  const prevOppCount = useRef(0);
  const aheadToastFired = useRef(false);

  useEffect(() => {
    if (mode !== "competitive" || !playing || !cells) return;

    let myCount = 0;
    let oppCount = 0;
    for (const entry of Object.values(cells)) {
      if (!entry?.value) continue;
      if (entry.owner === myRole) myCount++;
      else oppCount++;
    }

    const prevMy = prevMyCount.current;
    const prevOpp = prevOppCount.current;
    prevMyCount.current = myCount;
    prevOppCount.current = oppCount;

    // Fire once when the opponent overtakes us for the first time
    if (
      !aheadToastFired.current &&
      oppCount > myCount &&
      prevOpp <= prevMy &&
      oppCount > 3 // avoid noise at the very start
    ) {
      aheadToastFired.current = true;
      const gap = oppCount - myCount;
      toast(`opponent is ahead by ${gap} 👀`, { duration: 4000 });
    }

    // Reset so the toast can fire again if they pull ahead again later
    if (myCount > oppCount && aheadToastFired.current) {
      aheadToastFired.current = false;
    }
  }, [cells, mode, playing, myRole]);
}
