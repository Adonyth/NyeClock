# Nye Clock — Desktop (Electron)

Loads the **deployed** Nye Clock site by default, or **`../index.html`** in development when present.

## Prerequisites

- Node.js 18+
- macOS to build `.dmg` (electron-builder)

## Configure app URL

Point the window at your Cloudflare Pages URL (or any HTTPS origin that serves the app):

```bash
export NYE_CLOCK_APP_URL="https://YOUR_PROJECT.pages.dev/tw_.html"
```

If unset, the default in `main.js` is `https://nyeclock.pages.dev/tw_.html` — **change this** before publishing a public DMG.

## Development

From repo root (so `index.html` exists next to `desktop/`):

```bash
cd desktop
npm install
npm start
```

## Build DMG (macOS)

```bash
cd desktop
npm install
NYE_CLOCK_APP_URL="https://YOUR_PROJECT.pages.dev/tw_.html" npm run dist:mac
```

Artifacts appear under `desktop/dist/` (e.g. `NyeClock-1.0.0-arm64.dmg`).

### Code signing / notarization (optional)

For distribution outside your own machine, Apple requires signing + notarization. Configure `mac.identity` and `notarize` in `package.json` → `build` (see electron-builder docs). This repo ships an **unsigned** DMG recipe suitable for CI/GitHub Actions artifacts.

## GitHub Releases

Upload the generated `.dmg` as a release asset (see `../RELEASES.md`).
