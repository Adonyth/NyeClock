# Welcome email after registration (email only)

Edge Function **`welcome-email`** sends a **welcome** message via **Resend** when the user’s **email address** is registered / verified on Supabase Auth.

- **Phone-only OTP:** usually no `email` on the row → function returns `{ skipped: true }`.

## When the email is sent (important)

| Situation | Sent? |
|-----------|--------|
| Signup with **“Confirm email” off**, OAuth, or provider that sets `email_confirmed_at` on insert | **Yes** on **INSERT** |
| Signup with **“Confirm email” on** (common email/password): row is inserted **before** the user clicks the confirmation link | **No** on INSERT (pending verify) |
| User **clicks the confirmation link** | **Yes** on **UPDATE** when `email_confirmed_at` becomes set |

So the Database Webhook must fire on **`auth.users` for both Insert and Update**. If you only enabled **Insert**, users who must confirm their email will **never** get the welcome email.

## 1. Resend

1. [resend.com](https://resend.com) — verify domain, create API key.
2. **From** address on that domain, e.g. `Nye Clock <hello@yourdomain.com>`.

## 2. Deploy the Edge Function

```bash
cd /path/to/repo
supabase functions deploy welcome-email --no-verify-jwt
```

**Secrets** (Dashboard → Project Settings → Edge Functions, or CLI):

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | `Name <addr@yourdomain.com>` |
| `WELCOME_WEBHOOK_SECRET` | Optional; if set, webhook must send header `x-webhook-secret: <same>` |
| `WELCOME_SEND_ON_INSERT_UNCONFIRMED` | Optional: `true` or `1` to also send welcome on **INSERT** when email is **not** confirmed yet (old behavior; can duplicate if you also use UPDATE) |
| `WELCOME_WEBHOOK_REQUIRE_AUTH_USERS` | Optional: `true` to ignore payloads unless `schema=auth` and `table=users` |

## 3. Database Webhook (`auth.users`)

1. Supabase Dashboard → **Database** → **Webhooks** → **Create**.
2. **Table:** `users` in schema **`auth`** (shown as `auth.users`).
3. **Events:** enable **Insert** and **Update** (both).
4. **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/welcome-email`
5. **Headers** (if using secret): `x-webhook-secret` = same as `WELCOME_WEBHOOK_SECRET`.
6. Save.

## 4. Avoid duplicate emails with Supabase “Confirm signup”

Users may still get Supabase’s own confirmation email **and** this welcome. Adjust **Authentication → Email Templates** / confirmation settings as needed.

## 5. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| **503** `missing_resend_env` | Set `RESEND_API_KEY` and `RESEND_FROM` on the function |
| **401** | Webhook `x-webhook-secret` must match `WELCOME_WEBHOOK_SECRET` |
| **502** `resend_failed` | Resend logs, domain verification, From address |
| **Never get welcome** with “confirm email” on | Webhook must include **Update**, not only Insert |
| **Skipped** `insert_pending_email_confirm` | Expected on insert when confirmation required; user should get mail after **Update** when they confirm |

Function source: `supabase/functions/welcome-email/index.ts`.
