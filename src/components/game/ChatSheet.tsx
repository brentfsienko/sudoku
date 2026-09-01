"use client";

import { useState } from "react";
import { RoomChatPanel } from "./RoomChatPanel";
import type { RoomChatReturn } from "@/lib/liveblocks/useRoomChat";
import type { PlayerRole } from "@/lib/game/types";

const ANIM_MS = 300;

type Props = {
  chat: RoomChatReturn;
  myRole: PlayerRole | null;
  onClose: () => void;
};

/**
 * Bottom-sheet overlay for the chat panel.
 * Slides up on open, slides down on close; backdrop fades in/out.
 * Both the lobby and the in-game view use this component.
 */
export function ChatSheet({ chat, myRole, onClose }: Props) {
  const [closing, setClosing] = useState(false);

  function handleClose() {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, ANIM_MS);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 ${closing ? "animate-sheet-fade-out" : "animate-sheet-fade-in"}`}
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        onClick={handleClose}
      />

      {/* Sheet — use inset-x + margin auto to center without transform conflicts */}
      <div
        className={`fixed inset-x-4 z-50 mx-auto max-w-md rounded-lg bg-white shadow-xl overflow-hidden ${closing ? "animate-sheet-down" : "animate-sheet-up"}`}
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 1rem)",
        }}
      >
        <RoomChatPanel chat={chat} myRole={myRole} onClose={handleClose} />
      </div>
    </>
  );
}
