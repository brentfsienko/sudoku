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

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

/** Updates password during recovery; signs out after so user can sign in fresh in the PWA. */
export async function completePasswordReset(
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const { getSupabase } = await import("@/lib/supabase/client");
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Sign-in is not configured." };

  try {
    const { error } = await withTimeout(
      sb.auth.updateUser({ password }),
      20_000,
      "Password update timed out. Check your connection and try again.",
    );
    if (error) return { ok: false, error: error.message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not update password.";
    return { ok: false, error: msg };
  }

  // End the recovery session in this browser tab (separate from the home-screen PWA).
  try {
    await withTimeout(sb.auth.signOut(), 8_000, "Sign out timed out.");
  } catch {
    // Password was saved; ignore sign-out timeout.
  }

  return { ok: true };
}
