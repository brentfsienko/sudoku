"use client";

import { useEffect, useState } from "react";
import { BoneIcon } from "@/components/BoneIcon";
import {
  clearGreetingDismiss,
  currentDayHalf,
  dismissGreetingForHalf,
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

const APPEAR_DELAY_MS = 750;
const CHAR_MS = 38;

function TypeCursor() {
  return (
    <span
      className="animate-greeting-cursor ml-0.5 inline-block h-[0.9em] w-[0.45em] translate-y-px bg-[var(--foreground)] align-[-0.05em]"
      aria-hidden
    />
  );
}

export function DogGreetingBubble({ userId, reopenToken = 0 }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [typedLen, setTypedLen] = useState(0);
  const [showBone, setShowBone] = useState(false);
  /** Bumps when a new talk sequence should start (load / reopen / noon). */
  const [talkSeq, setTalkSeq] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const now = new Date();
    const dateKey = greetingDateKey(now);
    const half = currentDayHalf(now);
    const intro = pendingIntroHalf(now);
    const next = greetingForUser(userId, now);
    setMessage(next);

    if (reopenToken > 0) {
      clearGreetingDismiss();
      setShouldShow(true);
      setTalkSeq((n) => n + 1);
      if (intro) markIntroGreetingSeen(intro);
      return;
    }

    const show = !isGreetingDismissedForHalf(dateKey, half);
    setShouldShow(show);
    if (show) {
      setTalkSeq((n) => n + 1);
      if (intro) markIntroGreetingSeen(intro);
    }
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
      if (!isGreetingDismissedForHalf(dateKey, half)) {
        setShouldShow(true);
        setTalkSeq((n) => n + 1);
        if (intro) markIntroGreetingSeen(intro);
      }
    };

    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [userId]);

  // Delay, then start the typewriter for each talk sequence.
  useEffect(() => {
    if (!shouldShow || !message || talkSeq === 0) {
      setRevealed(false);
      setTypedLen(0);
      setShowBone(false);
      return;
    }

    setRevealed(false);
    setTypedLen(0);
    setShowBone(false);

    const t = window.setTimeout(() => setRevealed(true), APPEAR_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [shouldShow, message, talkSeq]);

  // Letter-by-letter reveal.
  useEffect(() => {
    if (!revealed || !message) return;
    if (typedLen >= message.length) {
      setShowBone(true);
      return;
    }
    const t = window.setTimeout(() => setTypedLen((n) => n + 1), CHAR_MS);
    return () => window.clearTimeout(t);
  }, [revealed, typedLen, message]);

  if (!shouldShow || !message || !revealed) return null;

  const typed = message.slice(0, typedLen);

  return (
    <div
      className="absolute bottom-[52%] left-[6.25rem] z-[70] w-[min(15.5rem,52vw)] sm:left-[7rem] sm:w-[min(16.5rem,54vw)]"
      role="status"
    >
      <button
        type="button"
        onClick={() => {
          const now = new Date();
          dismissGreetingForHalf(greetingDateKey(now), currentDayHalf(now));
          setShouldShow(false);
          setRevealed(false);
        }}
        className="pointer-events-auto relative w-full rounded-md bg-[#fff6d6] px-2.5 py-1.5 text-left transition active:scale-[0.99]"
        style={{
          boxShadow:
            "2px 0 0 0 #1a1208, -2px 0 0 0 #1a1208, 0 2px 0 0 #1a1208, 0 -2px 0 0 #1a1208, 2px 2px 0 0 #1a1208, -2px 2px 0 0 #1a1208, 2px -2px 0 0 #1a1208, -2px -2px 0 0 #1a1208",
        }}
        aria-label="Dismiss pup message"
      >
        {/* Pixel speech tail — bottom-left corner */}
        <span
          className="absolute bottom-0 left-1.5 translate-y-full"
          aria-hidden
        >
          <span className="absolute left-0 top-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-[#1a1208]" />
          <span className="absolute left-[2px] top-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#fff6d6]" />
        </span>

        <p className="font-display text-[12px] font-bold leading-snug text-[var(--foreground)]">
          <span>{typed}</span>
          {showBone && (
            <span className="ml-1 inline-flex translate-y-0.5 align-middle">
              <BoneIcon size={14} />
            </span>
          )}
          <TypeCursor />
        </p>
      </button>
    </div>
  );
}
