"use client";

const MAX_BUBBLE_TEXT = 66;

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
      {/* ~10% larger than the previous 160px / text-xs bubble */}
      <div className="relative max-w-[176px] rounded-md bg-[var(--surface)] px-3.5 py-[0.4125rem] shadow-md">
        <p className="font-display text-[13px] font-semibold leading-snug break-words text-[var(--foreground)]">
          {display}
        </p>
        {/* Tail */}
        <div
          className={`absolute top-full ${TAIL[align]}`}
          style={{
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "7px solid var(--surface)",
          }}
        />
      </div>
    </div>
  );
}
