export function normalizeUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 24) {
    return "Username must be 3–24 characters (a-z, 0-9, _).";
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Only lowercase letters, numbers, and underscores.";
  }
  return null;
}
