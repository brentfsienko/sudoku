"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TRIGGER_THRESHOLD = 72; // px of pull needed to trigger refresh
const MAX_PULL = 100;          // max visual travel (with resistance)
const RESISTANCE = 0.42;
const REFRESH_DURATION_MS = 2500;

export type PullToRefreshState = "idle" | "pulling" | "triggered" | "refreshing";

export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0); // 0–MAX_PULL
  const [state, setState] = useState<PullToRefreshState>("idle");

  const dragRef = useRef<{ startY: number } | null>(null);
  const pullRef = useRef(0);
  const stateRef = useRef<PullToRefreshState>("idle");

  useEffect(() => { pullRef.current = pull; }, [pull]);
  useEffect(() => { stateRef.current = state; }, [state]);

  const endRefresh = useCallback(() => {
    setPull(0);
    setState("idle");
  }, []);

  const triggerRefresh = useCallback(() => {
    setState("refreshing");
    setPull(TRIGGER_THRESHOLD); // hold at threshold while refreshing
    const result = onRefresh();
    const done = () => {
      // Animate back after the minimum display time
      setTimeout(endRefresh, 300);
    };
    if (result instanceof Promise) {
      result.finally(() => setTimeout(done, 0));
    } else {
      setTimeout(done, REFRESH_DURATION_MS);
    }
  }, [onRefresh, endRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function isAtTop(): boolean {
      // Check if the scrollable child (first child) is scrolled to top
      const scrollable = el!.querySelector<HTMLElement>("[data-ptr-scroll]");
      return (scrollable?.scrollTop ?? 0) <= 1;
    }

    function onTouchStart(e: TouchEvent) {
      if (stateRef.current === "refreshing") return;
      if (!isAtTop()) return;
      dragRef.current = { startY: e.touches[0].clientY };
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragRef.current) return;
      if (stateRef.current === "refreshing") return;

      const dy = e.touches[0].clientY - dragRef.current.startY;
      if (dy <= 0 && pullRef.current === 0) {
        dragRef.current = null;
        return;
      }

      if (!isAtTop() && pullRef.current === 0) {
        dragRef.current = null;
        return;
      }

      if (dy > 0) e.preventDefault();

      const next = Math.min(MAX_PULL, Math.max(0, dy * RESISTANCE));
      setPull(next);
      setState(next >= TRIGGER_THRESHOLD ? "triggered" : "pulling");
    }

    function onTouchEnd() {
      if (!dragRef.current) return;
      dragRef.current = null;

      if (stateRef.current === "triggered") {
        triggerRefresh();
      } else {
        setPull(0);
        setState("idle");
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [triggerRefresh]);

  /** Progress 0–1 toward the trigger point */
  const progress = Math.min(1, pull / TRIGGER_THRESHOLD);

  return { containerRef, pull, progress, state };
}
