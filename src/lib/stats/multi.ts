import type { GameLog, MultiStats, OpponentRecord } from "./types";

/** Co-op badges / stats — green (reads clearly vs versus orange). */
export const COOP_ACCENT = "#1f9d6a";
/** Versus badges / stats — warm orange (not blue-adjacent teal or purple). */
export const VERSUS_ACCENT = "#e85d04";

export function coopWinLoss(multi: MultiStats) {
  const wins = multi.coopSolved;
  const losses = Math.max(0, multi.coopPlayed - multi.coopSolved);
  const played = multi.coopPlayed;
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;
  return { wins, losses, played, winPct };
}

export function compWinLoss(multi: MultiStats) {
  const wins = multi.compWon;
  const losses = Math.max(0, multi.compPlayed - multi.compWon - multi.compTied);
  const played = multi.compPlayed;
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;
  return {
    wins,
    losses,
    played,
    winPct,
    ties: multi.compTied,
    record: `${wins}-${losses}-${multi.compTied}`,
  };
}

export type HistoryFilter = "all" | "solo" | "coop" | "competitive";

export function filterHistory(history: GameLog[], filter: HistoryFilter): GameLog[] {
  if (filter === "all") return history;
  return history.filter((log) => log.mode === filter);
}

export function opponentModeGames(
  rec: OpponentRecord,
  mode: "coop" | "competitive",
): number {
  return mode === "coop" ? rec.coopGames : rec.compGames;
}

export function mostPlayedOpponentForMode(
  multi: MultiStats,
  mode: "coop" | "competitive",
): OpponentRecord | null {
  let best: OpponentRecord | null = null;
  for (const rec of Object.values(multi.opponents)) {
    const n = opponentModeGames(rec, mode);
    if (n <= 0) continue;
    if (!best || n > opponentModeGames(best, mode)) best = rec;
  }
  return best;
}
