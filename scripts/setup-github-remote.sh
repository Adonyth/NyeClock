#!/usr/bin/env bash
# 配置本地仓库与 GitHub：Adonyth/NyeClock，默认分支 main。
# 用法：在 Adonyth 目录下执行：bash scripts/setup-github-remote.sh
#
# 说明：若本地已有未提交文件，不能先 checkout 远程分支（会覆盖未跟踪文件）。
#       脚本会先 git add + commit，再与 origin/main 合并。

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ 仓库根目录: $ROOT"

if ! command -v git >/dev/null 2>&1; then
  echo "请先安装 Git（macOS: xcode-select --install）"
  exit 1
fi

# 优先用 main 作为初始分支（避免 master 提示）
if git rev-parse --git-dir >/dev/null 2>&1; then
  echo "→ 已存在 .git，跳过 git init"
else
  if git init -b main 2>/dev/null; then
    :
  else
    git init
    git branch -M main 2>/dev/null || true
  fi
fi

ORIGIN="https://github.com/Adonyth/NyeClock.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$ORIGIN"
else
  git remote add origin "$ORIGIN"
fi

echo "→ 已设置 origin = $ORIGIN"
git remote -v

echo ""
echo "→ 从 GitHub 拉取 main …"
set +e
git fetch origin main
FETCH_OK=$?
set -e

if [ "$FETCH_OK" -ne 0 ] || ! git rev-parse "origin/main" >/dev/null 2>&1; then
  echo "→ 未能 fetch 远程 main（网络、鉴权或远程尚无 main）。你可先本地提交再推送："
  echo "    git add -A && git commit -m \"Initial\" && git push -u origin main"
  exit 0
fi

# 尚无任何本地提交时：先把工作区文件提交，再与远程合并（避免 checkout 覆盖未跟踪文件）
if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "→ 创建首个本地提交（包含当前目录中的文件）…"
  git add -A
  if git diff --cached --quiet 2>/dev/null; then
    echo "没有可提交的文件。"
  else
    git commit -m "chore: import local Adonyth sources"
  fi
fi

# 若远程与本地历史不同，合并
if git rev-parse HEAD >/dev/null 2>&1; then
  echo "→ 与 origin/main 合并（允许无关历史）…"
  set +e
  git merge "origin/main" --allow-unrelated-histories -m "Merge remote main with local" --no-edit
  MERGE_OK=$?
  set -e
  if [ "$MERGE_OK" -ne 0 ]; then
    echo ""
    echo "合并有冲突或需手动处理。请编辑冲突文件后执行："
    echo "  git add -A && git commit && git push -u origin main"
    exit 1
  fi
fi

echo "→ 已与远程 main 合并完成（或无需合并）。"

echo ""
echo "下一步："
echo "  git push -u origin main"
echo ""
echo "后续日常更新："
echo "  bash scripts/git-push.sh \"说明本次修改\""
echo ""
echo "首次 push 需登录 GitHub：brew install gh && gh auth login"
