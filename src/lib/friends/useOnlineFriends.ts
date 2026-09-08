"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

function sameIds(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const id of b) if (!a.has(id)) return false;
  return true;
}

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
    let emptyTimer: ReturnType<typeof setTimeout> | null = null;

    const apply = (ids: Set<string>) => {
      setOnlineIds((prev) => (sameIds(prev, ids) ? prev : ids));
    };

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
        if (emptyTimer) {
          clearTimeout(emptyTimer);
          emptyTimer = null;
        }
        // Reconnects briefly report nobody home; wait before dropping greens.
        if (ids.size === 0) {
          emptyTimer = setTimeout(() => apply(ids), 450);
          return;
        }
        apply(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: myUserId, online_at: Date.now() });
        }
      });

    return () => {
      if (emptyTimer) clearTimeout(emptyTimer);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [myUserId]);

  return onlineIds;
}
