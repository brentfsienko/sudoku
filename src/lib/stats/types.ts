import {
  isActiveSolo,
  type ActiveSoloSave,
} from "@/lib/game/activeSolo";
import { DIFFICULTIES, type Difficulty } from "@/lib/game/types";
import { GAME_WIN_BONE_BONUS } from "@/lib/bones/config";
import type { DogId, ExclusiveDogId } from "@/lib/theme/dogs";
import { isExclusiveDogId, resolveDogId } from "@/lib/theme/dogs";
import { coerceProfile } from "./profile";
import type { InstallPlatform } from "@/lib/pwa/iosInstall";

export type { ActiveSoloSave };

/** Max in-progress solo games synced per account (keeps user_data JSON reasonable). */
export const MAX_ACTIVE_SOLOS = 10;

export type SoloStats = {
  played: number;
  won: number;
  bestScore: number;
  totalScore: number;
  totalSolveSeconds: number;
  fastestSolveSeconds: number | null;
  perfectGames: number;
  streak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
  bestTimeByDifficulty: Partial<Record<Difficulty, number>>;
  playsByDifficulty: Partial<Record<Difficulty, number>>;
  totalSquares: number;
};

export type OpponentRecord = {
  name: string;
  dogId: string;
  games: number;
  wins: number;
  coopGames: number;
  compGames: number;
  compWins: number;
};

export type MultiStats = {
  coopPlayed: number;
  coopSolved: number;
  compPlayed: number;
  compWon: number;
  compTied: number;
  coopSquares: number;
  compSquares: number;
  /** @deprecated Migrated to coopSquares + compSquares on load. */
  totalSquares?: number;
  opponents: Record<string, OpponentRecord>;
};

export type Profile = {
  username: string;
  dogId: DogId;
};

/** One completed game, kept for the progress timeline. */
export type GameLog = {
  t: number; // epoch ms when finished
  mode: "solo" | "coop" | "competitive";
  won: boolean;
  seconds: number;
  mistakes: number;
  /** Correct cells filled by the player (all modes). */
  squares: number;
  difficulty: Difficulty;
  score: number;
  opponentName?: string;
  opponentDogId?: string;
  /** Multiplayer: correct cells each player placed (non-given). */
  mySquares?: number;
  opponentSquares?: number;
  /** Competitive mode only. */
  tied?: boolean;
  /** Whether this entry came from the daily challenge puzzle. */
  daily?: boolean;
};

/** Daily fact guess stored per account (synced with localStorage). */
export type TriviaUserGuess = {
  factId: string;
  guess: "dog" | "sudoku";
  correct: boolean;
  at: number;
};

export type UserData = {
  profile: Profile;
  /**
   * Epoch ms when username/dogId were last customized on any device.
   * Used to merge profiles across devices (last-write-wins). Prefer remote
   * when both are missing/equal so a fresh device doesn't overwrite cloud.
   */
  profileUpdatedAt?: number;
  solo: SoloStats;
  multi: MultiStats;
  history: GameLog[];
  bones: number;
  /**
   * Epoch ms when bones last changed (earn or spend) on any device.
   * Last-write-wins on merge so a purchase on one device isn't undone by
   * Math.max with a stale higher balance from another.
   */
  bonesUpdatedAt?: number;
  ownedExclusiveDogs: ExclusiveDogId[];
  triviaGuesses?: Record<string, TriviaUserGuess>;
  /** In-progress solo boards — synced when signed in. */
  activeSolos?: ActiveSoloSave[];
  /**
   * IDs of games that have been finished or quit on any device.
   * Synced to cloud so every device knows which games to permanently hide.
   */
  finishedSoloIds?: string[];
  /** Auth user id that owns this blob — ignore local cache if it doesn't match. */
  accountId?: string;
  /**
   * Add-to-home-screen coach has been shown once. Synced so it never
   * reappears on another device for the same account.
   */
  installCoachSeen?: boolean;
  /** Stacked path overlay (Safari/Chrome steps all at once) was dismissed. */
  installCoachPathSeen?: boolean;
  /**
   * Add-to-home-screen path overlay dismissed, per browser family.
   * Safari and Chrome each show once for this account.
   */
  installCoachSeenByPlatform?: Partial<Record<InstallPlatform, boolean>>;
};

/** Pick the newer profile customization when merging two device copies. */
export function mergeProfiles(
  local: UserData,
  remote: UserData,
): { profile: Profile; profileUpdatedAt: number } {
  const localAt =
    typeof local.profileUpdatedAt === "number" ? local.profileUpdatedAt : 0;
  const remoteAt =
    typeof remote.profileUpdatedAt === "number" ? remote.profileUpdatedAt : 0;
  if (localAt > remoteAt) {
    return { profile: local.profile, profileUpdatedAt: localAt };
  }
  // Prefer remote on ties / missing timestamps so a new device's random
  // local pup doesn't clobber an existing cloud customization.
  return { profile: remote.profile, profileUpdatedAt: Math.max(localAt, remoteAt) };
}

