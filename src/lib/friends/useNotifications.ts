"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchMyPublicProfile } from "./api";
import type { GameInvite } from "./types";
import { GAME_MODE_LABELS } from "@/lib/game/types";

type Options = {
  userId: string | null;
  /** Called when a new friend request or game invite arrives so the UI can refresh. */
  onRefresh?: () => void;
  /** Called with a pending invite so the caller can navigate to the room. */
  onGameInvite?: (invite: Pick<GameInvite, "roomCode" | "mode">) => void;
  /** Called the first time any notification arrives — use to show a push permission prompt. */
  onFirstNotification?: () => void;
};

/**
 * Subscribes to real-time Supabase inserts on friend_requests and game_invites,
 * fires sonner toasts, and calls back so the parent can refresh its state.
 *
 * Requires Realtime to be enabled for both tables in the Supabase dashboard:
 *   Table Editor → friend_requests / game_invites → Realtime toggle ON
 */
export function useNotifications({ userId, onRefresh, onGameInvite, onFirstNotification }: Options) {
  const onRefreshRef = useRef(onRefresh);
  const onGameInviteRef = useRef(onGameInvite);
  const onFirstRef = useRef(onFirstNotification);
  const firedFirstRef = useRef(false);
  onRefreshRef.current = onRefresh;
  onGameInviteRef.current = onGameInvite;
  onFirstRef.current = onFirstNotification;

  function fireFirst() {
    if (!firedFirstRef.current) {
      firedFirstRef.current = true;
      onFirstRef.current?.();
    }
  }

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;
    const sb = getSupabase();
    if (!sb) return;

    // Friend requests channel
    const friendChannel = sb
      .channel(`notifications-friends-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friend_requests",
          filter: `to_user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("[notifications] friend_request INSERT", payload.new);
          const fromId = (payload.new as { from_user_id: string }).from_user_id;
          const profile = await fetchMyPublicProfile(fromId);
          const name = profile?.username ?? "someone";
          fireFirst();
          toast(`🐾 ${name} sent you a friend request`, {
            duration: 6000,
            action: {
              label: "view",
              onClick: () => onRefreshRef.current?.(),
            },
          });
          onRefreshRef.current?.();
        },
      )
      .subscribe((status, err) => {
        console.log("[notifications] friend_requests channel:", status, err ?? "");
      });

    // Game invites channel
    const inviteChannel = sb
      .channel(`notifications-invites-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_invites",
          filter: `guest_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("[notifications] game_invite INSERT", payload.new);
          const row = payload.new as {
            host_id: string;
            room_code: string;
            mode: GameInvite["mode"];
            difficulty: string;
          };
          const profile = await fetchMyPublicProfile(row.host_id);
          const name = profile?.username ?? "someone";
          const modeLabel = GAME_MODE_LABELS[row.mode] ?? row.mode;
          fireFirst();
          toast(`🎮 ${name} invited you to ${modeLabel}`, {
            duration: 10000,
            action: {
              label: "join →",
              onClick: () =>
                onGameInviteRef.current?.({
                  roomCode: row.room_code,
                  mode: row.mode,
                }),
            },
          });
          onRefreshRef.current?.();
        },
      )
      .subscribe((status, err) => {
        console.log("[notifications] game_invites channel:", status, err ?? "");
      });

    return () => {
      void sb.removeChannel(friendChannel);
      void sb.removeChannel(inviteChannel);
    };
  }, [userId]);
}
