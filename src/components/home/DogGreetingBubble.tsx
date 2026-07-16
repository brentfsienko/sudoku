"use client";

import { useEffect, useState } from "react";
import {
  clearGreetingDismiss,
  currentDayHalf,
  greetingDateKey,
  greetingForUser,
  isGreetingDismissedForHalf,
  markIntroGreetingSeen,
  pendingIntroHalf,
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
    const intro = pendingIntroHalf(now);
    const next = greetingForUser(userId, now);
    setMessage(next);

    // Dog tap always reopens the current half's message.
    if (reopenToken > 0) {
      clearGreetingDismiss();
      setVisible(true);
      if (intro) markIntroGreetingSeen(intro);
      return;
    }

    const show = !isGreetingDismissedForHalf(dateKey, half);
    setVisible(show);
    if (show && intro) markIntroGreetingSeen(intro);
  }, [userId, reopenToken]);

  // When the clock crosses noon (or midnight), pick up the new half-day message.
  useEffect(() => {
    if (!userId) return;

    const tick = () => {
      const now = new Date();
      const dateKey = greetingDateKey(now);
      const half = currentDayHalf(now);
      const intro = pendingIntroHalf(now);
      const next = greetingForUser(userId, now);
      setMessage(next);
      // New half (e.g. PM after dismissing AM) is not dismissed → show again.
      if (!isGreetingDismissedForHalf(dateKey, half)) {
        setVisible(true);
        if (intro) markIntroGreetingSeen(intro);
      }
    };

    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [userId]);

  if (!visible || !message) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-[52%] left-[6.5rem] z-[70] w-max max-w-[min(14rem,48vw)] sm:left-[7.25rem] sm:max-w-[min(15rem,52vw)]"
      role="status"
    >
      <div
        className="relative rounded-md bg-[#fff6d6] px-3 py-1.5"
        style={{
          /* Chunky pixel-ish black outline */
          boxShadow:
            "2px 0 0 0 #1a1208, -2px 0 0 0 #1a1208, 0 2px 0 0 #1a1208, 0 -2px 0 0 #1a1208, 2px 2px 0 0 #1a1208, -2px 2px 0 0 #1a1208, 2px -2px 0 0 #1a1208, -2px -2px 0 0 #1a1208",
        }}
      >
        {/* Pixel speech tail — bottom-left corner, black outline + cream fill */}
        <span
          className="absolute bottom-0 left-1.5 translate-y-full"
          aria-hidden
        >
          <span className="absolute left-0 top-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-[#1a1208]" />
          <span className="absolute left-[2px] top-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#fff6d6]" />
        </span>

        <p className="line-clamp-2 font-display text-sm font-extrabold leading-snug text-[var(--foreground)]">
          {message}
        </p>
      </div>
    </div>
  );
}