/** "Elevation" analog: harder puzzles climb higher. */
export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
  master: 5,
};

const MAX_HISTORY = 1000;

function appendHistory(history: GameLog[], entry: GameLog): GameLog[] {
  const next = [...history, entry];
  return next.length > MAX_HISTORY
    ? next.slice(next.length - MAX_HISTORY)
    : next;
}

function historyLogKey(log: GameLog): string {
  return `${log.t}:${log.mode}`;
}

/** Union local + remote game logs so solo rows are not dropped on sync. */
export function mergeHistory(a: GameLog[], b: GameLog[]): GameLog[] {
  const map = new Map<string, GameLog>();
  for (const log of [...a, ...b]) {
    const key = historyLogKey(log);
    const prev = map.get(key);
    if (!prev || (log.squares ?? 0) >= (prev.squares ?? 0)) {
      map.set(key, log);
    }
  }
  const merged = [...map.values()].sort((x, y) => x.t - y.t);
  return merged.length > MAX_HISTORY
    ? merged.slice(merged.length - MAX_HISTORY)
    : merged;
}

function mergeSoloStats(a: SoloStats, b: SoloStats): SoloStats {
  const bestTimeByDifficulty: SoloStats["bestTimeByDifficulty"] = {
    ...a.bestTimeByDifficulty,
    ...b.bestTimeByDifficulty,
  };
  for (const d of DIFFICULTIES) {
    const ta = a.bestTimeByDifficulty[d];
    const tb = b.bestTimeByDifficulty[d];
    if (ta != null && tb != null) bestTimeByDifficulty[d] = Math.min(ta, tb);
  }
  const playsByDifficulty: SoloStats["playsByDifficulty"] = {
    ...a.playsByDifficulty,
  };
  for (const d of DIFFICULTIES) {
    playsByDifficulty[d] = Math.max(
      playsByDifficulty[d] ?? 0,
      b.playsByDifficulty[d] ?? 0,
    );
  }
  const { streak, lastPlayedDate } = mergePlayStreaks(a, b);
  const bestStreak = Math.max(a.bestStreak, b.bestStreak, streak);

  return {
    played: Math.max(a.played, b.played),
    won: Math.max(a.won, b.won),
    bestScore: Math.max(a.bestScore, b.bestScore),
    totalScore: Math.max(a.totalScore, b.totalScore),
    totalSolveSeconds: Math.max(a.totalSolveSeconds, b.totalSolveSeconds),
    fastestSolveSeconds:
      a.fastestSolveSeconds != null && b.fastestSolveSeconds != null
        ? Math.min(a.fastestSolveSeconds, b.fastestSolveSeconds)
        : a.fastestSolveSeconds ?? b.fastestSolveSeconds ?? null,
    perfectGames: Math.max(a.perfectGames, b.perfectGames),
    streak,
    bestStreak,
    lastPlayedDate,
    bestTimeByDifficulty,
    playsByDifficulty,
    totalSquares: Math.max(a.totalSquares, b.totalSquares),
  };
}

function mergeMultiStats(a: MultiStats, b: MultiStats): MultiStats {
  const opponents: MultiStats["opponents"] = { ...a.opponents };
  for (const [key, rec] of Object.entries(b.opponents)) {
    const prev = opponents[key];
    if (!prev) {
      opponents[key] = rec;
      continue;
    }
    opponents[key] = {
      name: prev.name || rec.name,
      dogId: prev.dogId || rec.dogId,
      games: Math.max(prev.games, rec.games),
      wins: Math.max(prev.wins, rec.wins),
      coopGames: Math.max(prev.coopGames, rec.coopGames),
      compGames: Math.max(prev.compGames, rec.compGames),
      compWins: Math.max(prev.compWins, rec.compWins),
    };
  }
  return {
    coopPlayed: Math.max(a.coopPlayed, b.coopPlayed),
    coopSolved: Math.max(a.coopSolved, b.coopSolved),
    compPlayed: Math.max(a.compPlayed, b.compPlayed),
    compWon: Math.max(a.compWon, b.compWon),
    compTied: Math.max(a.compTied, b.compTied),
    coopSquares: Math.max(a.coopSquares, b.coopSquares),
    compSquares: Math.max(a.compSquares, b.compSquares),
    opponents,
  };
}

/**
 * Merge bone balances. When a remote row exists, the server wallet is source of
 * truth — local bones/owned are ignored here (see loadUserData).
 * Kept for unsigned/local-only merges and tests.
 */
