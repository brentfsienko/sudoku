import { createClient, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";
import type {
  CellEntry,
  Difficulty,
  GameMode,
  GameStatus,
  PlayerRole,
} from "@/lib/game/types";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 16,
});

/** Live, per-cursor presence for each connected player. */
export type Presence = {
  name: string;
  dogId: string;
  role: PlayerRole | null;
  selectedCell: number | null;
  online: boolean;
};

/** Shared, conflict-free room metadata. */
export type GameMeta = {
  puzzle: string;
  solution: string;
  difficulty: Difficulty;
  mode: GameMode;
  status: GameStatus;
  startedAt: number | null;
  finishedAt: number | null;
  mistakes: number;
  hintsUsed: number;
  hostName: string;
};

export type Storage = {
  /** Keyed by cell index ("0".."80"). */
  cells: LiveMap<string, CellEntry>;
  meta: LiveObject<GameMeta>;
};

export type UserMeta = {
  id: string;
  info: {
    name: string;
    dogId: string;
  };
};

export type RoomEvent =
  | { type: "REMATCH" }
  | { type: "EMOTE"; emoji: string; from: PlayerRole };

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useSelf,
  useStorage,
  useMutation,
  useStatus,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export const { LiveblocksProvider } = createLiveblocksContext(client);
