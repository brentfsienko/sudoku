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
};

/**
 * Subscribes to real-time Supabase inserts on friend_requests and game_invites,
 * fires sonner toasts, and calls back so the parent can refresh its state.
 *
 * Requires Realtime to be enabled for both tables in the Supabase dashboard:
 *   Table Editor → friend_requests / game_invites → Realtime toggle ON
 */
export function useNotifications({ userId, onRefresh, onGameInvite }: Options) {
  const onRefreshRef = useRef(onRefresh);
  const onGameInviteRef = useRef(onGameInvite);
  onRefreshRef.current = onRefresh;
  onGameInviteRef.current = onGameInvite;

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
          const fromId = (payload.new as { from_user_id: string }).from_user_id;
          const profile = await fetchMyPublicProfile(fromId);
          const name = profile?.username ?? "someone";
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
      .subscribe();

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
          const row = payload.new as {
            host_id: string;
            room_code: string;
            mode: GameInvite["mode"];
            difficulty: string;
          };
          const profile = await fetchMyPublicProfile(row.host_id);
          const name = profile?.username ?? "someone";
          const modeLabel = GAME_MODE_LABELS[row.mode] ?? row.mode;
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
      .subscribe();

    return () => {
      void sb.removeChannel(friendChannel);
      void sb.removeChannel(inviteChannel);
    };
  }, [userId]);
}