export function mergeBones(
  local: UserData,
  remote: UserData,
  ownedUnion: ExclusiveDogId[],
): { bones: number; bonesUpdatedAt?: number } {
  // Prefer remote wallet entirely when present (signed-in sync path passes remote).
  return {
    bones: Math.max(0, remote.bones ?? local.bones ?? 0),
    bonesUpdatedAt:
      typeof remote.bonesUpdatedAt === "number"
        ? remote.bonesUpdatedAt
        : typeof local.bonesUpdatedAt === "number"
          ? local.bonesUpdatedAt
          : undefined,
  };
  // ownedUnion is applied by caller from remote (authoritative) ownership list.
  void ownedUnion;
}

function normalizeOwnedExclusiveDogs(
  raw: ExclusiveDogId[] | string[] | undefined,
): ExclusiveDogId[] {
  if (!Array.isArray(raw)) return [];
  const out: ExclusiveDogId[] = [];
  for (const id of raw) {
    const resolved = resolveDogId(String(id));
    if (isExclusiveDogId(resolved) && !out.includes(resolved)) {
      out.push(resolved);
    }
  }
  return out;
}

/** Merge in-progress solo games from two devices (newer `updatedAt` wins per id). */
export function mergeActiveSolos(
  a: ActiveSoloSave[] | undefined,
  b: ActiveSoloSave[] | undefined,
): ActiveSoloSave[] {
  const map = new Map<string, ActiveSoloSave>();
  for (const item of [...(a ?? []), ...(b ?? [])]) {
    if (!item?.id || !item.snapshot?.puzzle || !isActiveSolo(item.snapshot)) continue;
    const at = typeof item.updatedAt === "number" ? item.updatedAt : 0;
    const prev = map.get(item.id);
    if (!prev || at >= (prev.updatedAt ?? 0)) {
      map.set(item.id, { id: item.id, snapshot: item.snapshot, updatedAt: at });
    }
  }
  return [...map.values()]
    .sort((x, y) => y.updatedAt - x.updatedAt)
    .slice(0, MAX_ACTIVE_SOLOS);
}

/** Merge two device copies without losing solo (or any) history rows. */
export function mergeUserData(local: UserData, remote: UserData): UserData {
  const { profile, profileUpdatedAt } = mergeProfiles(local, remote);
  // Server wallet is authoritative whenever a remote row exists.
  const ownedExclusiveDogs = normalizeOwnedExclusiveDogs(
    remote.ownedExclusiveDogs,
  );
  const { bones, bonesUpdatedAt } = mergeBones(
    local,
    remote,
    ownedExclusiveDogs,
  );
  return normalizeUserData({
    profile,
    profileUpdatedAt,
    solo: mergeSoloStats(local.solo, remote.solo),
    multi: mergeMultiStats(local.multi, remote.multi),
    history: mergeHistory(local.history, remote.history),
    bones,
    bonesUpdatedAt,
    ownedExclusiveDogs,
    triviaGuesses: mergeTriviaGuesses(
      local.triviaGuesses ?? {},
      remote.triviaGuesses ?? {},
    ),
    activeSolos: mergeActiveSolos(local.activeSolos, remote.activeSolos),
    finishedSoloIds: mergeFinishedIds(local.finishedSoloIds, remote.finishedSoloIds),
    installCoachSeen: Boolean(local.installCoachSeen || remote.installCoachSeen),
    installCoachPathSeen: Boolean(
      local.installCoachPathSeen || remote.installCoachPathSeen,
    ),
    installCoachSeenByPlatform: mergeInstallCoachPlatforms(
      local.installCoachSeenByPlatform,
      remote.installCoachSeenByPlatform,
    ),
    accountId: remote.accountId ?? local.accountId,
  });
}

const MAX_FINISHED_IDS = 500;

const INSTALL_PLATFORMS: InstallPlatform[] = [
  "ios-safari",
  "ios-chrome",
  "android-chrome",
  "desktop-chrome",
];

function normalizeInstallCoachPlatforms(
  raw: Partial<Record<InstallPlatform, boolean>> | undefined,
): Partial<Record<InstallPlatform, boolean>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<InstallPlatform, boolean>> = {};
  for (const p of INSTALL_PLATFORMS) {
    if (raw[p] === true) out[p] = true;
  }
  return out;
}

function mergeInstallCoachPlatforms(
  a: Partial<Record<InstallPlatform, boolean>> | undefined,
  b: Partial<Record<InstallPlatform, boolean>> | undefined,
): Partial<Record<InstallPlatform, boolean>> {
  const out: Partial<Record<InstallPlatform, boolean>> = {};
  for (const p of INSTALL_PLATFORMS) {
    if (a?.[p] || b?.[p]) out[p] = true;
  }
  return out;
}

function mergeFinishedIds(
  a: string[] | undefined,
  b: string[] | undefined,
): string[] {
  const merged = [...new Set([...(a ?? []), ...(b ?? [])])];
  // Keep the tail (most recently added) when over the limit
  return merged.length > MAX_FINISHED_IDS
    ? merged.slice(merged.length - MAX_FINISHED_IDS)
    : merged;
}

