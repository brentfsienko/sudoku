"use client";

import { useEffect } from "react";

/** Sync --app-height to window.innerHeight (fixes iOS home-screen PWA gap below fixed UI). */
export function ViewportHeightSync() {
  useEffect(() => {
    const root = document.documentElement;

    function update() {
      root.style.setProperty("--app-height", `${window.innerHeight}px`);
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
