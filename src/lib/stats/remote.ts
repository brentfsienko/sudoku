"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { ExclusiveDogId } from "@/lib/theme/dogs";
import {
  normalizeUserData,
  sumHistorySquares,
  type UserData,
} from "./types";

type WalletSnapshot = {
  bones: number;
  ownedExclusiveDogs: ExclusiveDogId[];
  bonesUpdatedAt?: number;
};

function walletFromData(data: UserData): WalletSnapshot {
  return {
    bones: Math.max(0, data.bones ?? 0),
    ownedExclusiveDogs: data.ownedExclusiveDogs ?? [],
    bonesUpdatedAt: data.bonesUpdatedAt,
  };
}

function applyWallet(data: UserData, wallet: WalletSnapshot): UserData {
  return normalizeUserData({
    ...data,
    bones: wallet.bones,
    ownedExclusiveDogs: wallet.ownedExclusiveDogs,
    bonesUpdatedAt: wallet.bonesUpdatedAt,
  });
}

/** Reads the signed-in user's saved data row, or null if none exists yet. */
export async function fetchRemote(userId: string): Promise<UserData | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[stats] remote fetch failed:", error.message);
    return null;
  }
  if (!data) return null;
  const raw = data.data as Partial<UserData>;
  const normalized = normalizeUserData(raw);
  const needsRepair =
    sumHistorySquares(raw.history) < sumHistorySquares(normalized.history) ||
    JSON.stringify(raw.history ?? []) !== JSON.stringify(normalized.history) ||
    JSON.stringify(raw.multi?.opponents ?? {}) !==
      JSON.stringify(normalized.multi.opponents);
  if (needsRepair) {
    void upsertRemote(userId, normalized);
  }
  return normalized;
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("remote upsert timeout")), ms);
    }),
  ]);
}

/**
 * Upsert gameplay stats. Server preserves bones / ownedExclusiveDogs.
 * No legacy table upsert fallback — direct writes are revoked by RLS.
 */
export async function upsertRemote(userId: string, data: UserData): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { error } = await withTimeout(
      sb.rpc("upsert_user_stats", { p_data: data }),
      12_000,
    );
    if (error) {
      console.warn("[stats] upsert_user_stats failed:", error.message);
    }
  } catch (err) {
    console.warn("[stats] remote upsert failed:", err);
  }
}

function parseWalletPayload(raw: unknown): WalletSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const bones = typeof obj.bones === "number" ? Math.max(0, obj.bones) : 0;
  const owned = Array.isArray(obj.ownedExclusiveDogs)
    ? (obj.ownedExclusiveDogs as ExclusiveDogId[])
    : [];
  return { bones, ownedExclusiveDogs: owned };
}

/**
 * Atomically award bones for a finished game id (server-capped + deduped).
 */
export async function awardGameBonesRemote(
  gameId: string,
  amount: number,
): Promise<WalletSnapshot | null> {
  if (!gameId || amount < 0) return null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("award_game_bones", {
    p_game_id: gameId,
    p_amount: amount,
  });
  if (error) {
    console.warn("[stats] award_game_bones failed:", error.message);
    return null;
  }
  return parseWalletPayload(data);
}

/** @deprecated Use awardGameBonesRemote — positive add_bones is rejected server-side. */
export async function addBonesRemote(
  amount: number,
): Promise<WalletSnapshot | null> {
  if (amount <= 0) return null;
  return null;
}

export type PurchaseRemoteResult = {
  ok: boolean;
  error?: string;
  alreadyOwned?: boolean;
  wallet: WalletSnapshot;
};

/** Atomically purchase an exclusive pup on the server wallet. */
export async function purchaseExclusiveDogRemote(
  dogId: ExclusiveDogId,
): Promise<PurchaseRemoteResult | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("purchase_exclusive_dog", {
    p_dog: dogId,
  });
  if (error) {
    console.warn("[stats] purchase_exclusive_dog failed:", error.message);
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const wallet = parseWalletPayload(data) ?? {
    bones: 0,
    ownedExclusiveDogs: [],
  };
  return {
    ok: obj.ok === true,
    error: typeof obj.error === "string" ? obj.error : undefined,
    alreadyOwned: obj.alreadyOwned === true,
    wallet,
  };
}

export { applyWallet, walletFromData };
export type { WalletSnapshot };
