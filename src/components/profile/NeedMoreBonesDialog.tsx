"use client";

import { BoneIcon } from "@/components/BoneIcon";

type Props = {
  open: boolean;
  onClose: () => void;
  cost: number;
  balance: number;
};

export function NeedMoreBonesDialog({ open, onClose, cost, balance }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-float-in w-full max-w-xs rounded-3xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="need-bones-title"
      >
        <div className="mb-3 flex justify-center">
          <BoneIcon size={40} />
        </div>
        <h2
          id="need-bones-title"
          className="font-serif-title text-center text-xl text-[var(--foreground)]"
        >
          Need more bones
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          This pup costs {cost} bones. You have {balance}. Play games to find
          bone bonuses on the board and earn more when you win.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="ui-button mt-4 w-full rounded-full bg-[var(--foreground)] py-2.5 text-sm font-bold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
