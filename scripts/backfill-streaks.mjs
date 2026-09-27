/**
 * Recompute day streaks from recorded games + daily results (Pacific dates,
 * matching the daily puzzle calendar). Never lowers a stored streak.
 *
 *   node scripts/backfill-streaks.mjs --dry-run
 *   node scripts/backfill-streaks.mjs --apply
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const TZ = "America/Los_Angeles";

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq);
      let val = trimmed.slice(eq + 1);
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = val;
    }
  } catch {
    // optional
  }
}

loadEnvFile(new URL("../.env.local", import.meta.url).pathname);
if (process.env.SUDOKU_BACKFILL_ENV) {
  loadEnvFile(process.env.SUDOKU_BACKFILL_ENV);
}

function dateKeyInTimeZone(ms, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function calendarDaysBetween(earlier, later) {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(earlier);
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(later);
  if (!a || !b) return null;
  const ms =
    Date.UTC(Number(b[1]), Number(b[2]) - 1, Number(b[3])) -
    Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
  return Math.round(ms / 86_400_000);
}

function isHourlyPlaceholderCluster(history) {
  const skip = new Set();
  const solos = history
    .map((log, i) => ({ log, i }))
    .filter(
      ({ log }) =>
        log.mode === "solo" &&
        !log.daily &&
        (log.squares ?? 0) === 0 &&
        (log.mistakes ?? 0) === 0 &&
        !log.opponentName &&
        typeof log.t === "number",
    )
    .sort((a, b) => a.log.t - b.log.t);
  if (solos.length < 3) return skip;
  let run = [solos[0].i];
  for (let i = 1; i < solos.length; i++) {
    const dt = solos[i].log.t - solos[i - 1].log.t;
    if (dt >= 3_500_000 && dt <= 3_700_000) run.push(solos[i].i);
    else {
      if (run.length >= 3) for (const idx of run) skip.add(idx);
      run = [solos[i].i];
    }
  }
  if (run.length >= 3) for (const idx of run) skip.add(idx);
  return skip;
}

function playDaysFromHistory(history, extraDays = []) {
  const days = new Set(extraDays.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)));
  const logs = Array.isArray(history) ? history : [];
  const skip = isHourlyPlaceholderCluster(logs);
  logs.forEach((log, i) => {
    if (skip.has(i)) return;
    if (typeof log.t !== "number" || !Number.isFinite(log.t)) return;
    days.add(dateKeyInTimeZone(log.t, TZ));
  });
  return [...days].sort();
}

function streakFromPlayDays(days) {
  const unique = [...new Set(days)].sort();
  if (unique.length === 0) {
    return { streak: 0, bestStreak: 0, lastPlayedDate: null };
  }
  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const gap = calendarDaysBetween(unique[i - 1], unique[i]);
    if (gap === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
  }
  let streak = 1;
  for (let i = unique.length - 1; i > 0; i--) {
    if (calendarDaysBetween(unique[i - 1], unique[i]) === 1) streak += 1;
    else break;
  }
  return {
    streak,
    bestStreak: best,
    lastPlayedDate: unique[unique.length - 1] ?? null,
  };
}

function repairSolo(solo, history, extraDays) {
  const computed = streakFromPlayDays(playDaysFromHistory(history, extraDays));
  let lastPlayedDate = solo.lastPlayedDate ?? null;
  if (computed.lastPlayedDate) {
    if (!lastPlayedDate || lastPlayedDate < computed.lastPlayedDate) {
      lastPlayedDate = computed.lastPlayedDate;
    } else {
      const ahead = calendarDaysBetween(computed.lastPlayedDate, lastPlayedDate);
      if (ahead === 1) lastPlayedDate = computed.lastPlayedDate;
    }
  }
  return {
    streak: Math.max(solo.streak ?? 0, computed.streak),
    bestStreak: Math.max(solo.bestStreak ?? 0, computed.bestStreak, Math.max(solo.streak ?? 0, computed.streak)),
    lastPlayedDate,
    computed,
  };
}

async function allUserData(sb) {
  const rows = [];
  let from = 0;
  const page = 500;
  for (;;) {
    const { data, error } = await sb
      .from("user_data")
      .select("user_id, data")
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

async function allDailyDays(sb) {
  const byUser = new Map();
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await sb
      .from("daily_results")
      .select("user_id, puzzle_date")
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      const list = byUser.get(row.user_id) ?? [];
      list.push(row.puzzle_date);
      byUser.set(row.user_id, list);
    }
    if (data.length < page) break;
    from += page;
  }
  return byUser;
}

async function emailMap(sb) {
  const map = new Map();
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) map.set(u.id, u.email ?? "");
    if (users.length < 200) break;
    page += 1;
  }
  return map;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const [rows, dailyByUser, emails] = await Promise.all([
    allUserData(sb),
    allDailyDays(sb),
    emailMap(sb),
  ]);

  const changes = [];
  for (const row of rows) {
    const data = row.data && typeof row.data === "object" ? row.data : {};
    const solo = data.solo ?? {};
    const repaired = repairSolo(
      solo,
      data.history,
      dailyByUser.get(row.user_id) ?? [],
    );
    const streakUp = repaired.streak > (solo.streak ?? 0);
    const bestUp = repaired.bestStreak > (solo.bestStreak ?? 0);
    const lastChanged = repaired.lastPlayedDate !== (solo.lastPlayedDate ?? null);
    if (!streakUp && !bestUp && !lastChanged) continue;
    changes.push({
      user_id: row.user_id,
      email: emails.get(row.user_id) ?? "",
      from: {
        streak: solo.streak ?? 0,
        bestStreak: solo.bestStreak ?? 0,
        lastPlayedDate: solo.lastPlayedDate ?? null,
      },
      to: {
        streak: repaired.streak,
        bestStreak: repaired.bestStreak,
        lastPlayedDate: repaired.lastPlayedDate,
      },
      historyDays: repaired.computed,
    });
    if (APPLY) {
      const next = {
        ...data,
        solo: {
          ...solo,
          streak: repaired.streak,
          bestStreak: repaired.bestStreak,
          lastPlayedDate: repaired.lastPlayedDate,
        },
      };
      const { error } = await sb
        .from("user_data")
        .update({ data: next, updated_at: new Date().toISOString() })
        .eq("user_id", row.user_id);
      if (error) throw error;
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        accounts: rows.length,
        changed: changes.length,
        changes,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
