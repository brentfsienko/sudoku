import type { GameLog, MultiStats, OpponentRecord } from "./types";

export const COOP_ACCENT = "#4ea1a3";
export const VERSUS_ACCENT = "#f4a259";

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

export function mostPlayedOpponentForMode(
  multi: MultiStats,
  mode: "coop" | "competitive",
): OpponentRecord | null {
  const key = mode === "coop" ? "coopGames" : "compGames";
  let best: OpponentRecord | null = null;
  for (const rec of Object.values(multi.opponents)) {
    const n = rec[key] ?? 0;
    if (n <= 0) continue;
    if (!best || n > (best[key] ?? 0)) best = rec;
  }
  return best;
}
