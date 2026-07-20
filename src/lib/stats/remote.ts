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

/** Legacy full-blob upsert (used before wallet RPCs exist, or as fallback). */
async function upsertRemoteLegacy(userId: string, data: UserData): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const result = await withTimeout(
    sb
      .from("user_data")
      .upsert(
        { user_id: userId, data, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      ),
    12_000,
  );
  if (result.error) {
    console.warn("[stats] remote upsert failed:", result.error.message);
  }
}

/**
 * Upsert gameplay stats. Server preserves bones / ownedExclusiveDogs so a
 * stale device cannot overwrite wallet purchases or awards.
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
      console.warn("[stats] upsert_user_stats failed, falling back:", error.message);
      await upsertRemoteLegacy(userId, data);
    }
  } catch (err) {
    console.warn("[stats] remote upsert failed:", err);
    try {
      await upsertRemoteLegacy(userId, data);
    } catch {
      // ignore
    }
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

/** Atomically award bones on the server wallet. */
export async function addBonesRemote(
  amount: number,
): Promise<WalletSnapshot | null> {
  if (amount <= 0) return null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("add_bones", { p_amount: amount });
  if (error) {
    console.warn("[stats] add_bones failed:", error.message);
    return null;
  }
  return parseWalletPayload(data);
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
