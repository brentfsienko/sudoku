"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TRIGGER_THRESHOLD = 72; // px of pull needed to trigger refresh
const MAX_PULL = 100;          // max visual travel (with resistance)
const RESISTANCE = 0.42;
const REFRESH_DURATION_MS = 2500;
/** Fraction of refresh time to hold at pull position before snapping back. */
const HOLD_FRACTION = 0.8;

export type PullToRefreshState = "idle" | "pulling" | "triggered" | "refreshing";

export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0); // 0–MAX_PULL
  const [state, setState] = useState<PullToRefreshState>("idle");
  /** True during the snap-back phase so callers can apply CSS transitions. */
  const [snapping, setSnapping] = useState(false);

  const dragRef = useRef<{ startY: number } | null>(null);
  const pullRef = useRef(0);
  const stateRef = useRef<PullToRefreshState>("idle");

  useEffect(() => { pullRef.current = pull; }, [pull]);
  useEffect(() => { stateRef.current = state; }, [state]);

  const endRefresh = useCallback(() => {
    setSnapping(false);
    setPull(0);
    setState("idle");
  }, []);

  const triggerRefresh = useCallback(() => {
    setState("refreshing");
    setPull(TRIGGER_THRESHOLD); // hold at threshold while spinning
    setSnapping(false);

    const result = onRefresh();
    const holdMs = REFRESH_DURATION_MS * HOLD_FRACTION;       // 2000 ms
    const snapMs = REFRESH_DURATION_MS * (1 - HOLD_FRACTION); // 500 ms

    const snap = () => {
      // Start the visual snap-back (CSS transition on the caller side)
      setSnapping(true);
      setPull(0);
      setTimeout(endRefresh, snapMs);
    };

    if (result instanceof Promise) {
      // Wait for whichever is longer: promise or the hold period
      const holdTimer = new Promise<void>((resolve) =>
        setTimeout(resolve, holdMs),
      );
      void Promise.all([result, holdTimer]).then(snap);
    } else {
      setTimeout(snap, holdMs);
    }
  }, [onRefresh, endRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function isAtTop(): boolean {
      const scrollable = el!.querySelector<HTMLElement>("[data-ptr-scroll]");
      return (scrollable?.scrollTop ?? 0) <= 1;
    }

    function fromModal(e: TouchEvent): boolean {
      const t = e.target;
      return t instanceof Element && !!t.closest("[data-modal-layer]");
    }

    function onTouchStart(e: TouchEvent) {
      if (stateRef.current === "refreshing") return;
      if (fromModal(e)) return;
      if (!isAtTop()) return;
      dragRef.current = { startY: e.touches[0].clientY };
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragRef.current) return;
      if (stateRef.current === "refreshing") return;
      if (fromModal(e)) {
        dragRef.current = null;
        return;
      }

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

  return { containerRef, pull, progress, state, snapping };
}