export function emptySolo(): SoloStats {
  return {
    played: 0,
    won: 0,
    bestScore: 0,
    totalScore: 0,
    totalSolveSeconds: 0,
    fastestSolveSeconds: null,
    perfectGames: 0,
    streak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
    bestTimeByDifficulty: {},
    playsByDifficulty: {},
    totalSquares: 0,
  };
}

export function emptyMulti(): MultiStats {
  return {
    coopPlayed: 0,
    coopSolved: 0,
    compPlayed: 0,
    compWon: 0,
    compTied: 0,
    coopSquares: 0,
    compSquares: 0,
    opponents: {},
  };
}

/** Lifetime correct cells filled across solo, co-op, and versus. */
export function lifetimeSquares(data: UserData): number {
  return (
    data.solo.totalSquares + data.multi.coopSquares + data.multi.compSquares
  );
}

export function sumHistorySquares(history: GameLog[] | undefined): number {
  if (!Array.isArray(history)) return 0;
  return history.reduce((s, log) => s + (log.squares ?? 0), 0);
}

export function emptyUserData(profile?: Partial<Profile> & { name?: string }): UserData {
  return {
    profile: coerceProfile(profile),
    solo: emptySolo(),
    multi: emptyMulti(),
    history: [],
    bones: 0,
    ownedExclusiveDogs: [],
    triviaGuesses: {},
    activeSolos: [],
  };
}

/** True after at least one recorded game (solo, daily, or multi). */
export function hasCompletedFirstGame(data: UserData | null | undefined): boolean {
  if (!data) return false;
  return (
    data.solo.played > 0 ||
    data.history.length > 0 ||
    data.multi.coopPlayed > 0 ||
    data.multi.compPlayed > 0
  );
}

function normalizeTriviaGuesses(
  raw: Record<string, TriviaUserGuess> | undefined,
): Record<string, TriviaUserGuess> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, TriviaUserGuess> = {};
  for (const [id, entry] of Object.entries(raw)) {
    const guess = entry?.guess;
    if (guess !== "dog" && guess !== "sudoku") continue;
    out[id] = {
      factId: entry.factId ?? id,
      guess,
      correct: Boolean(entry.correct),
      at: typeof entry.at === "number" ? entry.at : 0,
    };
  }
  return out;
}

function mergeTriviaGuesses(
  a: Record<string, TriviaUserGuess>,
  b: Record<string, TriviaUserGuess>,
): Record<string, TriviaUserGuess> {
  const out = { ...a };
  for (const [id, guess] of Object.entries(b)) {
    const prev = out[id];
    if (!prev || guess.at >= prev.at) out[id] = guess;
  }
  return out;
}

/** Defensively fill any missing fields after loading from storage/remote. */
function normalizeOpponents(
  raw: MultiStats["opponents"] | undefined,
): MultiStats["opponents"] {
  if (!raw) return {};
  const out: MultiStats["opponents"] = {};
  for (const [key, rec] of Object.entries(raw)) {
    out[key] = {
      name: rec.name,
      dogId: rec.dogId,
      games: rec.games ?? 0,
      wins: rec.wins ?? 0,
      coopGames: rec.coopGames ?? 0,
      compGames: rec.compGames ?? 0,
      compWins: rec.compWins ?? 0,
    };
  }
  return out;
}

export function normalizeUserData(raw: Partial<UserData> | null | undefined): UserData {
  const base = emptyUserData();
  if (!raw) return base;
  const recordedHistory = normalizeHistory(raw.history);
  const soloIn = {
    ...base.solo,
    ...raw.solo,
    totalSquares: raw.solo?.totalSquares ?? 0,
  };
  const solo = repairSoloStreak(soloIn, recordedHistory);
  const multi = normalizeMulti(raw.multi);
  const history = backfillSoloHistory(
    backfillHistoryOpponents(
      backfillHistorySquares(recordedHistory, solo, multi),
      multi.opponents,
    ),
    solo,
  );
  const data: UserData = {
    profile: coerceProfile({
      ...base.profile,
      ...(raw.profile as Partial<Profile> & { name?: string }),
    }),
    profileUpdatedAt:
      typeof raw.profileUpdatedAt === "number" && raw.profileUpdatedAt > 0
        ? raw.profileUpdatedAt
        : undefined,
    solo,
    multi: { ...multi, opponents: reconcileOpponents(multi.opponents, history) },
    history,
    bones: typeof raw.bones === "number" ? Math.max(0, raw.bones) : 0,
    bonesUpdatedAt:
      typeof raw.bonesUpdatedAt === "number" && raw.bonesUpdatedAt > 0
        ? raw.bonesUpdatedAt
        : undefined,
    ownedExclusiveDogs: normalizeOwnedExclusiveDogs(
      raw.ownedExclusiveDogs as ExclusiveDogId[] | undefined,
    ),
    triviaGuesses: normalizeTriviaGuesses(raw.triviaGuesses),
    activeSolos: mergeActiveSolos([], raw.activeSolos),
    finishedSoloIds: Array.isArray(raw.finishedSoloIds)
      ? (raw.finishedSoloIds as string[])
      : [],
    accountId: typeof raw.accountId === "string" ? raw.accountId : undefined,
    installCoachSeen: Boolean(raw.installCoachSeen),
    installCoachPathSeen: Boolean(raw.installCoachPathSeen),
    installCoachSeenByPlatform: normalizeInstallCoachPlatforms(
      raw.installCoachSeenByPlatform,
    ),
  };
  return {
    ...data,
    profile: coerceProfile(data.profile, data),
  };
}

