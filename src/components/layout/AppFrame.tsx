"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Accent header (main tab); cream background on other tabs */
  variant?: "accent" | "background";
};

/**
 * Phone-sized shell on desktop: centered card with shadow; full-bleed on mobile/PWA.
 */
export function AppFrame({ children, variant = "background" }: Props) {
  const bg =
    variant === "accent" ? "var(--accent)" : "var(--background)";

  const mobileBg =
    variant === "accent" ? "bg-[var(--accent)]" : "bg-[var(--background)]";

  return (
    <div
      className={`app-mobile-shell flex flex-col overflow-hidden ${mobileBg} md:relative md:inset-auto md:h-auto md:max-h-none md:min-h-dvh md:items-center md:justify-center md:bg-[var(--background)] md:p-6`}
    >
      <div
        className={`relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden md:h-[min(90dvh,880px)] md:max-h-[min(90dvh,880px)] md:flex-none md:rounded-[2rem] md:shadow-[0_12px_48px_rgba(74,59,47,0.14)] md:ring-1 md:ring-black/[0.06] ${mobileBg}`}
        style={{ backgroundColor: bg }}
      >
        {children}
      </div>
    </div>
  );
}
