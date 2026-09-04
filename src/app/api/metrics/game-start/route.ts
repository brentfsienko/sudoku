import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { GAME_MODES, metricUserId } from "../shared";

type Body = {
  userId?: string;
  mode?: string;
  difficulty?: string;
};

/**
 * Logs a game-start event for Vercel Runtime Logs (Hobby-compatible).
 * Search `[metric] game_start`.
 */
export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = String(body.mode ?? "");
  if (!GAME_MODES.has(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const userId = await metricUserId(request, body.userId);
  const difficulty = String(body.difficulty ?? "unknown").slice(0, 32);

  const payload = {
    event: "game_start",
    userId,
    mode,
    difficulty,
  };

  console.log("[metric] game_start", JSON.stringify(payload));

  try {
    await track("GameStart", { userId, mode });
  } catch {
    // Ignore Analytics failures.
  }

  return NextResponse.json({ ok: true });
}
