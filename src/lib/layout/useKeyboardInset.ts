"use client";

import { useEffect, useState } from "react";
import { isEditableFocused } from "@/lib/layout/standalone";

export type KeyboardLayout = {
  /** Pixels covered at the bottom of the layout viewport (0 when closed). */
  inset: number;
  /** Visible viewport height (visualViewport when available). */
  visibleHeight: number;
};

/**
 * Tracks how much of the screen the software keyboard covers so sheets can
 * park above the keys without resizing the whole app
 * (`interactive-widget: overlays-content`).
 */
export function useKeyboardInset(): KeyboardLayout {
  const [layout, setLayout] = useState<KeyboardLayout>(() => ({
    inset: 0,
    visibleHeight:
      typeof window !== "undefined"
        ? (window.visualViewport?.height ?? window.innerHeight)
        : 360,
  }));

  useEffect(() => {
    const vv = window.visualViewport;

    const update = () => {
      const visibleHeight = vv?.height ?? window.innerHeight;
      const overlap = vv
        ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
        : 0;
      // Any focused-field overlap counts — the old 80px floor left the chat
      // under shorter keyboards / suggestion bars.
      const inset =
        isEditableFocused() && overlap > 0 ? Math.round(overlap) : 0;
      setLayout({ inset, visibleHeight: Math.round(visibleHeight) });
    };

    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("focusin", update);
    const onFocusOut = () => window.setTimeout(update, 80);
    window.addEventListener("focusout", onFocusOut);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return layout;
}
