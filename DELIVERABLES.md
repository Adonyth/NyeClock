# 交付物在哪里（索引）

**项目根目录（请从这里打开）：**

`/Users/chenjiaxuan/Downloads/UCSB/Adonyth/`

若你在 Cursor 左侧文件树里只看到 `Downloads` 下的其它文件，请展开：**Downloads → UCSB → Adonyth**。

---

## 文档（Markdown）

| 文件 | 说明 |
|------|------|
| `DELIVERABLES.md` | 本文件：交付物索引 |
| `DISTRIBUTION.md` | 总览：GitHub、网站、下载、欢迎邮件如何串起来 |
| `RELEASES.md` | 如何打 DMG、发 GitHub Releases、CI 说明 |
| `CLOUDFLARE_SETUP.md` | Cloudflare Pages 部署（原有） |
| `README.md` | 仓库说明；末尾有「发布与交付」表格 |
| `supabase/WELCOME_EMAIL.md` | 注册后欢迎邮件（Resend + Supabase Webhook） |

## 官网落地页

| 文件 | 说明 |
|------|------|
| `website/index.html` | 独立官网页（按钮链到 Web App / GitHub / Releases） |

## 桌面 DMG（Electron）

| 文件 | 说明 |
|------|------|
| `desktop/README.md` | 本地运行、打 DMG、`NYE_CLOCK_APP_URL` |
| `desktop/package.json` | npm 脚本（如 `dist:mac`） |
| `desktop/main.js` | Electron 主进程 |

**说明：** 打出来的 `.dmg` 在运行 `npm run dist:mac` 之后才会出现在 `desktop/dist/`，且该目录通常在 `.gitignore` 里，不会提交到 Git。

## 欢迎邮件（服务端）

| 文件 | 说明 |
|------|------|
| `supabase/functions/welcome-email/index.ts` | Edge Function 源码 |

## GitHub Actions（可能被隐藏）

| 文件 | 说明 |
|------|------|
| `.github/workflows/release-desktop.yml` | 在 GitHub 上自动/手动打 DMG |

**注意：** 文件夹名以 `.` 开头。在 Finder 里按 **Cmd+Shift+.** 可显示隐藏项；在 Cursor 里应能直接看到 `.github` 文件夹。

---

**没有单独「官网网站」文件夹以外的官网：** 官网就是 `website/index.html`；完整应用仍是根目录的 `index.html`（由 `tw_.html` 构建生成）。
