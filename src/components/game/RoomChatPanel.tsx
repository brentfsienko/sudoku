"use client";

import { useEffect, useRef, useState } from "react";
import { playerColor } from "@/lib/theme/dogs";
import { SendIcon, XIcon } from "@/components/icons";
import type { RoomChatReturn } from "@/lib/liveblocks/useRoomChat";
import type { PlayerRole } from "@/lib/game/types";

const PRESETS = ["Woof!", "Bark!", "GG", "Oops!", "🐾"];

type Props = {
  chat: RoomChatReturn;
  myRole: PlayerRole | null;
  onClose: () => void;
};

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function RoomChatPanel({ chat, myRole, onClose }: Props) {
  const { messages, send, sendPreset, markRead } = chat;
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll while chat is open (prevents page jumping on iOS keyboard).
  // iOS ignores overflow:hidden on body, so we also fix the position.
  useEffect(() => {
    const body = document.body;
    const scrollY = window.scrollY;
    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    markRead();
    return () => markRead();
  }, [markRead]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    send(text);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 360 }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--surface-soft)] px-4 py-3">
        <span className="font-display text-sm font-extrabold text-[var(--foreground)]">Chat</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-soft)] active:scale-95"
        >
          <XIcon width={16} height={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-[var(--muted)] pt-4">
            No messages yet. Say hi! 👋
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.from === myRole;
          const color = playerColor(msg.from as PlayerRole);
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  isMe
                    ? "rounded-br-sm bg-[var(--primary)] text-white"
                    : "rounded-bl-sm bg-[var(--surface-soft)] text-[var(--foreground)]"
                }`}
              >
                {!isMe && (
                  <p
                    className="font-display mb-0.5 text-xs font-bold"
                    style={{ color: color.hex }}
                  >
                    {msg.name}
                  </p>
                )}
                <p className="text-sm leading-snug break-words">
                  {msg.preset && <span className="mr-1 text-[10px] opacity-60">🐾</span>}
                  {msg.text}
                </p>
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-[var(--muted)]">
                {formatTime(msg.at)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Preset quick-send buttons */}
      <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-none">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => sendPreset(p)}
            className="font-display shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-bold text-[var(--foreground)] transition active:scale-95"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="border-t border-[var(--surface-soft)] px-3 py-2 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 120))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          maxLength={120}
          className="flex-1 rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white transition active:scale-95 disabled:opacity-40"
        >
          <SendIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
