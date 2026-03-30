/**
 * Supabase Edge Function: send welcome email after signup (via Database Webhook on auth.users).
 *
 * Deploy: supabase functions deploy welcome-email --no-verify-jwt
 * Secrets: RESEND_API_KEY, RESEND_FROM, WELCOME_WEBHOOK_SECRET (optional)
 *
 * Phone-only signups: no email → returns 200 with { skipped: true }.
 */
const RESEND_API = "https://api.resend.com/emails";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
    email?: string | null;
    phone?: string | null;
    raw_user_meta_data?: Record<string, unknown>;
  };
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
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

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const record = payload.record;
  const email =
    typeof record?.email === "string" && record.email.includes("@")
      ? record.email.trim()
      : null;

  if (!email) {
    return jsonResponse({ ok: true, skipped: true, reason: "no_email" });
  }

  const subject = "Welcome to Nye Clock";
  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a2e">
  <p>Hello,</p>
  <p>Thanks for registering with <strong>Nye Clock</strong>.</p>
  <p>Your account is ready. Open the app and sign in under <strong>My account → Cloud</strong> whenever you like.</p>
  <p style="color:#666;font-size:14px">— Nye Clock</p>
</body></html>`;

  const r = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      html,
    }),
  });

  if (!r.ok) {
    const errText = await r.text();
    console.error("resend_error", r.status, errText);
    return jsonResponse({ error: "resend_failed", detail: errText.slice(0, 200) }, 502);
  }

  return jsonResponse({ ok: true, sent: true, to: email });
});
