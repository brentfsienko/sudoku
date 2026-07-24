"use client";

import { useEffect, useRef } from "react";
import { trackRedditGameStart } from "@/lib/analytics/reddit";

/** Fire Reddit GameStart once when a play surface mounts. */
export function useTrackRedditGameStart(
  mode: "solo" | "daily" | "multiplayer",
  enabled = true,
) {
  const fired = useRef(false);
  useEffect(() => {
    if (!enabled || fired.current) return;
    fired.current = true;
    trackRedditGameStart(mode);
  }, [mode, enabled]);
}
