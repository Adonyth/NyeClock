# Nye Clock — distribution overview

This document ties together the **official landing page**, **web app**, **macOS DMG**, **GitHub**, and **welcome email** automation.

## 1. GitHub repository

| Item | URL / path |
|------|------------|
| Public repo (expected) | `https://github.com/Adonyth/NyeClock` |
| Default branch | `main` |
| Clone | `git clone https://github.com/Adonyth/NyeClock.git` |

Push workflow (see also `README.md`):

```bash
cd Adonyth
npm run build
git add -A
git commit -m "Release packaging"
git push origin main
```

Tags for desktop releases (optional):

```bash
git tag -a v1.0.0 -m "Desktop v1.0.0"
git push origin v1.0.0
```

## 2. Web app (Cloudflare Pages)

- **Source of truth:** `tw_.html` → build copies to `index.html` (`npm run build`).
- **Root URL** serves the full instrument (`/` → `index.html` via `_redirects`).
- **API:** `functions/api/cloud-config.js`, `functions/api/health.js`.

Configure the project root to the **`Adonyth`** folder (or repo subpath), build command `npm run build`, output directory `.` — see `CLOUDFLARE_SETUP.md`.

## 3. Official website (landing page)

Static files live in **`website/`**:

- **`website/index.html`** — short official page with links to the app, GitHub, and releases.

**URLs on Pages:**

- App (full UI / top bar): `https://<your-domain>/tw_.html` (root `/` may not match if deploy skipped `npm run build`)
- Landing: `https://<your-domain>/website/` or `https://<your-domain>/website/index.html`

The landing page’s “Open web app” uses `../tw_.html` (resolved from `/website/`) so it always opens the same file as the main SPA.

## 4. Download links (DMG)

**Canonical download location:** **GitHub Releases** (attach the `.dmg` as a release asset).

- Latest release shortcut: `https://github.com/Adonyth/NyeClock/releases/latest`
- Example asset name (from electron-builder): `NyeClock-1.0.0-arm64.dmg`, `NyeClock-1.0.0-x64.dmg`

You can paste these URLs into the landing page (`website/index.html`) or any marketing email.

**Build the DMG locally (macOS):**

```bash
cd desktop
npm install
export NYE_CLOCK_APP_URL="https://<your-pages-domain>/"
npm run dist:mac
```

Artifacts: `desktop/dist/*.dmg`

See `desktop/README.md` and `RELEASES.md` for signing and CI.

## 5. Welcome email (Resend + Supabase)

New users who register with an **email address** can receive an automated **welcome email** via:

- **Resend** (or any HTTP API you swap in) — Edge Function calls Resend.
- **Supabase Database Webhook** on `auth.users` **INSERT** → POST to the `welcome-email` Edge Function.

**Phone-only signups** do not have an email; the function **skips** sending (see `supabase/WELCOME_EMAIL.md`). SMS welcome would require a separate provider (e.g. Twilio).

---

For release checklist and CI, see **`RELEASES.md`**.
