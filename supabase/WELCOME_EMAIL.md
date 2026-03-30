# Welcome email after registration (email only)

This project includes an Edge Function **`welcome-email`** that sends a **welcome message** to the user’s **email** using **Resend**.

- **Email/password or magic-link signups:** `auth.users` has an `email` → welcome email can be sent.
- **Phone-only OTP:** there is often **no email** on the user record → the function **skips** sending (SMS welcome is not implemented; add Twilio etc. separately if needed).

## 1. Resend

1. Create an account at [resend.com](https://resend.com), verify your **sending domain**, and create an **API key**.
2. Choose a **From** address on that domain, e.g. `Nye Clock <hello@yourdomain.com>`.

## 2. Deploy the Edge Function

Install [Supabase CLI](https://supabase.com/docs/guides/cli), link your project, then:

```bash
cd /path/to/Adonyth
supabase functions deploy welcome-email --no-verify-jwt
```

Set **secrets** (Dashboard → Project Settings → Edge Functions, or CLI):

| Secret | Example |
|--------|---------|
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM` | `Nye Clock <hello@yourdomain.com>` |
| `WELCOME_WEBHOOK_SECRET` | long random string (optional; recommended) |

If `WELCOME_WEBHOOK_SECRET` is set, the webhook request must include header:

`x-webhook-secret: <same value>`

## 3. Database Webhook (auth.users INSERT)

1. Supabase Dashboard → **Database** → **Webhooks** → **Create**.
2. **Table:** `auth.users` (schema `auth`).
3. **Events:** Insert.
4. **HTTP Request URL:**  
   `https://<PROJECT_REF>.supabase.co/functions/v1/welcome-email`
5. **HTTP Headers** (if you use the secret):  
   - Name: `x-webhook-secret`  
   - Value: same as `WELCOME_WEBHOOK_SECRET`
6. Save.

Supabase will POST a JSON body that includes `record` with the new user row. The function reads `record.email`.

## 4. Avoid duplicate / spam

- Trigger only on **INSERT** (not on every login).
- If you also send Supabase’s built-in “Confirm signup” email, users may get **two** emails unless you disable or merge templates; adjust **Authentication → Email Templates** in the Dashboard as needed.

## 5. Troubleshooting

- **503 `missing_resend_env`:** set `RESEND_API_KEY` and `RESEND_FROM` on the function.
- **401:** webhook secret mismatch — align Dashboard header with `WELCOME_WEBHOOK_SECRET`.
- **502 `resend_failed`:** check Resend dashboard logs, domain verification, and “from” address.

Function source: `supabase/functions/welcome-email/index.ts`.
