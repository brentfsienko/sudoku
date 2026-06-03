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
};

/** Reserve space above fixed nav (tab row + safe area). Keep in sync with page main padding. */
export const BOTTOM_NAV_OFFSET =
  "calc(4.25rem + env(safe-area-inset-bottom, 0px))";

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-around pt-2.5 pb-2">
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
    </nav>
  );
}
