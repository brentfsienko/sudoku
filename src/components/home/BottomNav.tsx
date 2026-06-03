"use client";

import type { ComponentType, SVGProps } from "react";
import { HomeIcon, PawIcon, UsersIcon } from "@/components/icons";

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
};

/** Tab row only (safe area is on the nav shell). Used for Play sheet min-height. */
export const BOTTOM_NAV_ROW = "3.5rem";

function NavTabs({
  active,
  onChange,
}: {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
}) {
  return (
    <div className="flex items-stretch justify-around pt-2.5 pb-2">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="group flex flex-1 flex-col items-center gap-1"
            aria-current={isActive ? "page" : undefined}
          >
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

export function BottomNav({ active, onChange, variant = "inline" }: Props) {
  if (variant === "dock") {
    return (
      <nav
        className="bottom-nav-dock border-t border-[var(--border)] md:hidden"
        aria-label="Main navigation"
      >
        <NavTabs active={active} onChange={onChange} />
      </nav>
    );
  }

  return (
    <nav
      className="mt-auto hidden w-full shrink-0 border-t border-[var(--border)] bg-[var(--surface)] md:block"
      aria-label="Main navigation"
    >
      <NavTabs active={active} onChange={onChange} />
    </nav>
  );
}