function normalizeHistory(raw: GameLog[] | undefined): GameLog[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((log) => {
    const rawMode = (log as { mode?: string }).mode;
    const mode: GameLog["mode"] =
      rawMode === "single" ? "solo" : (log.mode as GameLog["mode"]);
    return {
      ...log,
      mode,
      squares: log.squares ?? 0,
      mySquares: log.mySquares ?? log.squares ?? 0,
      opponentSquares: log.opponentSquares ?? 0,
      tied: log.tied ?? false,
    };
  });
}

/**
 * Older saves incremented solo.played without appending history rows.
 * Add placeholder solo entries so Recent games can list past solo play.
 */
function backfillSoloHistory(history: GameLog[], solo: SoloStats): GameLog[] {
  const existing = history.filter((l) => l.mode === "solo");
  const missing = solo.played - existing.length;
  if (missing <= 0) return history;

  let wonLeft = Math.max(0, solo.won - existing.filter((l) => l.won).length);
  const now = Date.now();
  const diffQueue: { difficulty: Difficulty; count: number }[] = DIFFICULTIES.map(
    (d) => ({ difficulty: d, count: solo.playsByDifficulty[d] ?? 0 }),
  ).filter((x) => x.count > 0);
  if (diffQueue.length === 0) {
    diffQueue.push({ difficulty: "medium", count: missing });
  }

  let qi = 0;
  let diffLeft = diffQueue[0]?.count ?? missing;
  let difficulty = diffQueue[0]?.difficulty ?? "medium";
  const placeholders: GameLog[] = [];

  for (let i = 0; i < missing; i++) {
    while (diffLeft <= 0 && qi < diffQueue.length - 1) {
      qi += 1;
      diffLeft = diffQueue[qi].count;
      difficulty = diffQueue[qi].difficulty;
    }
    if (diffLeft > 0) diffLeft -= 1;

    const won = wonLeft > 0;
    if (won) wonLeft -= 1;

    placeholders.push({
      t: now - (missing - i) * 3_600_000,
      mode: "solo",
      won,
      seconds: solo.bestTimeByDifficulty[difficulty] ?? 0,
      mistakes: 0,
      squares: 0,
      difficulty,
      score: won ? solo.bestScore : 0,
    });
  }

  let next = history;
  for (const entry of placeholders) {
    next = appendHistory(next, entry);
  }
  return next;
}

/** Match per-game history squares to stored lifetime totals (pre-tracking migration). */
function backfillHistorySquares(
  history: GameLog[],
  solo: SoloStats,
  multi: MultiStats,
): GameLog[] {
  if (history.length === 0) return history;

  const next = history.map((log) => ({ ...log }));

  const sumForMode = (mode: GameLog["mode"]) =>
    next
      .filter((l) => l.mode === mode)
      .reduce((s, l) => s + (l.squares ?? 0), 0);

  const assignOrphan = (mode: GameLog["mode"], target: number) => {
    let orphan = target - sumForMode(mode);
    if (orphan <= 0) return;
    for (let i = next.length - 1; i >= 0 && orphan > 0; i--) {
      if (next[i].mode !== mode) continue;
      if ((next[i].squares ?? 0) > 0) continue;
      next[i] = { ...next[i], squares: orphan };
      orphan = 0;
    }
  };

  assignOrphan("solo", solo.totalSquares);
  assignOrphan("coop", multi.coopSquares);
  assignOrphan("competitive", multi.compSquares);

  return next;
}

/** Fill missing opponent names on older multiplayer history rows. */
function backfillHistoryOpponents(
  history: GameLog[],
  opponents: MultiStats["opponents"],
): GameLog[] {
  const records = Object.values(opponents);
  if (records.length === 0) return history;

  const pickOpponent = (mode: "coop" | "competitive") => {
    const eligible = records.filter((r) =>
      mode === "coop"
        ? r.coopGames > 0 || (r.games > 0 && r.compGames === 0)
        : r.compGames > 0 || (r.games > 0 && r.coopGames === 0),
    );
    const pool = eligible.length > 0 ? eligible : records;
    return pool.sort((a, b) => b.games - a.games)[0] ?? null;
  };

  return history.map((log) => {
    if (log.mode === "solo" || log.opponentName?.trim()) return log;
    const rec = records.length === 1 ? records[0] : pickOpponent(log.mode);
    if (!rec) return log;
    return {
      ...log,
      opponentName: rec.name,
      opponentDogId: log.opponentDogId || rec.dogId,
    };
  });
}

