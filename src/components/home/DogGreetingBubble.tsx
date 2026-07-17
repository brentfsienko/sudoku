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
/** Per-character delay — 50% slower than the original 38ms. */
const CHAR_MS = 76;

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
      /* Max width reaches just shy of the streak/bones pill on typical phones */
      className="absolute bottom-[52%] left-[6.25rem] z-[70] w-[min(10.25rem,34vw)] sm:left-[7rem] sm:w-[min(10.75rem,36vw)]"
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
        className="pointer-events-auto relative w-full rounded-md border-[0.5px] border-[#1a1208] bg-[#fff6d6] px-1.5 py-1 text-left transition active:scale-[0.99]"
        aria-label="Dismiss pup message"
      >
        {/* Diagonal speech tail from bottom-left toward the pup */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[4px] left-[6px] z-0 h-[8px] w-[8px] rotate-45 border-b-[0.5px] border-r-[0.5px] border-[#1a1208] bg-[#fff6d6]"
        />

        <p className="font-typewriter line-clamp-2 break-words text-[11px] font-normal leading-snug text-[var(--foreground)]">
          <span>{typed}</span>
          {showBone && (
            <span className="ml-0.5 inline-flex -translate-y-0.5 align-middle">
              <BoneIcon size={11} />
            </span>
          )}
          <TypeCursor />
        </p>
      </button>
    </div>
  );
}
