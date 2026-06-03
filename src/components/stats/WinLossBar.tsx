import { CrownIcon } from "@/components/icons";

type Props = {
  wins: number;
  losses: number;
  winPct: number;
  title?: string;
  subtitle?: string;
  color?: string;
};

export function WinLossBar({
  wins,
  losses,
  winPct,
  title,
  subtitle,
  color = "var(--primary)",
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-sm font-extrabold text-[var(--foreground)]">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs font-semibold text-[var(--muted)]">{subtitle}</span>
          )}
        </div>
      )}
      <div className="flex items-end gap-4">
        <div className="flex flex-col items-center gap-0.5">
          <span style={{ color }}>
            <CrownIcon width={22} height={22} />
          </span>
          <div className="font-serif-title text-4xl leading-none text-[var(--foreground)]">
            {wins}
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">Wins</div>
        </div>
        <div className="mb-5 h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${winPct}%`, backgroundColor: color }}
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
