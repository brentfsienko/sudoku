/** True when opened from iPhone home screen (Add to Home Screen). */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Legacy iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

/** Full visible height for standalone; innerHeight alone leaves a gap on iOS. */
export function measureAppHeight(): number {
  const vv = window.visualViewport;
  if (vv) {
    return Math.max(
      window.innerHeight,
      Math.round(vv.height + vv.offsetTop),
      document.documentElement.clientHeight,
    );
  }
  return window.innerHeight;
}
