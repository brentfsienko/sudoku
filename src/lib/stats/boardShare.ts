import type { GameLog } from "./types";

export type BoardShare = {
  mine: number;
  theirs: number;
};

/** Share of filled (non-given) cells each player placed. */
export function boardSharePercents(log: GameLog): BoardShare | null {
  if (log.mode === "solo") return null;
  const mine = log.mySquares ?? log.squares ?? 0;
  const theirs = log.opponentSquares ?? 0;
  const total = mine + theirs;
  if (total <= 0) return null;
  const minePct = Math.round((mine / total) * 100);
  return { mine: minePct, theirs: Math.max(0, 100 - minePct) };
}

export function boardShareLabel(
  log: GameLog,
  myUsername: string,
  opponentUsername: string,
): string | null {
  const share = boardSharePercents(log);
  if (!share) return null;
  const me = myUsername.replace(/^@/, "").trim() || "you";
  const them = opponentUsername.replace(/^@/, "").trim() || "them";
  return `@${me} ${share.mine}% · @${them} ${share.theirs}%`;
}
