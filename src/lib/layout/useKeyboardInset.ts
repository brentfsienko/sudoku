"use client";

import { useEffect, useState } from "react";
import { isEditableFocused } from "@/lib/layout/standalone";

/**
 * Pixels the software keyboard covers at the bottom of the layout viewport.
 * 0 when the keyboard is closed. Used to park a sheet above the keys without
 * resizing the whole app (interactive-widget: overlays-content).
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInset(isEditableFocused() && overlap > 80 ? Math.round(overlap) : 0);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("focusin", update);
    const onFocusOut = () => window.setTimeout(update, 80);
    window.addEventListener("focusout", onFocusOut);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return inset;
}
