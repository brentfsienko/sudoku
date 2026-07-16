export type Difficulty = "easy" | "medium" | "hard" | "expert" | "master";

export const DIFFICULTIES: Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master",
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
  master: "Master",
};

export type GameMode = "single" | "coop" | "competitive";

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  single: "Single Player",
  coop: "Co-op",
  competitive: "Competitive",
};

export type PlayerRole = "player-1" | "player-2" | "player-3" | "player-4";

export const ALL_ROLES: PlayerRole[] = ["player-1", "player-2", "player-3", "player-4"];
export const MAX_PLAYERS = 4;

/** A single cell entry in the shared/local board state. */
export type CellEntry = {
  /** 1-9, or null if empty. */
  value: number | null;
  /** Pencil-mark candidates (1-9). */
  notes: number[];
  /** Role of the player who placed the current value, or null. */
  owner: PlayerRole | null;
  /** Whether the placed value matches the solution. */
  correct: boolean;
};

export type GameStatus = "lobby" | "playing" | "paused" | "done";

export type PlayerStats = {
  role: PlayerRole;
  correctCells: number;
  mistakes: number;
};

/** A connected player's live presence, used for cursors + badges. */
export type PeerCursor = {
  role: PlayerRole | null;
  name: string;
  dogId: string;
  selectedCell: number | null;
};
