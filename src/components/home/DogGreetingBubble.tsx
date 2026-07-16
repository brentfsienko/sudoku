"use client";

import { useEffect, useState } from "react";
import {
  dismissGreeting,
  isGreetingDismissed,
  pickGreeting,
} from "@/lib/greetings";

export function DogGreetingBubble() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isGreetingDismissed()) return;
    setMessage(pickGreeting());
  }, []);

  if (!message) return null;

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

        <p className="line-clamp-2 font-display text-[12px] font-semibold leading-snug text-[var(--foreground)]">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => {
              dismissGreeting();
              setMessage(null);
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
