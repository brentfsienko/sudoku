import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUsername } from "@/lib/stats/profile";
import { randomDogId } from "@/lib/theme/dogs";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ROOM_RE = /^floof-[A-Z]{4,8}$/;

type Body = {
  room?: string;
  name?: string;
  dogId?: string;
};

/**
 * Mints a Liveblocks session scoped to a single room.
 * Requires a Supabase access token (multiplayer is signed-in only).
 */
export async function POST(request: Request) {
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Missing LIVEBLOCKS_SECRET_KEY. Add it to .env.local (and Vercel env) to enable multiplayer.",
      },
      { status: 501 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: "Sign in to play multiplayer." },
      { status: 401 },
    );
  }

  const sb = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json(
      { error: "Sign in to play multiplayer." },
      { status: 401 },
    );
  }

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    // no body
  }

  const room = String(body.room ?? "").toUpperCase();
  if (!ROOM_RE.test(room)) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }

  const liveblocks = new Liveblocks({ secret });
  const userId = userData.user.id;
  const name = body.name?.trim() || randomUsername();
  const dogId = body.dogId || randomDogId();

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name, dogId },
  });

  // Scope access to the requested room only (not floof-*).
  session.allow(room, session.FULL_ACCESS);

  const { status, body: responseBody } = await session.authorize();
  return new NextResponse(responseBody, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
