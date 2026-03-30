Option 1 — host the DMG on this site (same origin as the landing page)

1) Build on a Mac:
   cd desktop && npm install && npm run dist:mac
   → find NyeClock-1.0.0-arm64.dmg under desktop/dist/

2) Copy into this folder (or use the helper script from repo root):
   bash scripts/attach-dmg-to-website.sh desktop/dist/NyeClock-1.0.0-arm64.dmg

3) Commit and push (the file is gitignored by default to avoid accidental huge commits):
   The repo root `.gitattributes` marks `*.dmg` as binary so Git does not corrupt the file.
   git add -f website/downloads/NyeClock-1.0.0-arm64.dmg
   git commit -m "chore: add macOS DMG for site download"
   git push

4) Wait for Cloudflare Pages to finish deploying, then verify in a browser:
   Short URL (recommended): https://<your-pages-domain>/download/nyeclock-mac-arm64.dmg
   Full path: https://<your-pages-domain>/website/downloads/NyeClock-1.0.0-arm64.dmg
   Either should download the binary, not an HTML page.

Version must stay in sync: NYE_DESKTOP_VERSION in ../index.html and version in desktop/package.json.

Intel (x64) Macs: no desktop build — use “Open web app” on the landing page.
