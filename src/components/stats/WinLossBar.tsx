import { CrownIcon } from "@/components/icons";

type Props = {
  wins: number;
  losses: number;
  winPct: number;
};

export function WinLossBar({ wins, losses, winPct }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-4">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[var(--primary)]">
            <CrownIcon width={22} height={22} />
          </span>
          <div className="font-serif-title text-4xl leading-none text-[var(--foreground)]">
            {wins}
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">Wins</div>
        </div>
        <div className="mb-5 h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${winPct}%` }}
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="font-serif-title text-4xl leading-none text-[var(--foreground)]">
            {losses}
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">Losses</div>
        </div>
      </div>
    </div>
  );
}
