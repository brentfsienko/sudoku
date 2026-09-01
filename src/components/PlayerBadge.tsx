"use client";

import type { PlayerRole } from "@/lib/game/types";
import { playerColor } from "@/lib/theme/dogs";
import { DogAvatar } from "./DogAvatar";
import { ChatBubble } from "./game/ChatBubble";

type Props = {
  name: string;
  dogId: string;
  role: PlayerRole | null;
  size?: number;
  /** Show a small subtitle (e.g. "You" or score). */
  subtitle?: string;
  online?: boolean;
  compact?: boolean;
  /** Incoming chat message to show as a speech bubble above the avatar. */
  bubble?: string | null;
  /** Which edge the bubble anchors to. Defaults to "center". */
  bubbleAlign?: "left" | "center" | "right";
};

export function PlayerBadge({
  name,
  dogId,
  role,
  size = 44,
  subtitle,
  online = true,
  compact,
  bubble,
  bubbleAlign,
}: Props) {
  const color = playerColor(role);
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {bubble && <ChatBubble text={bubble} align={bubbleAlign} />}
        <DogAvatar dogId={dogId} size={size} ringColor={color.hex} />
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
          style={{ backgroundColor: online ? "#5cc98b" : "#c7c0b6" }}
        />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div
            className="font-display truncate text-sm font-bold"
            style={{ color: color.hex }}
          >
            {name}
          </div>
          {subtitle && (
            <div className="truncate text-xs text-[var(--muted)]">{subtitle}</div>
          )}
        </div>
      )}
    </div>
  );
}
