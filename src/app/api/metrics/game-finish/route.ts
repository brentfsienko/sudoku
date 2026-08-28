import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Body = {
  userId?: string;
  mode?: string;
  solved?: boolean;
  difficulty?: string;
  elapsedSeconds?: number;
  mistakes?: number;
};

const MODES = new Set(["solo", "daily", "multiplayer"]);

async function verifyAccessToken(
  accessToken: string,
): Promise<{ id: string } | null> {
  if (!url || !anonKey) return null;
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ? { id: json.id } : null;
}

/**
 * Logs a game-finish event for Vercel Runtime Logs (Hobby-compatible).
 * Also best-effort tracks via Web Analytics custom events (Pro dashboard only).
 */
export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = String(body.mode ?? "");
  if (!MODES.has(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const verified = token ? await verifyAccessToken(token) : null;

  // Prefer verified JWT user id; fall back to client/anonymous.
  const userId = verified?.id ?? (body.userId?.trim() || "anonymous");
  const solved = Boolean(body.solved);
  const difficulty = String(body.difficulty ?? "unknown").slice(0, 32);
  const elapsedSeconds = Math.max(
    0,
    Math.floor(Number(body.elapsedSeconds) || 0),
  );
  const mistakes = Math.max(0, Math.floor(Number(body.mistakes) || 0));

  const payload = {
    event: "game_finish",
    userId,
    mode,
    solved,
    difficulty,
    elapsedSeconds,
    mistakes,
  };

  // Searchable in Vercel → Project → Logs (all plans, including Hobby).
  console.log("[metric] game_finish", JSON.stringify(payload));

  // Custom events only appear in the Analytics UI on Pro+. Safe no-op on Hobby.
  try {
    await track("GameFinish", {
      userId,
      mode,
    });
  } catch {
    // Ignore Analytics failures.
  }

  return NextResponse.json({ ok: true });
}
