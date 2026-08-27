# Setup Guide

This document covers everything needed to get Solar System 3D running locally, in CI, or deployed to production.

---

## Prerequisites

| Tool | Required version | Check |
|------|-----------------|-------|
| Node.js | 22+ | `node -v` |
| npm | 10+ (bundled with Node 22) | `npm -v` |
| Git | Any recent version | `git --version` |

The repository ships an `.nvmrc` containing `22`. If you use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows), run `nvm use` in the project root and it will switch automatically.

---

## Installation

```bash
git clone https://github.com/kuldeepcodes/solar-system-3d.git
cd solar-system-3d
npm install
```

---

## Development Server

```bash
npm run dev
```

Opens a Vite dev server at [http://localhost:5173](http://localhost:5173) with Hot Module Replacement. Changes to TypeScript, TSX, CSS, and GLSL files are reflected immediately without a full page reload.

---

## Textures (Optional)

Planet and moon textures are **not** committed to this repository. The app ships a procedural fallback that synthesises plausible textures at runtime using seeded fBm noise — so the app works fully without downloaded textures.

To get the full photorealistic appearance, run:

```bash
npm run textures
```

This executes `scripts/fetch-textures.mjs`, which:

- Downloads CC BY 4.0 textures from Solar System Scope
- Saves them into `public/textures/` (this folder is listed in `.gitignore`)
- Skips files that already exist, so re-running is safe and fast

The download is roughly 200–400 MB depending on the resolution chosen. It only needs to run once per clone; the files persist across dev server restarts.

If a texture is absent at runtime the browser console will print a message like:

```
[textures] sun.jpg not found — using procedural fallback
```

This is not an error; it is expected behaviour on a fresh clone.

---

## Production Build

```bash
npm run build
```

Runs `tsc -b` (full TypeScript project build) followed by `vite build`. Output lands in `dist/`.

To build for a sub-path deployment (e.g. GitHub Pages):

```bash
BASE_PATH=/solar-system-3d/ npm run build
```

The Vite config reads `process.env.BASE_PATH` and sets it as the Vite `base` option, which prefixes all asset URLs.

---

## Preview the Production Build

```bash
npm run build
npm run preview
```

Serves `dist/` on [http://localhost:4173](http://localhost:4173). This is the closest approximation to production without deploying.

---

## Running Tests

```bash
npm test           # watch mode — reruns on file changes
npm test -- --run  # single pass (used in CI)
```

Tests run under [Vitest](https://vitest.dev/) with `jsdom` as the DOM environment. Coverage is collected via `@vitest/coverage-v8`; run `npm test -- --coverage` to generate a report in `coverage/`.

---

## Lint and Typecheck

```bash
npm run lint        # oxlint — fast Rust-based linter
npm run typecheck   # tsc -b --noEmit — type errors only, no emit
```

Both commands are run in CI on every push and pull request.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_PATH` | `/` | URL sub-path the app is served from. Set to `/solar-system-3d/` when deploying to GitHub Pages. |

No `.env` file is required for local development.

---

## Troubleshooting

### Blank or black screen on load

**Most likely cause:** WebGL 2 is not available.

- Open your browser's developer console and look for WebGL errors.
- On Chrome, navigate to `chrome://gpu` and check that WebGL 2 is listed as "Hardware accelerated".
- On Firefox, check `about:config` for `webgl.disabled` — it must be `false`.
- On a virtual machine or remote desktop, GPU acceleration may be unavailable. Try a different browser or machine.

### Poor frame rate / stuttering

- Open **Settings** (gear icon in the HUD) and lower the **Quality** tier from `high` or `ultra` to `medium` or `low`.
- Quality tiers gate bloom post-processing, geometry subdivision, and adaptive DPR. `low` disables bloom entirely and halves the pixel ratio.
- On integrated graphics, `medium` is a good starting point.

### Textures not appearing (all bodies look procedural)

- Run `npm run textures` to download the texture pack.
- Ensure the download completed without errors — network interruptions leave partial files. Delete `public/textures/` and re-run if in doubt.
- Check the browser console for `[textures]` lines to see which files are missing.

### `npm ci` fails with "engine" errors

Your Node version is too old. The package requires Node 22+. Run:

```bash
nvm install 22
nvm use 22
npm ci
```

### GitHub Pages shows a blank page after deploy

The most common cause is a missing or wrong `BASE_PATH`. Verify:

1. The deploy workflow sets `BASE_PATH: /solar-system-3d/` in the build step's `env` block.
2. The Vite config uses `base: process.env.BASE_PATH ?? '/'`.
3. **Settings → Pages → Build and deployment → Source** is set to **GitHub Actions** (not "Deploy from a branch").
4. After changing the source, re-run the deploy workflow from the Actions tab.

### Hot reload stops working mid-session

Restart the dev server with `npm run dev`. This is a rare Vite HMR edge case that usually happens after large refactors that touch module graph boundaries.
