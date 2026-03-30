# Cloudflare + GitHub + Supabase Setup

This guide deploys Nye Clock without VPS using:
- Cloudflare Pages (static + serverless functions)
- GitHub repo
- Supabase Auth + DB

## 1) Supabase

1. In Supabase SQL Editor, run: `supabase/nye_user_data.sql`
2. In Authentication -> Providers, enable the methods you want (Email/Phone/Google/Apple/Facebook).
3. Keep these values ready:
   - Project URL
   - anon public key

## 2) Cloudflare Pages project

1. Cloudflare Dashboard -> Pages -> Create project -> Connect to Git.
2. Select repo: `Adonyth/NyeClock`
3. Set **Root directory** to `Adonyth`
4. Build settings:
   - Build command: *(leave empty)*
   - Build output directory: *(leave empty)*
5. Deploy.

## 3) Pages environment variables

In Cloudflare Pages -> your project -> Settings -> Environment variables, add for both Preview + Production:

- `SUPABASE_URL` = your Supabase project URL (e.g. `https://xxxx.supabase.co`)
- `SUPABASE_ANON_KEY` = your Supabase anon public key
- `OAUTH_REDIRECT` = your final Pages URL or custom domain (e.g. `https://nyeclock.pages.dev`)

Then trigger a redeploy.

## 4) Supabase redirect settings

In Supabase Authentication -> URL Configuration:

- Site URL: your Cloudflare Pages URL
- Redirect URLs: include your Pages/custom domain (wildcard if needed)

Example:
- `https://nyeclock.pages.dev`
- `https://nyeclock.pages.dev/*`

## 5) Verify

After deploy:

- Open `https://<your-pages-domain>/api/health` -> should return `{ "ok": true, ... }`
- Open `https://<your-pages-domain>/api/cloud-config` -> should return Supabase config JSON
- Open app root `/` -> should render `tw_.html` (via `_redirects`)
- In My Account -> Cloud, register/login directly without filling URL/key
