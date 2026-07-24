import { NextResponse } from "next/server";
import { dayDifficulty, getPSTDate } from "@/lib/daily/puzzle";
import { generatePuzzle } from "@/lib/sudoku/generator";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
/** Prefer secret/service role so inserts don't depend on PostgREST auth.uid(). */
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

type Body = {
  dateStr?: string;
  elapsedSeconds?: number;
  mistakes?: number;
  solved?: boolean;
  /** 81-char board of digits 1-9 (0 or '.' for empty). Required when solved. */
  board?: string;
};

/** Same seed path as client getDailyPuzzle — kept local to avoid client-module imports. */
function dailySolution(dateStr: string): string {
  const seed = dateStr
    .split("")
    .filter((c) => c !== "-")
    .reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
  let s = seed | 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return generatePuzzle(dayDifficulty(dateStr), rng).solution;
}

function normalizeBoard(raw: string): string | null {
  if (raw.length !== 81) return null;
  let out = "";
  for (const ch of raw) {
    if (ch >= "1" && ch <= "9") out += ch;
    else if (ch === "0" || ch === "." || ch === " ") out += "0";
    else return null;
  }
  return out;
}

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
 * Upsert daily result with service role (bypasses auth.uid() / JWT signing issues).
 * Mirrors submit_daily_result keep-better-time logic. Uses raw REST — no supabase-js
 * on the server (avoids auth.uid() null + realtime init issues).
 */
async function upsertDailyResult(args: {
  userId: string;
  dateStr: string;
  elapsedSeconds: number;
  mistakes: number;
  solved: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!url || !serviceKey) {
    return { ok: false, error: "Server missing SUPABASE_SECRET_KEY" };
  }

  const mistakes = Math.min(Math.max(args.mistakes, 0), 10);
  let elapsed = Math.min(Math.max(args.elapsedSeconds, 0), 86400);
  if (!args.solved) elapsed = 0;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const existingRes = await fetch(
    `${url}/rest/v1/daily_results?user_id=eq.${encodeURIComponent(args.userId)}&puzzle_date=eq.${encodeURIComponent(args.dateStr)}&select=elapsed_seconds,solved`,
    { headers, cache: "no-store" },
  );
  if (!existingRes.ok) {
    const text = await existingRes.text();
    return { ok: false, error: text || `Read failed (${existingRes.status})` };
  }

  const existingRows = (await existingRes.json()) as Array<{
    elapsed_seconds: number;
    solved: boolean;
  }>;
  const existing = existingRows[0];

  if (existing) {
    if (existing.solved && !args.solved) return { ok: true };
    if (
      existing.solved &&
      args.solved &&
      Number(existing.elapsed_seconds) <= elapsed
    ) {
      return { ok: true };
    }
  }

  const upsertRes = await fetch(`${url}/rest/v1/daily_results`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: args.userId,
      puzzle_date: args.dateStr,
      elapsed_seconds: elapsed,
      mistakes,
      solved: args.solved,
      completed_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (!upsertRes.ok) {
    const text = await upsertRes.text();
    return { ok: false, error: text || `Upsert failed (${upsertRes.status})` };
  }

  return { ok: true };
}

/**
 * Verifies a daily completion against the deterministic puzzle solution,
 * then records the result with the service-role key (Auth verifies the user JWT).
 */
export async function POST(request: Request) {
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dateStr = body.dateStr?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const today = getPSTDate();
  if (dateStr > today) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const solved = Boolean(body.solved);
  const elapsedSeconds = Math.max(0, Math.floor(Number(body.elapsedSeconds) || 0));
  const mistakes = Math.max(0, Math.floor(Number(body.mistakes) || 0));

  if (solved) {
    const board = normalizeBoard(String(body.board ?? ""));
    if (!board) {
      return NextResponse.json({ error: "Invalid board" }, { status: 400 });
    }
    if (board !== dailySolution(dateStr)) {
      return NextResponse.json({ error: "Board incorrect" }, { status: 400 });
    }
  }

  const user = await verifyAccessToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!serviceKey) {
    console.error(
      "[daily/submit] SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is not set",
    );
    return NextResponse.json(
      {
        error:
          "Server misconfigured: add SUPABASE_SECRET_KEY to write daily results",
      },
      { status: 501 },
    );
  }

  const written = await upsertDailyResult({
    userId: user.id,
    dateStr,
    elapsedSeconds,
    mistakes,
    solved,
  });

  if (!written.ok) {
    console.error("[daily/submit] upsert error:", written.error, {
      dateStr,
      elapsedSeconds,
      mistakes,
      solved,
      userId: user.id,
    });
    return NextResponse.json({ error: written.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
