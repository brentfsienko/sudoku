"use client";

import { useEffect, useState } from "react";
import {
  clearGreetingDismiss,
  currentDayHalf,
  dismissGreetingForHalf,
  greetingDateKey,
  greetingForUser,
  isGreetingDismissedForHalf,
} from "@/lib/greetings";

type Props = {
  userId: string;
  /** Incremented when the user taps the dog to reopen the bubble. */
  reopenToken?: number;
};

export function DogGreetingBubble({ userId, reopenToken = 0 }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const now = new Date();
    const dateKey = greetingDateKey(now);
    const half = currentDayHalf(now);
    const next = greetingForUser(userId, now);
    setMessage(next);

    // Dog tap always reopens the current half's message.
    if (reopenToken > 0) {
      clearGreetingDismiss();
      setVisible(true);
      return;
    }

    setVisible(!isGreetingDismissedForHalf(dateKey, half));
  }, [userId, reopenToken]);

  // When the clock crosses noon (or midnight), pick up the new half-day message.
  useEffect(() => {
    if (!userId) return;

    const tick = () => {
      const now = new Date();
      const dateKey = greetingDateKey(now);
      const half = currentDayHalf(now);
      const next = greetingForUser(userId, now);
      setMessage(next);
      // New half (e.g. PM after dismissing AM) is not dismissed → show again.
      if (!isGreetingDismissedForHalf(dateKey, half)) {
        setVisible(true);
      }
    };

    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [userId]);

  if (!visible || !message) return null;

  return (
    <div
      className="pointer-events-auto absolute bottom-[52%] left-[6.5rem] z-40 w-max max-w-[min(14rem,48vw)] sm:left-[7.25rem] sm:max-w-[min(15rem,52vw)]"
      role="status"
    >
      <div className="relative rounded-2xl bg-[#fff6d6] px-3 py-1.5 pb-2 shadow-[0_2px_8px_rgba(74,59,47,0.12)] ring-1 ring-[rgba(74,59,47,0.12)]">
        {/* Speech tail from bottom-left, pointing down toward the dog */}
        <span
          className="absolute bottom-0 left-3 translate-y-[95%] border-x-[6px] border-t-[8px] border-x-transparent border-t-[#fff6d6]"
          aria-hidden
        />

        <p className="line-clamp-2 font-display text-[11px] font-semibold leading-snug text-[var(--foreground)]">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              dismissGreetingForHalf(greetingDateKey(now), currentDayHalf(now));
              setVisible(false);
            }}
            className="ml-1 inline-flex h-3.5 w-3.5 translate-y-px items-center justify-center rounded-full align-middle text-[9px] font-bold leading-none text-[var(--muted)] transition hover:bg-black/5 active:text-[var(--foreground)]"
            aria-label="Dismiss greeting"
          >
            ×
          </button>
        </p>
      </div>
    </div>
  );
}
