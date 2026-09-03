"use client";

import { useEffect, useState } from "react";
import { fetchMyDailyResult } from "@/lib/daily/api";
import { hydrateDailyFromRemote } from "@/lib/daily/hydrate";
import { loadDailyResultLocal } from "@/lib/daily/local";
import { getDailyActiveId } from "@/lib/daily/puzzle";
import { isSoloFinished } from "@/lib/game/finishedSolo";
import { STATS_UPDATED_EVENT } from "@/lib/stats/store";

export type DailyCompletion = {
  complete: boolean;
  solved: boolean | null;
  myTime: number | null;
  loading: boolean;
};

function readLocal(dateStr: string): Omit<DailyCompletion, "loading"> {
  const local = loadDailyResultLocal(dateStr);
  if (local) {
    return {
      complete: true,
      solved: local.solved,
      myTime: local.solved ? local.elapsedSeconds : null,
    };
  }
  if (isSoloFinished(getDailyActiveId(dateStr))) {
    return { complete: true, solved: null, myTime: null };
  }
  return { complete: false, solved: null, myTime: null };
}

/**
 * Daily completion for this device, reconciled with Supabase so a solve on
 * phone/laptop shows as done on the other.
 */
export function useDailyCompletion(dateStr: string): DailyCompletion {
  const [state, setState] = useState<DailyCompletion>(() => {
    const local = readLocal(dateStr);
    return { ...local, loading: !local.complete };
  });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const local = readLocal(dateStr);
      setState((prev) => ({ ...prev, ...local, loading: prev.loading && !local.complete }));

      const remote = await fetchMyDailyResult(dateStr);
      if (cancelled) return;
      if (remote) {
        hydrateDailyFromRemote(dateStr, remote);
        setState({
          complete: true,
          solved: remote.solved,
          myTime: remote.solved ? remote.elapsedSeconds : null,
          loading: false,
        });
        return;
      }
      setState({ ...readLocal(dateStr), loading: false });
    }

    void refresh();

    const onStats = () => void refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener(STATS_UPDATED_EVENT, onStats);
    window.addEventListener("focus", onStats);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.removeEventListener(STATS_UPDATED_EVENT, onStats);
      window.removeEventListener("focus", onStats);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [dateStr]);

  return state;
}
