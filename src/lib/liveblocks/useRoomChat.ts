"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useStorage } from "./config";
import type { ChatMessage } from "./config";
import type { PlayerRole } from "@/lib/game/types";

const MAX_MESSAGES = 50;
const MAX_TEXT_LENGTH = 120;
const BUBBLE_DURATION_MS = 4_000;

export type RoomChatReturn = {
  messages: ChatMessage[];
  send: (text: string) => void;
  sendPreset: (text: string) => void;
  unread: boolean;
  markRead: () => void;
  /** Latest preset message text keyed by sender role. Includes your own sends. */
  latestByRole: Partial<Record<string, string>>;
};

export function useRoomChat(myRole: PlayerRole | null, myName: string): RoomChatReturn {
  const rawMessages = useStorage((root) => root.messages);
  const messages: ChatMessage[] = rawMessages ? Array.from(rawMessages) : [];

  const lastReadAtRef = useRef<number>(Date.now());
  const [unread, setUnread] = useState(false);
  const [latestByRole, setLatestByRole] = useState<Partial<Record<string, string>>>({});
  const bubbleTimersRef = useRef<Partial<Record<string, ReturnType<typeof setTimeout>>>>({});

  const sendMutation = useMutation(
    (
      { storage },
      text: string,
      role: PlayerRole,
      name: string,
      preset: boolean,
    ) => {
      const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
      if (!trimmed) return;

      const list = storage.get("messages");
      if (!list) return;

      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        from: role,
        name,
        text: trimmed,
        at: Date.now(),
        ...(preset ? { preset: true } : {}),
      };

      list.push(msg);

      while (list.length > MAX_MESSAGES) {
        list.delete(0);
      }
    },
    [],
  );

  const send = useCallback(
    (text: string) => {
      if (!myRole) return;
      sendMutation(text, myRole, myName, false);
    },
    [sendMutation, myRole, myName],
  );

  const sendPreset = useCallback(
    (text: string) => {
      if (!myRole) return;
      sendMutation(text, myRole, myName, true);
    },
    [sendMutation, myRole, myName],
  );

  const markRead = useCallback(() => {
    lastReadAtRef.current = Date.now();
    setUnread(false);
  }, []);

  const prevLengthRef = useRef(messages.length);
  useEffect(() => {
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (messages.length <= prevLen) return;

    const newMsgs = messages.slice(prevLen);

    // Mark unread for messages from others
    if (newMsgs.some((m) => m.from !== myRole)) setUnread(true);

    // Show bubbles for ALL preset messages (any sender, including self)
    const presets = newMsgs.filter((m) => m.preset);
    if (presets.length > 0) {
      const updates: Partial<Record<string, string>> = {};
      for (const msg of presets) {
        updates[msg.from] = msg.text;
      }
      setLatestByRole((prev) => ({ ...prev, ...updates }));

      // Auto-clear each role's bubble independently after 4 s
      for (const msg of presets) {
        const existing = bubbleTimersRef.current[msg.from];
        if (existing) clearTimeout(existing);
        bubbleTimersRef.current[msg.from] = setTimeout(() => {
          setLatestByRole((prev) => {
            const next = { ...prev };
            delete next[msg.from];
            return next;
          });
        }, BUBBLE_DURATION_MS);
      }
    }
  }, [messages.length, messages, myRole]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      for (const id of Object.values(bubbleTimersRef.current)) {
        if (id) clearTimeout(id);
      }
    };
  }, []);

  return { messages, send, sendPreset, unread, markRead, latestByRole };
}
