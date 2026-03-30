<<<<<<< HEAD
# Adonyth

Nye Clock web source (`tw_.html`, `manifest.json`).

## GitHub 仓库（`Adonyth/NyeClock`，分支 `main`）

本机首次配置远程并同步：

```bash
cd /path/to/Adonyth
bash scripts/setup-github-remote.sh
```

之后每次改完代码，用一条命令提交并推送（Cloudflare Pages 会随 `main` 更新而部署）：

```bash
bash scripts/git-push.sh "描述本次修改"
```

说明：Git **不会**在保存文件时自动上传；需要提交（commit）再推送（push）。上述脚本把两步合并成一条命令。首次 `push` 前请在终端登录 GitHub（推荐 `brew install gh && gh auth login`）。

## Direct login backend (no user-side setup)

This project now supports server-side cloud bootstrap:
- frontend calls `GET /api/cloud-config`
- backend returns `supabaseUrl` + `supabaseAnonKey`
- users can register/login directly in **My account -> Cloud**

### Run locally

```bash
cd backend
npm install
cp .env.example .env
# edit .env:
#   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
#   SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
#   OAUTH_REDIRECT=http://localhost:8787
npm start
```

Open: `http://localhost:8787`

One-time DB setup SQL: `supabase/nye_user_data.sql`.

## Cloudflare Pages (no VPS)

If you want GitHub + Cloudflare + Supabase only (no VPS), use:

- `functions/api/cloud-config.js`
- `functions/api/health.js`
- `_redirects`（将 `/` 重写到 `index.html`）
- `CLOUDFLARE_SETUP.md` for full setup steps

**Important:** `tw_.html` is the source of truth. Run `npm run build` (copies `tw_.html` → `index.html`) before deploy, or set Cloudflare **Build command** to `npm run build` so `/` always serves the latest app (Pages prefers `index.html` when present).

### Docker (production-style local run)

```bash
cd backend
cp .env.example .env
# fill SUPABASE_URL / SUPABASE_ANON_KEY / OAUTH_REDIRECT
docker compose up --build -d
```

Open: `http://localhost:8787`

### Nginx reverse proxy (production)

Use `backend/deploy/nginx.nye-clock.conf` as a template, then:

1. set `server_name` to your domain
2. keep upstream as `127.0.0.1:8787` (or your container host port)
3. add TLS with certbot (recommended)

### systemd service (server auto-start)

Server commands (Ubuntu/Debian):

```bash
cd /opt/nye-clock/Adonyth/backend
sudo cp deploy/nye-clock.service /etc/systemd/system/nye-clock.service
sudo systemctl daemon-reload
sudo systemctl enable --now nye-clock
sudo systemctl status nye-clock --no-pager -l
```

If your repo path or runtime user differs, edit:
- `WorkingDirectory`
- `EnvironmentFile`
- `User` / `Group`

### HTTPS in one command (certbot + nginx)

```bash
cd /opt/nye-clock/Adonyth/backend
sudo DOMAIN=your-domain.example.com EMAIL=you@example.com bash deploy/setup-https.sh
```

This will:
- install nginx + certbot
- write nginx config from template
- issue TLS cert and force HTTPS redirect

### GitHub Actions auto-deploy over SSH

Workflow file: `.github/workflows/deploy-nye-backend.yml`

Add these GitHub repository secrets:
- `NYE_DEPLOY_HOST` (server IP/domain)
- `NYE_DEPLOY_USER` (SSH user, e.g. `ubuntu`)
- `NYE_DEPLOY_SSH_KEY` (private key content)
- `NYE_DEPLOY_PORT` (optional, default `22`)

On each push to `main` touching backend/web files, Actions will:
1. SSH into server
2. `git pull --rebase`
3. install backend deps
4. restart `nye-clock` service

## Zero-manual first deployment (single command)

On a fresh Ubuntu/Debian server:

```bash
cd /tmp
git clone <YOUR_REPO_URL> nye-clock
cd nye-clock/Adonyth/backend
sudo \
  REPO_URL="<YOUR_REPO_URL>" \
  DOMAIN="your-domain.example.com" \
  EMAIL="you@example.com" \
  SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  SUPABASE_ANON_KEY="YOUR_ANON_PUBLIC_KEY" \
  OAUTH_REDIRECT="https://your-domain.example.com" \
  bash deploy/bootstrap-server.sh
```

What it does:
- installs Node.js, Nginx, Certbot
- clones/updates repo under `/opt/nye-clock`
- writes backend `.env`
- installs and starts `systemd` service (`nye-clock`)
- configures nginx reverse proxy
- enables HTTPS automatically when `DOMAIN` + `EMAIL` are provided
=======
# NyeClock
>>>>>>> origin/main
