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
      className={`flex min-h-dvh flex-col ${mobileBg} md:items-center md:justify-center md:bg-[var(--background)] md:p-6`}
    >
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col md:min-h-0 md:h-[min(90dvh,880px)] md:flex-none md:overflow-hidden md:rounded-[2rem] md:shadow-[0_12px_48px_rgba(74,59,47,0.14)] md:ring-1 md:ring-black/[0.06] ${mobileBg}`}
        style={{ backgroundColor: bg }}
      >
        {children}
      </div>
    </div>
  );
}
