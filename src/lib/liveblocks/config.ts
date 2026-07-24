import { createClient, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";
import type {
  CellEntry,
  Difficulty,
  GameMode,
  GameStatus,
  PlayerRole,
} from "@/lib/game/types";
import { getSupabase } from "@/lib/supabase/client";

const client = createClient({
  authEndpoint: async (room) => {
    const sb = getSupabase();
    const {
      data: { session },
    } = (await sb?.auth.getSession()) ?? { data: { session: null } };

    if (!session?.access_token) {
      throw new Error("Sign in to play multiplayer.");
    }

    const res = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ room }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        typeof err === "object" && err && "error" in err
          ? String((err as { error: string }).error)
          : "Liveblocks auth failed",
      );
    }

    return (await res.json()) as { token: string };
  },
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
  /** Solution stays in-room for move validation; access is scoped per-room + auth. */
  solution: string;
  difficulty: Difficulty;
  mode: GameMode;
  status: GameStatus;
  startedAt: number | null;
  finishedAt: number | null;
  mistakes: number;
  hintsUsed: number;
  hostName: string;
  /** Supabase user id of the first player to claim host (authoritative). */
  hostId: string;
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
