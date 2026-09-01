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
  unread: boolean;
  markRead: () => void;
  /** Latest incoming message (not from me) for the speech bubble. */
  latestIncoming: ChatMessage | null;
};

export function useRoomChat(myRole: PlayerRole | null, myName: string): RoomChatReturn {
  const rawMessages = useStorage((root) => root.messages);
  const messages: ChatMessage[] = rawMessages ? Array.from(rawMessages) : [];

  const lastReadAtRef = useRef<number>(Date.now());
  const [unread, setUnread] = useState(false);
  const [latestIncoming, setLatestIncoming] = useState<ChatMessage | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMutation = useMutation(({ storage }, text: string, role: PlayerRole, name: string) => {
    const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
    if (!trimmed) return;

    let list = storage.get("messages");
    if (!list) {
      // Older room without messages list — should not happen after initialStorage change,
      // but guard defensively.
      return;
    }

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from: role,
      name,
      text: trimmed,
      at: Date.now(),
    };

    list.push(msg);

    // Trim front if over cap
    while (list.length > MAX_MESSAGES) {
      list.delete(0);
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      if (!myRole) return;
      sendMutation(text, myRole, myName);
    },
    [sendMutation, myRole, myName],
  );

  const markRead = useCallback(() => {
    lastReadAtRef.current = Date.now();
    setUnread(false);
  }, []);

  // Detect new unread messages and show incoming bubble
  const prevLengthRef = useRef(messages.length);
  useEffect(() => {
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (messages.length <= prevLen) return;

    const newMsgs = messages.slice(prevLen);
    const incoming = newMsgs.filter((m) => m.from !== myRole);

    if (incoming.length > 0) {
      setUnread(true);

      const latest = incoming[incoming.length - 1];
      setLatestIncoming(latest ?? null);

      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setLatestIncoming(null);
      }, BUBBLE_DURATION_MS);
    }
  }, [messages.length, messages, myRole]);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  return { messages, send, unread, markRead, latestIncoming };
}
