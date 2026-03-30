#!/usr/bin/env bash
set -euo pipefail

# One-shot server bootstrap for Ubuntu/Debian.
# Example:
# sudo \
#   REPO_URL="https://github.com/YOUR_USER/YOUR_REPO.git" \
#   DOMAIN="clock.example.com" \
#   EMAIL="you@example.com" \
#   SUPABASE_URL="https://xxx.supabase.co" \
#   SUPABASE_ANON_KEY="xxx" \
#   OAUTH_REDIRECT="https://clock.example.com" \
#   bash deploy/bootstrap-server.sh

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Please run as root (use sudo)."
  exit 1
fi

REPO_URL="${REPO_URL:-}"
APP_ROOT="${APP_ROOT:-/opt/nye-clock}"
SERVICE_NAME="${SERVICE_NAME:-nye-clock}"
APP_USER="${APP_USER:-www-data}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
OAUTH_REDIRECT="${OAUTH_REDIRECT:-}"
CORS_ORIGIN="${CORS_ORIGIN:-}"

if [[ -z "$REPO_URL" ]]; then
  echo "Missing REPO_URL."
  echo "Example: REPO_URL=https://github.com/YOUR_USER/YOUR_REPO.git"
  exit 1
fi
if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" ]]; then
  echo "Missing SUPABASE_URL or SUPABASE_ANON_KEY."
  exit 1
fi

echo "[1/7] Installing system dependencies..."
apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx ca-certificates gnupg

if ! command -v node >/dev/null 2>&1; then
  echo "[2/7] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "[2/7] Node.js already installed."
fi

echo "[3/7] Cloning/updating repository..."
if [[ -d "$APP_ROOT/.git" ]]; then
  git -C "$APP_ROOT" pull --rebase
else
  rm -rf "$APP_ROOT"
  git clone "$REPO_URL" "$APP_ROOT"
fi

BACKEND_DIR="$APP_ROOT/Adonyth/backend"
if [[ ! -f "$BACKEND_DIR/server.js" ]]; then
  echo "Backend not found at: $BACKEND_DIR"
  echo "Check APP_ROOT or repository structure."
  exit 1
fi

echo "[4/7] Writing backend .env..."
cat > "$BACKEND_DIR/.env" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
OAUTH_REDIRECT=$OAUTH_REDIRECT
PORT=8787
CORS_ORIGIN=$CORS_ORIGIN
EOF

echo "[5/7] Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --omit=dev

echo "[6/7] Installing systemd service..."
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
sed \
  -e "s#^User=.*#User=${APP_USER}#g" \
  -e "s#^Group=.*#Group=${APP_USER}#g" \
  -e "s#^WorkingDirectory=.*#WorkingDirectory=${BACKEND_DIR}#g" \
  -e "s#^EnvironmentFile=.*#EnvironmentFile=${BACKEND_DIR}/.env#g" \
  "$BACKEND_DIR/deploy/nye-clock.service" > "$SERVICE_PATH"
systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"

echo "[7/7] Configuring nginx + optional HTTPS..."
NGINX_SRC="$BACKEND_DIR/deploy/nginx.nye-clock.conf"
NGINX_DST="/etc/nginx/sites-available/${SERVICE_NAME}.conf"
SERVER_NAME="${DOMAIN:-_}"
sed "s/your-domain.example.com/${SERVER_NAME}/g" "$NGINX_SRC" > "$NGINX_DST"
ln -sf "$NGINX_DST" "/etc/nginx/sites-enabled/${SERVICE_NAME}.conf"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

if [[ -n "$DOMAIN" && -n "$EMAIL" ]]; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
fi

echo
echo "Bootstrap complete."
echo "Service: systemctl status ${SERVICE_NAME} --no-pager -l"
if [[ -n "$DOMAIN" ]]; then
  echo "Open: https://${DOMAIN}"
else
  echo "Open: http://<server-ip>"
fi
