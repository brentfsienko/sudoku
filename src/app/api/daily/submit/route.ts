import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dayDifficulty, getPSTDate } from "@/lib/daily/puzzle";
import { generatePuzzle } from "@/lib/sudoku/generator";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

/**
 * Verifies a daily completion against the deterministic puzzle solution,
 * then records via submit_daily_result RPC (no direct table writes).
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

  // Bind the user JWT for PostgREST/RPC. Using only `global.headers` can make
  // auth.getUser() succeed while auth.uid() is null inside RPCs (→ 400
  // "not authenticated"), which is what dropped verified daily solves.
  const sb = createClient(url, anonKey, {
    accessToken: async () => token,
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await sb.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await sb.rpc("submit_daily_result", {
    p_date: dateStr,
    p_elapsed: elapsedSeconds,
    p_mistakes: mistakes,
    p_solved: solved,
  });

  if (error) {
    console.error("[daily/submit] rpc error:", error.message, {
      dateStr,
      elapsedSeconds,
      mistakes,
      solved,
      userId: userData.user.id,
    });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
