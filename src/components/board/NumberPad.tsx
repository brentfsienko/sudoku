"use client";

type Props = {
  /** Count of each digit (1-9) already correctly placed. */
  counts: Record<number, number>;
  disabled?: boolean;
  onInput: (digit: number) => void;
};

export function NumberPad({ counts, disabled, onInput }: Props) {
  return (
    <div className="grid grid-cols-9 gap-1.5">
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
        const done = counts[n] >= 9;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled || done}
            onClick={() => onInput(n)}
            className="font-display flex aspect-[3/4] items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm transition active:scale-95 disabled:opacity-30 disabled:active:scale-100"
            style={{ fontSize: "min(7vw, 1.7rem)", fontWeight: 700 }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
