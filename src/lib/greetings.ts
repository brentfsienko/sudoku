/** Cute lowercase pup greetings for the home-tab speech bubble. */

export type DayHalf = "am" | "pm";

const INTRO_AM = "ruff ruff";
const INTRO_PM = "grrr :p";

const AM_MESSAGES = [
  "good morning, pup!",
  "early pup gets the bone!",
  "rise and sniff!",
  "morning stretch… then sudoku?",
  "don't forget today's puzzle!",
  "i could really use a bone rn...",
  "ruff ruff",
  "wagging for a win!",
  "ready when you are!",
  "paws on the board!",
  "sniff sniff… smells like sudoku",
  "who's a smart pup? you!",
];

const PM_MESSAGES = [
  "good afternoon, floof!",
  "midday puzzle break?",
  "how's the pack today?",
  "sniffing out some digits?",
  "good evening, pup!",
  "night owl mode: on",
  "one more puzzle before bed?",
  "cozy night, clever mind",
  "treats after this puzzle?",
  "zoomies for digits!",
  "grrr :p",
  "bones taste better after a win",
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Local calendar date YYYY-MM-DD. */
export function greetingDateKey(now = new Date()): string {
  return now.toLocaleDateString("en-CA");
}

/** Midnight–noon = am, noon–midnight = pm. */
export function currentDayHalf(now = new Date()): DayHalf {
  return now.getHours() < 12 ? "am" : "pm";
}

const INTRO_AM_KEY = "sudogku.greetingIntroAmSeen";
const INTRO_PM_KEY = "sudogku.greetingIntroPmSeen";

function hasSeenIntro(half: DayHalf): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(half === "am" ? INTRO_AM_KEY : INTRO_PM_KEY) === "1";
  } catch {
    return false;
  }
}

/** If this half still uses the hardcoded intro message, return that half; else null. */
export function pendingIntroHalf(now = new Date()): DayHalf | null {
  const half = currentDayHalf(now);
  return hasSeenIntro(half) ? null : half;
}

/** Mark the hardcoded first AM/PM message as consumed. */
export function markIntroGreetingSeen(half: DayHalf): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(half === "am" ? INTRO_AM_KEY : INTRO_PM_KEY, "1");
  } catch {
    // ignore quota
  }
}

/**
 * Greeting for this user + day + half.
 * First AM ever → "ruff ruff" (all users). First PM ever → "grrr :p".
 * After both intros are consumed → deterministic per-user messages.
 */
export function greetingForUser(userId: string, now = new Date()): string {
  const half = currentDayHalf(now);

  if (!hasSeenIntro(half)) {
    return half === "am" ? INTRO_AM : INTRO_PM;
  }

  const pool = half === "am" ? AM_MESSAGES : PM_MESSAGES;
  const seed = `${userId}|${greetingDateKey(now)}|${half}`;
  return pool[hashSeed(seed) % pool.length]!;
}

const DISMISS_KEY = "sudogku.greetingDismissedHalf";

function dismissToken(dateKey: string, half: DayHalf): string {
  return `${dateKey}:${half}`;
}

/** True if the user dismissed the bubble for this exact date + half. */
export function isGreetingDismissedForHalf(
  dateKey: string,
  half: DayHalf,
): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(DISMISS_KEY) === dismissToken(dateKey, half);
  } catch {
    return false;
  }
}

export function dismissGreetingForHalf(dateKey: string, half: DayHalf): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISS_KEY, dismissToken(dateKey, half));
  } catch {
    // ignore quota
  }
}

/** Clear dismiss so the bubble can show again (e.g. dog tap). */
export function clearGreetingDismiss(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    // ignore
  }
}
