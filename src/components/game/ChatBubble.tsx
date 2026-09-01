"use client";

const MAX_BUBBLE_TEXT = 60;

type Props = {
  text: string;
  /** Which edge of the avatar to anchor to. Defaults to "center". */
  align?: "left" | "center" | "right";
};

const POSITION: Record<string, string> = {
  left:   "left-0 animate-chat-bubble-left",
  center: "left-1/2 -translate-x-1/2 animate-chat-bubble",
  right:  "right-0 animate-chat-bubble-right",
};

const TAIL: Record<string, string> = {
  left:   "left-4",
  center: "left-1/2 -translate-x-1/2",
  right:  "right-4",
};

/**
 * A small speech-bubble overlay that appears above a player's avatar.
 * Truncates long text so it doesn't overwhelm the layout.
 */
export function ChatBubble({ text, align = "center" }: Props) {
  const display = text.length > MAX_BUBBLE_TEXT ? text.slice(0, MAX_BUBBLE_TEXT) + "…" : text;

  return (
    <div className={`pointer-events-none absolute bottom-full mb-1.5 ${POSITION[align]}`}>
      <div className="relative max-w-[160px] rounded-2xl bg-[var(--surface)] px-3 py-1.5 shadow-md">
        <p className="font-display whitespace-nowrap text-xs font-semibold text-[var(--foreground)]">
          {display}
        </p>
        {/* Tail */}
        <div
          className={`absolute top-full ${TAIL[align]}`}
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
