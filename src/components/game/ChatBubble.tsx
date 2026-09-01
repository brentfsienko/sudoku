"use client";

const MAX_BUBBLE_TEXT = 60;

type Props = {
  text: string;
};

/**
 * A small speech-bubble overlay that appears above a player's avatar.
 * Truncates long text so it doesn't overwhelm the layout.
 */
export function ChatBubble({ text }: Props) {
  const display = text.length > MAX_BUBBLE_TEXT ? text.slice(0, MAX_BUBBLE_TEXT) + "…" : text;

  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 animate-chat-bubble">
      <div className="relative max-w-[160px] rounded-2xl bg-[var(--surface)] px-3 py-1.5 shadow-md">
        <p className="font-display whitespace-nowrap text-xs font-semibold text-[var(--foreground)]">
          {display}
        </p>
        {/* Tail */}
        <div
          className="absolute left-1/2 top-full -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid var(--surface)",
          }}
        />
      </div>
    </div>
  );
}
