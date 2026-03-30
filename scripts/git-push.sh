#!/usr/bin/env bash
# 将当前改动提交并推送到 origin/main（需已运行 setup-github-remote.sh）。
# 用法：bash scripts/git-push.sh "本次提交说明"

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MSG="${1:-Update Nye Clock}"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "请先运行: bash scripts/setup-github-remote.sh"
  exit 1
fi

git add -A
if git diff --cached --quiet; then
  echo "没有可提交的更改（与上次提交相比）。"
  exit 0
fi

git commit -m "$MSG"
git push -u origin main
echo "→ 已推送到 https://github.com/Adonyth/NyeClock (main)"