function opponentKey(name: string | undefined): string {
  const clean = (name ?? "").replace(/^@/, "").trim().toLowerCase();
  return clean || "anon";
}

/** Rebuild per-opponent stats from game history (source of truth for mode counts). */
function reconcileOpponents(
  opponents: MultiStats["opponents"],
  history: GameLog[],
): MultiStats["opponents"] {
  const next: MultiStats["opponents"] = {};

  for (const log of history) {
    if (log.mode === "solo") continue;
    const key = opponentKey(log.opponentName);
    const stored = opponents[key];
    const displayName =
      log.opponentName?.replace(/^@/, "").trim() ||
      stored?.name ||
      "Anon Pup";
    const prev = next[key] ?? {
      name: displayName,
      dogId: log.opponentDogId || stored?.dogId || "golden",
      games: 0,
      wins: 0,
      coopGames: 0,
      compGames: 0,
      compWins: 0,
    };
    const win = log.mode === "coop" ? log.won : log.won && !log.tied;
    const coopGames = prev.coopGames + (log.mode === "coop" ? 1 : 0);
    const compGames = prev.compGames + (log.mode === "competitive" ? 1 : 0);
    next[key] = {
      name: prev.name || displayName,
      dogId: log.opponentDogId || prev.dogId || stored?.dogId || "golden",
      coopGames,
      compGames,
      games: coopGames + compGames,
      wins: prev.wins + (win ? 1 : 0),
      compWins:
        prev.compWins +
        (log.mode === "competitive" && win ? 1 : 0),
    };
  }

  return next;
}

function normalizeMulti(raw: Partial<MultiStats> | undefined): MultiStats {
  const base = emptyMulti();
  if (!raw) return base;

  let coopSquares = raw.coopSquares ?? 0;
  let compSquares = raw.compSquares ?? 0;
  const legacy = raw.totalSquares ?? 0;
  if (coopSquares + compSquares === 0 && legacy > 0) {
    coopSquares = legacy;
  }

  return {
    ...base,
    ...raw,
    coopSquares,
    compSquares,
    opponents: normalizeOpponents(raw.opponents),
  };
}

export type SoloResult = {
  won: boolean;
  score: number;
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
  hintsUsed: number;
  squaresFilled: number;
  /** Bones found on the board during this game. */
  bonesFound: number;
  /** True when this was the daily challenge puzzle. */
  daily?: boolean;
};

export function soloBoneAward(r: Pick<SoloResult, "won" | "bonesFound">): number {
  return Math.max(0, r.bonesFound) + (r.won ? GAME_WIN_BONE_BONUS : 0);
}

export type MultiResult = {
  mode: "coop" | "competitive";
  solved: boolean;
  mySquares: number;
  opponentSquares: number;
  opponentName: string;
  opponentDogId: string;
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
  score: number;
  bonesFound: number;
  /** Competitive: who hit the mistake limit and lost, from my perspective. */
  mistakeLoss?: "me" | "opponent" | null;
};

export function multiBoneAward(r: MultiResult): number {
  const winBonus =
    r.mode === "coop"
      ? r.solved
        ? GAME_WIN_BONE_BONUS
        : 0
      : r.mode === "competitive" && r.mistakeLoss
        ? r.mistakeLoss === "opponent"
          ? GAME_WIN_BONE_BONUS
          : 0
        : r.mySquares > r.opponentSquares
          ? GAME_WIN_BONE_BONUS
          : 0;
  return Math.max(0, r.bonesFound) + winBonus;
}

/** Local calendar YYYY-MM-DD — streak days match the player's midnight, not UTC. */
function localDateKey(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey(now = Date.now()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return localDateKey(d.getTime());
}

function calendarDaysBetween(earlier: string, later: string): number | null {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(earlier);
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(later);
  if (!a || !b) return null;
  const ms =
    Date.UTC(Number(b[1]), Number(b[2]) - 1, Number(b[3])) -
    Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
  return Math.round(ms / 86_400_000);
}

function dateKeyInTimeZone(ms: number, timeZone?: string): string {
  if (!timeZone) return localDateKey(ms);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function isHourlyPlaceholderCluster(history: GameLog[]): Set<number> {
  const skip = new Set<number>();
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
  let run: number[] = [solos[0].i];
  for (let i = 1; i < solos.length; i++) {
    const dt = solos[i].log.t - solos[i - 1].log.t;
    if (dt >= 3_500_000 && dt <= 3_700_000) {
      run.push(solos[i].i);
    } else {
      if (run.length >= 3) for (const idx of run) skip.add(idx);
      run = [solos[i].i];
    }
  }
  if (run.length >= 3) for (const idx of run) skip.add(idx);
  return skip;
}

/** Unique play days from recorded games (skips synthetic hourly placeholders). */
export function playDaysFromHistory(
  history: GameLog[] | undefined,
  timeZone?: string,
  extraDays: string[] = [],
): string[] {
  const days = new Set<string>();
  const logs = history ?? [];
  const skip = isHourlyPlaceholderCluster(logs);
  logs.forEach((log, i) => {
    if (skip.has(i)) return;
    if (typeof log.t !== "number" || !Number.isFinite(log.t)) return;
    days.add(dateKeyInTimeZone(log.t, timeZone));
  });
  for (const day of extraDays) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) days.add(day);
  }
  return [...days].sort();
}

