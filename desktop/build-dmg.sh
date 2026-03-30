#!/usr/bin/env bash
# 一键生成 DMG。在终端执行：bash build-dmg.sh
set -e
cd "$(dirname "$0")"
echo "Installing dependencies..."
npm install
echo "Building DMG (may take a few minutes)..."
npm run dist:mac
echo ""
echo "Done. DMG files are here:"
ls -1 dist/*.dmg 2>/dev/null || echo "(none — see errors above)"
open dist 2>/dev/null || true
