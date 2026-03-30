#!/usr/bin/env bash
# Copy a built DMG into website/downloads/ for Cloudflare Pages (option 1: host on site).
# Usage:
#   bash scripts/attach-dmg-to-website.sh /path/to/NyeClock-1.0.0-arm64.dmg
#
# Then commit the binary (gitignore requires -f) and push so Pages deploys it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="$ROOT/website/downloads"
EXPECTED="NyeClock-1.0.0-arm64.dmg"
SRC="${1:-}"

if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "Usage: bash scripts/attach-dmg-to-website.sh /path/to/${EXPECTED}"
  echo "Build first: cd desktop && npm run dist:mac"
  exit 1
fi

mkdir -p "$DEST_DIR"
cp "$SRC" "$DEST_DIR/$EXPECTED"
echo "→ Installed: $DEST_DIR/$EXPECTED"
ls -lh "$DEST_DIR/$EXPECTED"
echo ""
echo "Next (large file; tracked with -f because *.dmg is gitignored):"
echo "  cd \"$ROOT\""
echo "  git add -f website/downloads/$EXPECTED"
echo "  git commit -m \"chore: add macOS DMG for official site download\""
echo "  git push origin main"
echo ""
echo "After Cloudflare deploys, test: open https://<your-domain>/website/downloads/$EXPECTED"