export function streakFromPlayDays(days: string[]): {
  streak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
} {
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

/**
 * Rebuild current/best streak from history. Never lowers a stored streak
 * (history can be truncated); heals UTC-ahead lastPlayedDate.
 */
export function repairSoloStreak(
  solo: SoloStats,
  history: GameLog[] | undefined,
  extraDays: string[] = [],
  timeZone?: string,
): SoloStats {
  const computed = streakFromPlayDays(
    playDaysFromHistory(history, timeZone, extraDays),
  );
  let lastPlayedDate = solo.lastPlayedDate;
  if (computed.lastPlayedDate) {
    if (!lastPlayedDate || lastPlayedDate < computed.lastPlayedDate) {
      lastPlayedDate = computed.lastPlayedDate;
    } else {
      const ahead = calendarDaysBetween(computed.lastPlayedDate, lastPlayedDate);
      if (ahead === 1) lastPlayedDate = computed.lastPlayedDate;
    }
  }
  const streak = Math.max(solo.streak, computed.streak);
  const bestStreak = Math.max(solo.bestStreak, computed.bestStreak, streak);
  return { ...solo, streak, bestStreak, lastPlayedDate };
}

/** Pick the live streak when two devices each have a last-played date. */
function mergePlayStreaks(
  a: SoloStats,
  b: SoloStats,
): { streak: number; lastPlayedDate: string | null } {
  const lastA = a.lastPlayedDate;
  const lastB = b.lastPlayedDate;
  if (lastA && lastB) {
    if (lastA === lastB) {
      return { streak: Math.max(a.streak, b.streak), lastPlayedDate: lastA };
    }
    const [earlier, later] = lastA < lastB ? [a, b] : [b, a];
    const earlierDay = earlier.lastPlayedDate;
    const laterDay = later.lastPlayedDate;
    if (!earlierDay || !laterDay) {
      return { streak: later.streak, lastPlayedDate: laterDay ?? earlierDay };
    }
    const gap = calendarDaysBetween(earlierDay, laterDay);
    // Consecutive days: keep the continuation (recovers a UTC-reset on one device).
    if (gap === 1) {
      return {
        streak: Math.max(later.streak, earlier.streak + 1, 1),
        lastPlayedDate: laterDay,
      };
    }
    return { streak: later.streak, lastPlayedDate: laterDay };
  }
  if (lastA) return { streak: a.streak, lastPlayedDate: lastA };
  if (lastB) return { streak: b.streak, lastPlayedDate: lastB };
  return { streak: Math.max(a.streak, b.streak), lastPlayedDate: null };
}

/** If this finish never landed on lastPlayedDate, apply today's streak bump. */
export function ensurePlayStreakForToday(
  data: UserData,
  now = Date.now(),
): UserData {
  if (data.solo.lastPlayedDate === localDateKey(now)) return data;
  return { ...data, solo: applyPlayStreak(data.solo, now) };
}

/** Visible streak: still going if last play was today or yesterday (local). */
export function liveStreak(solo: SoloStats, now = Date.now()): number {
  const last = solo.lastPlayedDate;
  if (!last || solo.streak <= 0) return 0;
  const today = localDateKey(now);
  if (last === today || last === yesterdayKey(now) || last > today) {
    return solo.streak;
  }
  return 0;
}

/** Bump streak when any game finishes (solo, co-op, or versus; win or loss). */
function applyPlayStreak(solo: SoloStats, now = Date.now()): SoloStats {
  const today = localDateKey(now);
  const next = { ...solo };
  const last = next.lastPlayedDate;
  if (last === today || (last && last > today)) {
    // Same local day, or a leftover UTC "tomorrow" from evening play.
    next.streak = Math.max(next.streak, 1);
  } else if (last && last === yesterdayKey(now)) {
    next.streak = next.streak + 1;
  } else {
    next.streak = 1;
  }
  next.lastPlayedDate = today;
  next.bestStreak = Math.max(next.bestStreak, next.streak);
  return next;
}

/** Returns a new UserData with the solo game result merged in. */
export function applySoloResult(data: UserData, r: SoloResult): UserData {
  let solo = applyPlayStreak({
    ...data.solo,
    bestTimeByDifficulty: { ...data.solo.bestTimeByDifficulty },
    playsByDifficulty: { ...data.solo.playsByDifficulty },
  });

  solo.played += 1;
  solo.playsByDifficulty[r.difficulty] =
    (solo.playsByDifficulty[r.difficulty] ?? 0) + 1;

  if (r.won) {
    solo.won += 1;
    solo.totalScore += r.score;
    solo.bestScore = Math.max(solo.bestScore, r.score);
    solo.totalSolveSeconds += r.elapsedSeconds;
    if (solo.fastestSolveSeconds == null || r.elapsedSeconds < solo.fastestSolveSeconds) {
      solo.fastestSolveSeconds = r.elapsedSeconds;
    }
    const prev = solo.bestTimeByDifficulty[r.difficulty];
    if (prev == null || r.elapsedSeconds < prev) {
      solo.bestTimeByDifficulty[r.difficulty] = r.elapsedSeconds;
    }
    if (r.mistakes === 0 && r.hintsUsed === 0) solo.perfectGames += 1;
  }

  solo.totalSquares += r.squaresFilled;

  const history = appendHistory(data.history, {
    t: Date.now(),
    mode: "solo",
    won: r.won,
    seconds: r.elapsedSeconds,
    mistakes: r.mistakes,
    squares: r.squaresFilled,
    difficulty: r.difficulty,
    score: r.score,
    daily: r.daily,
  });

  const winBonus = r.won ? GAME_WIN_BONE_BONUS : 0;
  const boneDelta = r.bonesFound + winBonus;
  const bones = (data.bones ?? 0) + boneDelta;

  return {
    ...data,
    solo,
    history,
    bones,
    ...(boneDelta > 0 ? { bonesUpdatedAt: Date.now() } : null),
  };
}

/** Returns a new UserData with the multiplayer game result merged in. */
export function applyMultiResult(data: UserData, r: MultiResult): UserData {
  const solo = applyPlayStreak({ ...data.solo });
  const multi: MultiStats = {
    ...data.multi,
    opponents: { ...data.multi.opponents },
  };

  const myWin =
    r.mode === "coop"
      ? r.solved
      : r.mode === "competitive" && r.mistakeLoss
        ? r.mistakeLoss === "opponent"
        : r.mySquares > r.opponentSquares;
  const tie =
    r.mode === "competitive" &&
    !r.mistakeLoss &&
    r.mySquares === r.opponentSquares;

  if (r.mode === "coop") {
    multi.coopPlayed += 1;
    if (r.solved) multi.coopSolved += 1;
  } else {
    multi.compPlayed += 1;
    if (tie) multi.compTied += 1;
    else if (myWin) multi.compWon += 1;
  }
  if (r.mode === "coop") multi.coopSquares += r.mySquares;
  else multi.compSquares += r.mySquares;

  const oppName = r.opponentName.replace(/^@/, "").trim();
  const key = opponentKey(oppName);
  const prev = multi.opponents[key] ?? {
    name: oppName || "Anon Pup",
    dogId: r.opponentDogId,
    games: 0,
    wins: 0,
    coopGames: 0,
    compGames: 0,
    compWins: 0,
  };
  const coopGames = prev.coopGames + (r.mode === "coop" ? 1 : 0);
  const compGames = prev.compGames + (r.mode === "competitive" ? 1 : 0);
  multi.opponents[key] = {
    name: oppName || prev.name,
    dogId: r.opponentDogId || prev.dogId,
    coopGames,
    compGames,
    games: coopGames + compGames,
    wins: prev.wins + (myWin ? 1 : 0),
    compWins:
      prev.compWins +
      (r.mode === "competitive" && myWin && !tie ? 1 : 0),
  };

  const history = appendHistory(data.history, {
    t: Date.now(),
    mode: r.mode,
    won: myWin,
    seconds: r.elapsedSeconds,
    mistakes: r.mistakes,
    squares: r.mySquares,
    difficulty: r.difficulty,
    score: r.score,
    opponentName:
      r.opponentName.replace(/^@/, "").trim() || undefined,
    opponentDogId: r.opponentDogId || undefined,
    mySquares: r.mySquares,
    opponentSquares: r.opponentSquares,
    tied: r.mode === "competitive" ? tie : undefined,
  });

  const winBonus =
    r.mode === "coop"
      ? r.solved
        ? GAME_WIN_BONE_BONUS
        : 0
      : myWin && !tie
        ? GAME_WIN_BONE_BONUS
        : 0;
  const boneDelta = r.bonesFound + winBonus;
  const bones = (data.bones ?? 0) + boneDelta;

  return {
    ...data,
    solo,
    multi,
    history,
    bones,
    ...(boneDelta > 0 ? { bonesUpdatedAt: Date.now() } : null),
  };
}

export function mostPlayedOpponent(multi: MultiStats): OpponentRecord | null {
  let best: OpponentRecord | null = null;
  for (const rec of Object.values(multi.opponents)) {
    if (!best || rec.games > best.games) best = rec;
  }
  return best;
}
