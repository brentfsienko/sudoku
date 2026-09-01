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
  /** Latest PRESET incoming message (not from me) for the speech bubble. */
  latestIncoming: ChatMessage | null;
};

export function useRoomChat(myRole: PlayerRole | null, myName: string): RoomChatReturn {
  const rawMessages = useStorage((root) => root.messages);
  const messages: ChatMessage[] = rawMessages ? Array.from(rawMessages) : [];

  const lastReadAtRef = useRef<number>(Date.now());
  const [unread, setUnread] = useState(false);
  const [latestIncoming, setLatestIncoming] = useState<ChatMessage | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Detect new messages: mark unread for all incoming, but only show bubble for presets.
  const prevLengthRef = useRef(messages.length);
  useEffect(() => {
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (messages.length <= prevLen) return;

    const newMsgs = messages.slice(prevLen);
    const incoming = newMsgs.filter((m) => m.from !== myRole);

    if (incoming.length > 0) {
      setUnread(true);

      // Only preset messages drive the speech bubble
      const incomingPresets = incoming.filter((m) => m.preset);
      if (incomingPresets.length > 0) {
        const latest = incomingPresets[incomingPresets.length - 1];
        setLatestIncoming(latest ?? null);

        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = setTimeout(() => {
          setLatestIncoming(null);
        }, BUBBLE_DURATION_MS);
      }
    }
  }, [messages.length, messages, myRole]);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  return { messages, send, sendPreset, unread, markRead, latestIncoming };
}
