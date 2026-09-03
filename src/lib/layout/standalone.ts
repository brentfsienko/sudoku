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

export function isEditableFocused(): boolean {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Layout height for the app shell. Prefer the larger of innerHeight and
 * clientHeight so the URL bar hide/show is covered, but do not follow the
 * visual viewport — that shrinks with the iOS keyboard and resizes the app.
 */
export function measureAppHeight(): number {
  return Math.max(window.innerHeight, document.documentElement.clientHeight);
}
