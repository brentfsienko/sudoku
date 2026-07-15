"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Tracks which friend IDs are currently online using Supabase Realtime Presence.
 * The current user is also tracked (heartbeat) so others can see them as online.
 *
 * Returns a Set of online user IDs (excluding the current user themselves).
 */
export function useOnlineFriends(
  myUserId: string | null,
): Set<string> {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabase>>["channel"]> | null>(null);

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
        const ids = new Set(Object.keys(state));
        ids.delete(myUserId); // don't count yourself
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
