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
3. **Root directory:** leave **empty** (repository root).  
   This repo has `website/`, `tw_.html`, etc. at the **top level** — there is **no** `Adonyth/` subfolder in Git. If you set Root directory to `Adonyth`, the build points at a path that does not exist, and **deployed files (including `/website/`) will not update** even when `main` on GitHub changes.
4. Build settings:
   - **Build command:** `npm run build`  
     (copies `tw_.html` → `index.html` for parity; **`_redirects` maps `/` to `tw_.html`**, so the live site root always serves the same file as `tw_.html` even if a deploy skipped the copy step.)
   - **Build output directory:** `.`（仓库根目录）
5. Deploy.

## 3) Pages environment variables

In Cloudflare Pages -> your project -> Settings -> Environment variables, add for both Preview + Production:

- `SUPABASE_URL` = your Supabase project URL (e.g. `https://xxxx.supabase.co`)
- `SUPABASE_ANON_KEY` = your Supabase anon public key
- `OAUTH_REDIRECT` = your final Pages URL or custom domain (e.g. `https://nyeclock.pages.dev`)

These are **not** read from `index.html` — they are injected at runtime by the **Pages Function** `functions/api/cloud-config.js`. The browser loads `https://<your-domain>/api/cloud-config` and the app applies them before sign-up.

If you skip `OAUTH_REDIRECT`, the app falls back to `location.origin + '/'` for OAuth redirects.

**You usually do not need anything else.** As long as `/api/cloud-config` returns JSON (see §5), the app gets Supabase from Cloudflare automatically — no extra files.

**Rare fallback only:** If that URL ever fails (e.g. preview branch without env vars), the app can also read `/cloud-config.json` at the site root. That means: duplicate the example file `cloud-config.example.json` as `cloud-config.json`, paste the same URL and anon key you already use in Cloudflare, upload with the site. **Skip this** unless you know the Function is broken; it keeps secrets in the repo twice and is easy to forget to update.

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
- Open app root `/` -> rewrites to **`tw_.html`**（见 `_redirects`）；`/tw_.html` 与 `/` 为同一应用源码
- **My account → Cloud**：应直接显示邮箱/手机/OAuth 与注册、登录（无需在页面里填 URL/key；由 `/api/cloud-config` 注入）
- **macOS DMG（本站托管，方案 1）**：将 `website/downloads/NyeClock-1.0.0-arm64.dmg` 提交并部署后，访问 `https://<your-pages-domain>/website/downloads/NyeClock-1.0.0-arm64.dmg` 应触发下载（非 HTML）。详见 `website/downloads/README.txt` 与 `scripts/attach-dmg-to-website.sh`。

## 6) 面向最终用户：直接注册与登录

1. **Authentication → Providers**：至少启用 **Email**（如需手机或社交，再启用 Phone / Google 等并完成控制台配置）。
2. **Authentication → Sign In / Providers → Email**  
   - 若希望用户**注册后立即用密码登录**，可关闭「Confirm email」或配合邮件模板完成验证（按你的产品策略选择）。  
   - 若保持「需邮箱确认」，界面会提示用户查收邮件——属正常流程。
3. **URL Configuration**：`Site URL` 与 **Redirect URLs** 必须包含你的 Pages 域名（见上文 §4）。
4. 重新部署后，用无痕窗口测试：**注册 → 登录 → 上传/下载**（依赖表 `nye_user_data` 与 RLS，见 `supabase/nye_user_data.sql`）。
