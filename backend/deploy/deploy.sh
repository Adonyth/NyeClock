#!/usr/bin/env bash
set -euo pipefail

# Server-side deploy script.
# Assumes repository is cloned at /opt/nye-clock and service name is nye-clock.

ROOT="${ROOT:-/opt/nye-clock}"
SERVICE="${SERVICE:-nye-clock}"

cd "$ROOT"
git pull --rebase

cd Adonyth/backend
npm install --omit=dev

sudo systemctl restart "$SERVICE"
sudo systemctl status "$SERVICE" --no-pager -l || true
