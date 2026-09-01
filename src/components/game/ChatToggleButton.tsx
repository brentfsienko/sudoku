"use client";

import { ChatIcon } from "@/components/icons";

type Props = {
  unread: boolean;
  onClick: () => void;
};

export function ChatToggleButton({ unread, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open chat"
      className="relative flex h-9 w-9 items-center justify-center rounded-md bg-white text-[var(--paw)] shadow-sm active:scale-95"
    >
      <ChatIcon width={20} height={20} />
      {unread && (
        <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
      )}
    </button>
  );
}
