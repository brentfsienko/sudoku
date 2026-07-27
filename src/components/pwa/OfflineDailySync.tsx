"use client";

import { useEffect, useRef } from "react";
import { ensureDailyResultSynced } from "@/lib/daily/api";
import { getPSTDate } from "@/lib/daily/puzzle";
import { useOnline } from "@/lib/hooks/useOnline";

/** When connectivity returns, push any local daily result that never reached the cloud. */
export function OfflineDailySync() {
  const online = useOnline();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    void ensureDailyResultSynced(getPSTDate());
  }, [online]);

  return null;
}
