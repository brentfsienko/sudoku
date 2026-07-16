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
      className="pointer-events-auto absolute bottom-[40%] left-[6.75rem] z-40 max-w-[min(11.5rem,40vw)] sm:left-[7.5rem]"
      role="status"
    >
      <div className="relative rounded-2xl bg-[#fff6d6] px-2.5 py-1.5 shadow-[0_2px_8px_rgba(74,59,47,0.12)] ring-1 ring-[rgba(74,59,47,0.12)]">
        {/* Speech-tail pointing left toward the dog */}
        <span
          className="absolute left-0 top-1/2 -translate-x-[6px] -translate-y-1/2 border-y-[6px] border-r-[7px] border-y-transparent border-r-[#fff6d6]"
          aria-hidden
        />

        <p className="font-display text-[12px] font-semibold leading-snug text-[var(--foreground)]">
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
