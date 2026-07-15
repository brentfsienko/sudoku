"use client";

import { BulbIcon, EraserIcon, PencilIcon } from "@/components/icons";

type Props = {
  notesMode: boolean;
  hintsRemaining: number;
  disabled?: boolean;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
};

function ActionButton({
  label,
  badge,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex flex-1 flex-col items-center gap-1 text-[var(--muted)] transition active:scale-95 disabled:opacity-30"
    >
      <span
        className={`relative flex h-12 w-12 items-center justify-center rounded-full ${
          active ? "bg-[var(--primary)] text-white" : "bg-white text-[var(--paw)]"
        } shadow-sm`}
      >
        {children}
        {badge != null && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

export function ActionBar({
  notesMode,
  hintsRemaining,
  disabled,
  onErase,
  onToggleNotes,
  onHint,
}: Props) {
  return (
    <div className="flex items-start justify-around gap-2">
      <ActionButton label="Erase" disabled={disabled} onClick={onErase}>
        <EraserIcon width={22} height={22} />
      </ActionButton>
      <ActionButton
        label={`Notes ${notesMode ? "ON" : "OFF"}`}
        active={notesMode}
        disabled={disabled}
        onClick={onToggleNotes}
      >
        <PencilIcon width={22} height={22} />
      </ActionButton>
      <ActionButton
        label="Hint"
        badge={hintsRemaining}
        disabled={disabled || hintsRemaining <= 0}
        onClick={onHint}
      >
        <BulbIcon width={22} height={22} />
      </ActionButton>
    </div>
  );
}
