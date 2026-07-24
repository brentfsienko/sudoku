"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Tracks which user IDs are currently online using Supabase Realtime Presence.
 * Presence key must equal the tracked user_id payload (rejects mismatched spoofs).
 * Callers should intersect with their friend list before displaying.
 */
export function useOnlineFriends(myUserId: string | null): Set<string> {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<
    NonNullable<ReturnType<typeof getSupabase>>["channel"]
  > | null>(null);

  useEffect(() => {
    if (!myUserId || !isSupabaseConfigured) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase.channel("sudogku-online", {
      config: { presence: { key: myUserId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids = new Set<string>();
        for (const key of Object.keys(state)) {
          if (key === myUserId) continue;
          const metas = state[key] ?? [];
          // Require key === user_id so a client cannot track as someone else
          // while advertising a different presence key.
          if (metas.some((m) => m.user_id === key)) {
            ids.add(key);
          }
        }
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: myUserId, online_at: Date.now() });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [myUserId]);

  return onlineIds;
}
