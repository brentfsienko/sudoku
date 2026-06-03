"use client";

import { useEffect } from "react";
import { isStandalonePwa, measureAppHeight } from "@/lib/layout/standalone";

/** Sync viewport sizing; iOS home-screen uses full-bleed CSS instead of --app-height. */
export function ViewportHeightSync() {
  useEffect(() => {
    const root = document.documentElement;

    function update() {
      const standalone = isStandalonePwa();
      root.classList.toggle("ios-standalone", standalone);
      if (standalone) {
        root.style.removeProperty("--app-height");
        return;
      }
      root.style.setProperty("--app-height", `${measureAppHeight()}px`);
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  return null;
}
