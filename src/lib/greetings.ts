/** Cute lowercase pup greetings for the home-tab speech bubble. */

const MORNING = [
  "good morning, pup!",
  "early pup gets the bone!",
  "rise and sniff!",
  "morning stretch… then sudoku?",
];

const AFTERNOON = [
  "good afternoon, floof!",
  "midday puzzle break?",
  "how's the pack today?",
  "sniffing out some digits?",
];

const EVENING = [
  "good evening, pup!",
  "night owl mode: on",
  "one more puzzle before bed?",
  "cozy night, clever mind",
];

const ANYTIME = [
  "don't forget today's puzzle!",
  "i could really use a bone rn...",
  "ruff ruff",
  "grrr :p",
  "wagging for a win!",
  "ready when you are!",
  "treats after this puzzle?",
  "zoomies for digits!",
  "who's a smart pup? you!",
  "bones taste better after a win",
  "paws on the board!",
  "sniff sniff… smells like sudoku",
];

function hourBucket(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Pick a random greeting, biased toward the current time of day. */
export function pickGreeting(now = new Date()): string {
  const bucket = hourBucket(now.getHours());
  const timed =
    bucket === "morning" ? MORNING : bucket === "afternoon" ? AFTERNOON : EVENING;
  const pool = [...timed, ...ANYTIME, ...ANYTIME];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

const DISMISS_KEY = "sudogku.greetingDismissed";

export function isGreetingDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissGreeting(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // ignore quota
  }
}
