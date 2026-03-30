#!/bin/sh
# 以 tw_.html 为唯一源文件，同步到可部署目录 nye-clock-web（请用 HTTPS 托管，勿依赖微信内 file://）
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cp "$ROOT/tw_.html" "$ROOT/nye-clock-web/index.html"
cp "$ROOT/manifest.json" "$ROOT/nye-clock-web/manifest.json"
echo "OK: nye-clock-web/ 已更新"
if [ -d "$ROOT/Adonyth" ]; then
  cp "$ROOT/tw_.html" "$ROOT/Adonyth/index.html"
  cp "$ROOT/manifest.json" "$ROOT/Adonyth/manifest.json"
  echo "OK: Adonyth/ 已更新（GitHub 仓库同名文件夹）"
fi
