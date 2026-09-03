"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 * Overlay chat, portaled to document.body. Does not lock body position/overflow
 * (that caused a full-page scroll jump on iOS). Background scroll is blocked
 * via touchmove on the overlay only.
 */
export function ChatSheet({ chat, myRole, onClose }: Props) {
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleClose() {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onCloseRef.current(), ANIM_MS);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);

    const resetScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
      if (document.documentElement.scrollTop) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body.scrollTop) {
        document.body.scrollTop = 0;
      }
    };
    resetScroll();
    window.addEventListener("scroll", resetScroll, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", resetScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-chat-scroll]")) return;
      e.preventDefault();
    };
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => root.removeEventListener("touchmove", onTouchMove);
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[80] overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label="Chat"
    >
      <div
        className={`absolute inset-0 ${closing ? "animate-sheet-fade-out" : "animate-sheet-fade-in"}`}
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        onClick={handleClose}
      />

      <div
        className={`absolute inset-x-4 z-10 mx-auto max-w-md overflow-hidden rounded-lg bg-white shadow-xl ${closing ? "animate-sheet-down" : "animate-sheet-up"}`}
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <RoomChatPanel chat={chat} myRole={myRole} onClose={handleClose} />
      </div>
    </div>,
    document.body,
  );
}
