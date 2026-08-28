import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  const email = process.env.VAPID_EMAIL ?? "mailto:hello@sudogku.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(email, publicKey, privateKey);
  return true;
}

type SendBody = {
  toUserId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Send a push notification to all registered devices for a user.
 * Called server-side (from api.ts) after friend requests / game invites are created.
 */
export async function POST(request: NextRequest) {
  if (!configureWebPush()) {
    console.error("push/send: VAPID keys not configured");
    return NextResponse.json({ ok: true }); // Soft-fail — don't break callers
  }

  let body: SendBody;
  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { toUserId, title, body: msgBody, url = "/", tag } = body;
  if (!toUserId || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const sb = adminClient();
  const { data: subs, error } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", toUserId);

  if (error) {
    console.error("push/send fetch subs:", error);
    return NextResponse.json({ ok: true }); // Still soft-fail
  }

  if (!subs?.length) return NextResponse.json({ ok: true });

  const payload = JSON.stringify({ title, body: msgBody, url, tag });
  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    (subs as SubscriptionRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 410 Gone / 404 Not Found = subscription is no longer valid
        if (status === 410 || status === 404) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error("push/send sendNotification:", err);
        }
      }
    }),
  );

  // Clean up expired subscriptions
  if (staleEndpoints.length > 0) {
    await sb.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return NextResponse.json({ ok: true });
}
