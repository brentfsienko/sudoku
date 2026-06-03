export function passwordsMatch(
  password: string,
  confirm: string,
): { ok: true } | { ok: false; error: string } {
  if (!password) return { ok: false, error: "Enter a password." };
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }
  return { ok: true };
}

export function resetPasswordRedirectUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/reset-password`;
}
