import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  empty?: string;
};

export function FriendListPanel({ title, children, empty }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-serif-title text-xl text-[var(--foreground)]">{title}</h2>
      <div className="overflow-hidden rounded-2xl bg-[var(--list-panel)]">
        {empty ? (
          <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">{empty}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

type RowProps = {
  avatar: ReactNode;
  primary: string;
  secondary?: string;
  action: ReactNode;
  divider?: boolean;
};

export function FriendListRow({
  avatar,
  primary,
  secondary,
  action,
  divider = true,
}: RowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${
        divider ? "border-b border-white/70 last:border-b-0" : ""
      }`}
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold text-[var(--foreground)]">
          {primary}
        </div>
        {secondary && (
          <div className="truncate text-xs text-[var(--muted)]">{secondary}</div>
        )}
      </div>
      {action}
    </div>
  );
}

export function FriendPillButton({
  children,
  onClick,
  variant = "neutral",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "neutral" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition active:scale-95 ${
        variant === "primary"
          ? "bg-[var(--foreground)] text-white"
          : "border border-[var(--border)] bg-white text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}
