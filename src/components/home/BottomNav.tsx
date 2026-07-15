"use client";

import type { ComponentType, SVGProps } from "react";
import { HomeIcon, PawIcon, UsersIcon } from "@/components/icons";
import type { CoachmarkStep } from "@/lib/onboarding";

export type HomeTab = "main" | "friends" | "me";

const TABS: {
  id: HomeTab;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { id: "main", label: "Play", Icon: HomeIcon },
  { id: "friends", label: "Friends", Icon: UsersIcon },
  { id: "me", label: "Me", Icon: PawIcon },
];

type Props = {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
  /** Mobile: docked in viewport root. Desktop: in-flow at bottom of app card. */
  variant?: "dock" | "inline";
  /** When "nav", show a coachmark nudging the user to tap the Me tab. */
  coachmarkStep?: CoachmarkStep | null;
};

/** Tab row only (safe area is on the nav shell). Used for Play sheet min-height. */
export const BOTTOM_NAV_ROW = "3.5rem";

function NavTabs({
  active,
  onChange,
  coachmarkStep,
}: {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
  coachmarkStep?: CoachmarkStep | null;
}) {
  return (
    <div className="flex items-stretch justify-around pt-2.5 pb-2">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const showMeNudge = id === "me" && coachmarkStep === "nav";

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="group relative flex flex-1 flex-col items-center gap-1"
            aria-current={isActive ? "page" : undefined}
          >
            {showMeNudge && (
              <>
                {/* Speech bubble above the Me tab */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap">
                  <div className="relative rounded-xl bg-[var(--foreground)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
                    Customize your pup! 🐾
                    {/* Caret pointing down */}
                    <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]" />
                  </div>
                </div>
                {/* Pulsing orange dot on the icon */}
                <span className="absolute right-[calc(50%-18px)] top-0 h-2.5 w-2.5 animate-ping rounded-full bg-[var(--primary)] opacity-75" />
                <span className="absolute right-[calc(50%-18px)] top-0 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
              </>
            )}

            <span
              className={`flex h-9 w-14 items-center justify-center rounded-full transition-colors ${
                isActive ? "bg-[var(--primary-soft)]" : "bg-transparent"
              }`}
              style={{ color: isActive ? "var(--primary)" : "var(--muted)" }}
            >
              <Icon
                width={24}
                height={24}
                strokeWidth={isActive ? 2.4 : 2}
              />
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: isActive ? "var(--primary)" : "var(--muted)" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function BottomNav({ active, onChange, variant = "inline", coachmarkStep }: Props) {
  if (variant === "dock") {
    return (
      <nav
        className="bottom-nav-dock border-t border-[var(--border)] md:hidden"
        aria-label="Main navigation"
      >
        <NavTabs active={active} onChange={onChange} coachmarkStep={coachmarkStep} />
      </nav>
    );
  }

  return (
    <nav
      className="mt-auto hidden w-full shrink-0 border-t border-[var(--border)] bg-[var(--surface)] md:block"
      aria-label="Main navigation"
    >
      <NavTabs active={active} onChange={onChange} coachmarkStep={coachmarkStep} />
    </nav>
  );
}
