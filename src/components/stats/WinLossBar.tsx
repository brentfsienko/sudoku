import { TrophyIcon } from "@/components/icons";

type Props = {
  wins: number;
  losses: number;
  winPct: number;
  title?: string;
};

export function WinLossBar({ wins, losses, winPct, title = "Multiplayer" }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[var(--primary)]">
          <TrophyIcon width={20} height={20} />
        </span>
        <span className="text-sm font-semibold text-[var(--muted)]">
          {winPct}% win rate · {title}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold text-[var(--foreground)]">
            {wins}
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">Wins</div>
        </div>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${winPct}%` }}
          />
        </div>
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold text-[var(--muted)]">
            {losses}
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">Losses</div>
        </div>
      </div>
    </div>
  );
}
