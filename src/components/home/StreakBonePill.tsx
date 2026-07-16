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
      className={`flex shrink-0 items-center rounded-full bg-[var(--foreground)] py-1.5 pl-1.5 pr-2 shadow-md ${className ?? ""}`}
    >
      <div className="flex min-w-0 items-center gap-1.5 pr-1.5">
        <span className="shrink-0 text-[var(--primary)]">
          <FlameIcon width={14} height={14} />
        </span>
        <div className="leading-none">
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/65">
            Streak
          </p>
          <p className="font-display text-sm font-extrabold text-white">
            {streak} {streak === 1 ? "day" : "days"}
          </p>
        </div>
      </div>
      <div className="mx-0.5 h-7 w-px shrink-0 bg-white/25" aria-hidden />
      <div className="flex min-w-0 items-center gap-1.5 pl-1.5">
        <BoneIcon size={16} />
        <div className="leading-none">
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/65">
            Bones
          </p>
          <p className="font-display text-sm font-extrabold text-white">
            {bones}
          </p>
        </div>
      </div>
    </div>
  );
}
