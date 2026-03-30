#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   sudo DOMAIN=clock.example.com EMAIL=you@example.com bash deploy/setup-https.sh

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Missing DOMAIN or EMAIL."
  echo "Example: sudo DOMAIN=clock.example.com EMAIL=you@example.com bash deploy/setup-https.sh"
  exit 1
fi

CONF_SRC="$(cd "$(dirname "$0")" && pwd)/nginx.nye-clock.conf"
CONF_DST="/etc/nginx/sites-available/nye-clock.conf"

apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

sed "s/your-domain.example.com/${DOMAIN}/g" "$CONF_SRC" > "$CONF_DST"
ln -sf "$CONF_DST" /etc/nginx/sites-enabled/nye-clock.conf
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "HTTPS enabled for https://${DOMAIN}"
