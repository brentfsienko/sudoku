import type { EmailOtpType } from "@supabase/supabase-js";

export type AuthEmailActionType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email_change_new"
  | "reauthentication"
  | string;

export type AuthEmailData = {
  token?: string;
  token_hash?: string;
  redirect_to?: string;
  email_action_type: AuthEmailActionType;
  site_url?: string;
  token_new?: string;
  token_hash_new?: string;
  old_email?: string;
  new_email?: string;
};

const DEFAULT_SITE_URL = "https://sudogku.com";

const SUBJECTS: Record<string, string> = {
  signup:           "almost there — confirm your sudogku email",
  invite:           "you've been invited to sudogku",
  magiclink:        "your sudogku sign-in link",
  recovery:         "reset your sudogku password",
  email_change:     "confirm your new email on sudogku",
  email_change_new: "confirm your new email on sudogku",
  reauthentication: "your sudogku verification code"
};

/** Map Supabase hook action → verifyOtp type. */
export function mapActionToOtpType(action: AuthEmailActionType): EmailOtpType {
  switch (action) {
    case "signup":
      return "email";
    case "invite":
      return "invite";
    case "magiclink":
      return "magiclink";
    case "recovery":
      return "recovery";
    case "email_change":
    case "email_change_new":
      return "email_change";
    case "email":
      return "email";
    default:
      return "email";
  }
}

function siteOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  return configured || DEFAULT_SITE_URL;
}

function supabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
}

/**
 * Builds a Supabase-native verification URL so the token_hash is verified
 * server-side by Supabase, then the user is redirected back to the app.
 * This matches the PKCE + client-side Supabase setup used by Sudogku.
 */
export function buildAuthConfirmationUrl(emailData: AuthEmailData): string {
  const type = mapActionToOtpType(emailData.email_action_type);
  const redirectTo =
    emailData.redirect_to ??
    (emailData.email_action_type === "recovery"
      ? `${siteOrigin()}/auth/reset-password`
      : siteOrigin());

  const params = new URLSearchParams({
    token_hash: emailData.token_hash ?? "",
    type,
    redirect_to: redirectTo
  });

  return `${supabaseUrl()}/auth/v1/verify?${params.toString()}`;
}

export function authEmailSubject(actionType: AuthEmailActionType): string {
  return SUBJECTS[actionType] ?? "sudogku notification";
}

