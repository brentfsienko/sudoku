const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const GAME_MODES = new Set(["solo", "daily", "multiplayer"]);

export async function verifyAccessToken(
  accessToken: string,
): Promise<{ id: string } | null> {
  if (!url || !anonKey) return null;
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ? { id: json.id } : null;
}

export async function metricUserId(
  request: Request,
  bodyUserId?: string,
): Promise<string> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const verified = token ? await verifyAccessToken(token) : null;
  return verified?.id ?? (bodyUserId?.trim() || "anonymous");
}
