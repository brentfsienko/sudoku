/**
 * Reddit Ads pixel helpers.
 * Base pixel loads via <RedditPixel />; call track* after conversions.
 */

export const REDDIT_PIXEL_ID =
  process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID?.trim() || "";

export function isRedditPixelEnabled(): boolean {
  return REDDIT_PIXEL_ID.length > 0;
}

type Rdt = (...args: unknown[]) => void;

declare global {
  interface Window {
    rdt?: Rdt & { callQueue?: unknown[][]; sendEvent?: Rdt };
  }
}

function rdt(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (typeof window.rdt === "function") {
    window.rdt(...args);
  }
}

/** Standard Reddit SignUp conversion. */
export function trackRedditSignUp() {
  if (!isRedditPixelEnabled()) return;
  rdt("track", "SignUp");
}

/**
 * Game start — Custom event so Reddit can optimize for players, not just visits.
 * mode: solo | daily | multiplayer
 */
export function trackRedditGameStart(mode: "solo" | "daily" | "multiplayer") {
  if (!isRedditPixelEnabled()) return;
  rdt("track", "Custom", { customEventName: "GameStart", mode });
}
