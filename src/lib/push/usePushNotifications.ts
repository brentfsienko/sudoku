"use client";

import { useCallback, useEffect, useState } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = {
  supported: boolean;
  permission: NotificationPermission | "unknown";
  subscribed: boolean;
};

export type UsePushNotifications = State & {
  subscribe: (userId: string) => Promise<boolean>;
  unsubscribe: () => Promise<void>;
};

export function usePushNotifications(): UsePushNotifications {
  const [state, setState] = useState<State>({
    supported: false,
    permission: "unknown",
    subscribed: false,
  });

  useEffect(() => {
    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    if (!supported) {
      setState({ supported: false, permission: "unknown", subscribed: false });
      return;
    }

    setState((s) => ({
      ...s,
      supported: true,
      permission: Notification.permission,
    }));

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        setState((s) => ({ ...s, subscribed: !!sub }));
      }),
    );
  }, []);

  const subscribe = useCallback(async (userId: string): Promise<boolean> => {
    if (!VAPID_PUBLIC) return false;
    try {
      const permission = await Notification.requestPermission();
      setState((s) => ({ ...s, permission }));
      if (permission !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      const { endpoint, keys } = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }),
      });

      if (!res.ok) return false;
      setState((s) => ({ ...s, subscribed: true }));
      return true;
    } catch (err) {
      console.error("push subscribe:", err);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      setState((s) => ({ ...s, subscribed: false }));
    } catch (err) {
      console.error("push unsubscribe:", err);
    }
  }, []);

  return { ...state, subscribe, unsubscribe };
}
