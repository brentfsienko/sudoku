"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_PULL = 88;
const RESISTANCE = 0.45;

export function usePullableSheet() {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [pulling, setPulling] = useState(false);
  const dragRef = useRef<{ startY: number; startOffset: number } | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setPulling(false);
    setOffset(0);
  }, []);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    function canPull(): boolean {
      return el!.scrollTop <= 1;
    }

    function onTouchStart(e: TouchEvent) {
      if (!canPull()) return;
      dragRef.current = {
        startY: e.touches[0].clientY,
        startOffset: offsetRef.current,
      };
      setPulling(true);
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragRef.current) return;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      if (dy > 0 || offsetRef.current > 0) {
        if (canPull() || offsetRef.current > 0) {
          e.preventDefault();
          const next = Math.min(
            MAX_PULL,
            Math.max(0, dragRef.current.startOffset + dy * RESISTANCE),
          );
          setOffset(next);
        }
      }
    }

    function onTouchEnd() {
      if (dragRef.current) endDrag();
    }

    function onTouchCancel() {
      if (dragRef.current) endDrag();
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [endDrag]);

  return { sheetRef, offset, pulling };
}