export function buildAuthEmailHtml(emailData: AuthEmailData, _toEmail: string): string {
  const action = emailData.email_action_type;
  const confirmationUrl = buildAuthConfirmationUrl(emailData);
  const token = emailData.token ?? "";

  if (action === "reauthentication") {
    return emailShell({
      title: "verification code",
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#6b5744;">
          here's your one-time code to verify your account:
        </p>
        <p style="margin:0 0 8px;font-size:34px;font-weight:800;letter-spacing:0.2em;color:#4a3b2f;font-variant-numeric:tabular-nums;">
          ${escapeHtml(token)}
        </p>
        <p style="margin:8px 0 0;font-size:13px;color:#9a8a79;">
          expires shortly. don't share this with anyone. 🐾
        </p>
      `,
      cta: null,
      confirmationUrl: null
    });
  }

  const copy: Record<string, { title: string; body: string; cta: string }> = {
    signup: {
      title: "almost in the kennel",
      body: "tap below to confirm your email — then it's puzzle time.",
      cta: "confirm email →"
    },
    invite: {
      title: "you've been invited",
      body: "someone saved a square for you on sudogku. tap below to create your account.",
      cta: "accept invite →"
    },
    magiclink: {
      title: "freshly fetched",
      body: "tap below to sign in. this link works once and expires soon — use it or lose it.",
      cta: "sign in →"
    },
    recovery: {
      title: "lost your bone?",
      body: "someone (hopefully you) asked to reset your sudogku password. tap below to set a new one.",
      cta: "reset password →"
    },
    email_change: {
      title: "new email, same dog",
      body: "tap below to confirm your updated email address on sudogku.",
      cta: "confirm email →"
    },
    email_change_new: {
      title: "new email, same dog",
      body: "tap below to confirm your updated email address on sudogku.",
      cta: "confirm email →"
    }
  };

  const content = copy[action] ?? {
    title: "sudogku",
    body: "tap the button below to continue.",
    cta: "continue →"
  };

  const blurb =
    action === "signup" || action === "invite"
      ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#9a8a79;">
           daily puzzles. head-to-head with friends. your dog's rooting for you.
         </p>`
      : "";

  return emailShell({
    title: content.title,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6b5744;">
        ${escapeHtml(content.body)}
      </p>
      ${blurb}
    `,
    cta: content.cta,
    confirmationUrl
  });
}

function emailShell(opts: {
  title: string;
  bodyHtml: string;
  cta: string | null;
  confirmationUrl: string | null;
}): string {
  const button =
    opts.cta && opts.confirmationUrl
      ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="border-radius:8px;background:#f4a259;">
            <a href="${escapeHtml(opts.confirmationUrl)}"
               style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.03em;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
              ${escapeHtml(opts.cta)}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 20px;font-size:12px;line-height:1.5;color:#b09a85;">
        button not working?
        <a href="${escapeHtml(opts.confirmationUrl)}" style="color:#c98b5b;text-decoration:underline;word-break:break-all;">${escapeHtml(opts.confirmationUrl)}</a>
      </p>
    `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5ead8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5ead8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:500px;">

          <!-- wordmark -->
          <tr>
            <td style="padding:0 0 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img
                      src="https://sudogku.com/dogs/golden.png"
                      width="32"
                      height="32"
                      alt=""
                      style="display:block;width:32px;height:32px;border-radius:8px;border:0;"
                    />
                  </td>
                  <td style="padding-left:9px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;font-weight:800;color:#4a3b2f;letter-spacing:0.04em;text-transform:lowercase;vertical-align:middle;">
                    sudogku
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- card -->
          <tr>
            <td style="background:#fdf6ec;border:1px solid #efe2cf;border-radius:14px;overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:28px 28px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#4a3b2f;">
                    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;text-transform:lowercase;color:#4a3b2f;">
                      ${escapeHtml(opts.title)}
                    </h1>
                    ${opts.bodyHtml}
                    ${button}
                    <p style="margin:0 0 28px;font-size:12px;line-height:1.5;color:#b09a85;">
                      didn't ask for this? no worries — nothing will change. 🐶
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 28px;border-top:1px solid #efe2cf;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;color:#b09a85;">
                    sudogku · <a href="https://sudogku.com" style="color:#c98b5b;text-decoration:none;">sudogku.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildAuthEmailText(emailData: AuthEmailData, _toEmail: string): string {
  const action = emailData.email_action_type;
  if (action === "reauthentication") {
    return `your sudogku verification code: ${emailData.token ?? ""}\n\nexpires shortly. don't share it.\n\n— sudogku (sudogku.com)`;
  }
  const confirmationUrl = buildAuthConfirmationUrl(emailData);
  const actionLine =
    action === "recovery"
      ? "someone (hopefully you) asked to reset your sudogku password. open the link below to set a new one."
      : action === "signup" || action === "invite"
      ? "tap the link below to confirm your email and start solving."
      : "open the link below to continue.";
  return `sudogku\n\n${actionLine}\n\n${confirmationUrl}\n\ndidn't ask for this? ignore this email — nothing will change.\n\n— sudogku (sudogku.com)`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function parseHookSecret(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  return value.replace(/^v1,whsec_/, "");
}

export function resolveResendFrom(): string {
  const from = (process.env.RESEND_FROM_EMAIL ?? "").trim();
  if (from) return from;
  return "Sudogku <onboarding@resend.dev>";
}
