"use client";

export type HomeTab = "main" | "daily" | "me";

const TABS: { id: HomeTab; label: string; icon: string }[] = [
  { id: "main", label: "Main", icon: "🏠" },
  { id: "daily", label: "Daily", icon: "📅" },
  { id: "me", label: "Me", icon: "🐾" },
];

type Props = {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
};

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-md items-stretch justify-around"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5"
              style={{ color: isActive ? "var(--primary)" : "var(--muted)" }}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="text-xs font-bold">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
