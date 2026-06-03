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

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="z-10 shrink-0 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="group flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5"
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
      {/* Fills home-indicator inset so accent doesn’t show below the bar */}
      <div
        aria-hidden
        className="bg-[var(--surface)]"
        style={{ height: "env(safe-area-inset-bottom, 0px)" }}
      />
    </nav>
  );
}
