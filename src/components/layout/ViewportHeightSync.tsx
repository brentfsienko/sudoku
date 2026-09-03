"use client";

import { useEffect } from "react";
import {
  isEditableFocused,
  isStandalonePwa,
  measureAppHeight,
} from "@/lib/layout/standalone";

type VirtualKeyboardNav = Navigator & {
  virtualKeyboard?: { overlaysContent: boolean };
};

/** Sync viewport sizing; iOS home-screen uses full-bleed CSS instead of --app-height. */
export function ViewportHeightSync() {
  useEffect(() => {
    const root = document.documentElement;
    const vk = (navigator as VirtualKeyboardNav).virtualKeyboard;
    if (vk) vk.overlaysContent = true;

    let frozenHeight: string | null = null;

    function update() {
      const standalone = isStandalonePwa();
      root.classList.toggle("ios-standalone", standalone);
      if (standalone) {
        root.style.removeProperty("--app-height");
        frozenHeight = null;
        return;
      }
      // Keep the shell still while the software keyboard is open so chat/input
      // don't drag the whole app up and down with visualViewport.
      if (isEditableFocused()) {
        if (!frozenHeight) {
          frozenHeight =
            root.style.getPropertyValue("--app-height") ||
            `${measureAppHeight()}px`;
        }
        return;
      }
      frozenHeight = null;
      root.style.setProperty("--app-height", `${measureAppHeight()}px`);
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("focusin", update);
    const onFocusOut = () => window.setTimeout(update, 300);
    window.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return null;
}
