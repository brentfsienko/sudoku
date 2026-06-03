import { BoneIcon } from "@/components/BoneIcon";
import { FlameIcon } from "@/components/icons";

type Props = {
  streak: number;
  bones: number;
  className?: string;
};

export function StreakBonePill({ streak, bones, className }: Props) {
  return (
    <div
      className={`flex shrink-0 items-center rounded-full bg-white py-2 pl-2 pr-3 shadow-md ring-1 ring-black/[0.04] ${className ?? ""}`}
    >
      <div className="flex min-w-0 items-center gap-2 pr-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)]">
          <span className="text-[var(--primary)]">
            <FlameIcon width={18} height={18} />
          </span>
        </div>
        <div className="leading-none">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Streak
          </p>
          <p className="font-display text-lg font-extrabold text-[var(--foreground)]">
            {streak} {streak === 1 ? "day" : "days"}
          </p>
        </div>
      </div>
      <div
        className="mx-0.5 h-9 w-px shrink-0 bg-[var(--border)]"
        aria-hidden
      />
      <div className="flex min-w-0 items-center gap-2 pl-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)]">
          <BoneIcon size={20} />
        </div>
        <div className="leading-none">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Bones
          </p>
          <p className="font-display text-lg font-extrabold text-[var(--foreground)]">
            {bones}
          </p>
        </div>
      </div>
    </div>
  );
}
