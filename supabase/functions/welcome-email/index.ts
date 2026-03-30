/**
 * Supabase Edge Function: welcome email after email signup (Database Webhook on auth.users).
 *
 * Deploy: supabase functions deploy welcome-email --no-verify-jwt
 * Secrets: RESEND_API_KEY, RESEND_FROM, WELCOME_WEBHOOK_SECRET (optional)
 *
 * Behavior:
 * - INSERT + email already confirmed (OAuth / "confirm email" off) → send welcome.
 * - INSERT + email not yet confirmed (typical email/password + "confirm email" on) → skip
 *   unless WELCOME_SEND_ON_INSERT_UNCONFIRMED=true
 * - UPDATE when email_confirmed_at goes from null → set → send welcome (user finished verification).
 *
 * Webhook: enable BOTH Insert and Update on auth.users (same URL).
 *
 * Phone-only signups: no email → 200 { skipped: true }.
 */
const RESEND_API = "https://api.resend.com/emails";

type Row = Record<string, unknown>;

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Row;
  old_record?: Row | null;
  /** legacy / alternate shapes */
  new?: Row;
  old?: Row;
  payload?: WebhookPayload;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function parseWebhookBody(raw: unknown): WebhookPayload {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  if (o.payload && typeof o.payload === "object") {
    return o.payload as WebhookPayload;
  }
  return raw as WebhookPayload;
}

function extractRows(payload: WebhookPayload): {
  eventType: string;
  record: Row | null;
  oldRecord: Row | null;
} {
  const eventType = String(payload.type || "").toUpperCase();
  const record = (payload.record ?? payload.new) as Row | undefined;
  const oldRecord = (payload.old_record ?? payload.old) as Row | null | undefined;
  return {
    eventType,
    record: record ?? null,
    oldRecord: oldRecord ?? null,
  };
}

function getEmail(row: Row | null): string | null {
  if (!row) return null;
  const e = row.email;
  if (typeof e === "string" && e.includes("@")) return e.trim().toLowerCase();
  return null;
}

function getUserId(row: Row | null): string | null {
  if (!row) return null;
  const id = row.id;
  if (typeof id === "string" && id.length > 0) return id;
  return null;
}

function isConfirmedAt(v: unknown): boolean {
  return v != null && String(v).length > 0;
}

function shouldSendWelcome(
  eventType: string,
  record: Row | null,
  oldRecord: Row | null,
  sendOnUnconfirmedInsert: boolean,
): { send: true; reason: string } | { send: false; reason: string } {
  const email = getEmail(record);
  if (!email) return { send: false, reason: "no_email" };

  if (eventType === "INSERT") {
    if (isConfirmedAt(record?.email_confirmed_at)) {
      return { send: true, reason: "insert_already_confirmed" };
    }
    if (sendOnUnconfirmedInsert) {
      return { send: true, reason: "insert_unconfirmed_allowed_by_env" };
    }
    return { send: false, reason: "insert_pending_email_confirm" };
  }

  if (eventType === "UPDATE") {
    const was = isConfirmedAt(oldRecord?.email_confirmed_at);
    const now = isConfirmedAt(record?.email_confirmed_at);
    if (!was && now) {
      return { send: true, reason: "email_just_confirmed" };
    }
    return { send: false, reason: "update_not_first_confirmation" };
  }

  return { send: false, reason: "unsupported_or_ignored_event" };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const secret = Deno.env.get("WELCOME_WEBHOOK_SECRET")?.trim();
  if (secret) {
    const got = req.headers.get("x-webhook-secret")?.trim();
    if (got !== secret) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }
  }

  const resendKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from = Deno.env.get("RESEND_FROM")?.trim();
  if (!resendKey || !from) {
    return jsonResponse({ error: "missing_resend_env" }, 503);
  }

  const sendOnUnconfirmedInsert =
    Deno.env.get("WELCOME_SEND_ON_INSERT_UNCONFIRMED")?.trim().toLowerCase() === "true" ||
    Deno.env.get("WELCOME_SEND_ON_INSERT_UNCONFIRMED")?.trim() === "1";

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const payload = parseWebhookBody(raw);
  const { eventType, record, oldRecord } = extractRows(payload);

  const strict = Deno.env.get("WELCOME_WEBHOOK_REQUIRE_AUTH_USERS")?.trim().toLowerCase() === "true";
  if (strict && (payload.schema !== "auth" || payload.table !== "users")) {
    return jsonResponse({ ok: true, skipped: true, reason: "not_auth_users" });
  }

  const decision = shouldSendWelcome(eventType, record, oldRecord, sendOnUnconfirmedInsert);
  if (!decision.send) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: decision.reason,
      event: eventType || null,
    });
  }

  const email = getEmail(record);
  const userId = getUserId(record);
  if (!email) {
    return jsonResponse({ ok: true, skipped: true, reason: "no_email" });
  }

  const subject = "Welcome to Nye Clock";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a2e">
  <p>Hello,</p>
  <p>Thanks for registering with <strong>Nye Clock</strong>.</p>
  <p>Your account is ready. Open the app and sign in under <strong>My account → Cloud</strong> whenever you like.</p>
  <p style="color:#666;font-size:14px">— Nye Clock</p>
</body></html>`;
  const text =
    "Hello,\n\nThanks for registering with Nye Clock.\n\nYour account is ready. Open the app and sign in under My account → Cloud whenever you like.\n\n— Nye Clock";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${resendKey}`,
    "Content-Type": "application/json",
  };
  if (userId) {
    headers["Idempotency-Key"] = `welcome-${userId}`;
  }

  const r = await fetch(RESEND_API, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      html,
      text,
    }),
  });

  if (!r.ok) {
    const errText = await r.text();
    console.error("resend_error", r.status, errText);
    return jsonResponse({ error: "resend_failed", detail: errText.slice(0, 200) }, 502);
  }

  return jsonResponse({
    ok: true,
    sent: true,
    to: email,
    trigger: decision.reason,
    event: eventType,
  });
});
