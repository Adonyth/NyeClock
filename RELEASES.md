# GitHub Releases & desktop DMG

## Publishing a new DMG

1. **Set production app URL** (the URL the Electron shell should open):

   ```bash
   export NYE_CLOCK_APP_URL="https://YOUR_PROJECT.pages.dev/"
   ```

2. **Build on macOS:**

   ```bash
   cd desktop
   npm install
   npm run dist:mac
   ```

3. **Create a GitHub Release** (web UI or `gh release`):

   - Tag: e.g. `v1.0.0`
   - Attach files from `desktop/dist/` (`*.dmg`)

4. **SHA-256 (optional but recommended):**

   ```bash
   shasum -a 256 desktop/dist/NyeClock-*.dmg
   ```

   Paste the checksum into the release notes.

## CI (optional)

The workflow `.github/workflows/release-desktop.yml` builds a DMG on **workflow_dispatch** or when a tag `v*` is pushed (requires **macOS** runner and may need Apple credentials for signed builds).

In the GitHub repo, set **Actions variable** `NYE_CLOCK_APP_URL` to your live Pages URL (e.g. `https://your-project.pages.dev/`). If unset, the workflow defaults to `https://nyeclock.pages.dev/`.

Unsigned DMGs work for local testing; public distribution usually needs **codesign + notarization** (see electron-builder docs).

## Links for users

- **Latest release:** `https://github.com/Adonyth/NyeClock/releases/latest`
- **Repository:** `https://github.com/Adonyth/NyeClock`

Update `website/index.html` if your org or repo name differs from `Adonyth/NyeClock`.
