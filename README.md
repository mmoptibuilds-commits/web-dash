# Hearth — Personal Dashboard

A local-first, installable PWA that doubles as a browser start page and a
lightweight personal web OS. **Home Mode** is a macOS-inspired launcher of
horizontally paged pages; **Dashboard Mode** is a denser workspace with
Notes / Tasks / Calendar / Links mini-apps in floating windows (desktop) or
full-screen sheets (mobile).

No account. No backend. No ads. No analytics. Everything is stored in your
browser's IndexedDB and never leaves your machine unless you export a backup.

> Built against the frozen V1 contract in
> [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) and
> `Web-dashboard-One-Shot-Claude-Code-Prompt.md` (repo root). See
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the code is organized
> and [`docs/ROADMAP.md`](docs/ROADMAP.md) for what is intentionally V2/V3.

## Features

- **Home Mode** — multiple swipeable pages (indicators, prev/next + keyboard on
  desktop), an ordered snap-grid of tiles, folders, a configurable dock,
  on-page widgets, wallpapers, and an Edit Mode for moving / resizing / adding /
  removing content.
- **Dashboard Mode** — Notes (autosave, pin, search), Tasks, Calendar
  (month view), and Links, all over the same shared data store. Core widgets
  are also available on Home.
- **Built-in widgets** — clock/date, search, notes, tasks, calendar, links,
  photo, and a simple embed (with a clear fallback when a site blocks framing).
- **Search / omnibox** — type a URL to navigate, or a query to search Google,
  Bing, or DuckDuckGo; suggestions come only from your local history.
- **Wallpapers** — gradient presets plus uploaded image / animated / video
  backgrounds (size-checked, stored locally, pauses when hidden, honors
  reduced-motion).
- **Settings** — Simple and Advanced levels; appearance, wallpaper, search
  engine, layout, reduced effects, and JSON backup/export/import.
- **PWA** — installable, works offline after first load, auto-updates.

## Requirements

- Node.js ≥ 20
- npm
- (E2E only) Microsoft Edge — the Playwright suite targets the system
  `msedge` channel, so no Chromium download is needed.

## Quick start (development)

```sh
npm install
npm run dev
```

Open the printed URL (usually http://localhost:5173). First run seeds a starter
Home layout (search + clock widgets, a few shortcut tiles, a Dev folder, and
the default dock).

## Build & preview (production)

```sh
npm run build     # type-check + bundle + generate the PWA service worker
npm run preview   # serve the production build locally (used by the E2E suite)
```

## Install as an app (PWA)

The production build is a valid installable PWA. Serve `dist/` over HTTPS (or
`http://localhost`) with any static host — `npm run preview`, `npx serve dist`,
Netlify/Vercel/GitHub Pages, etc. — then open it in Chromium/Edge and use the
browser's **Install** action (there is deliberately no in-app install button).
After the first load it works offline.

## Data & backups

All data lives in the browser's IndexedDB for the origin you opened. It is
**per-browser and per-device** — clearing the site's data erases it. Use
**Settings → Advanced → Backup** to export a versioned JSON backup, and import
it to restore (or move) your data. Large wallpaper/video media blobs may be
excluded from exports by design.

## Testing

```sh
npm run test     # unit/component tests (Vitest + Testing Library, jsdom)
npm run typecheck
npm run lint
npm run check    # lint + typecheck + tests + build (canonical gate)
npm run e2e      # Playwright against a fresh production build (see note)
npm run test:e2e # build, then run Playwright
```

> **Note:** the Playwright suite runs against `vite preview` (a **production
> build**), not the dev server — this is so the PWA/service-worker behavior is
> exercised. After editing `src/`, run `npm run build` (or `test:e2e`) before
> re-running E2E, or you'll be testing a stale bundle. The suite is split into
> `desktop` (1440×900) and `mobile` (390×844) projects and covers all 16 spec
> flows including reload persistence and offline app-shell behavior.

## Project layout

```
src/
  components/   shell chrome + shared UI (menubar, dock, windows, modal)
  features/     Home (pages/grid/dialogs), mini-apps, widgets, search, settings
  data/         db (Dexie schema/seed) + repositories (the only data-access path)
  lib/          url/search/nav/run/focus/id helpers (pure logic)
  state/        ui.ts — ephemeral UI state (Zustand); persistent state stays in Dexie
  hooks/        data hooks over the repositories
  styles/       design tokens + global CSS
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the layering rules.

## Known limitations & deferrals

Deliberate V1 limits and V2/V3 items are listed in
[`docs/ROADMAP.md`](docs/ROADMAP.md) and the V2/V3 section of
[`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — e.g. calendar events,
Markdown/rich notes, sync/cloud backup, custom/API widgets, native apps, and
weather are all **out of V1 scope**.

## Documentation

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — frozen V1 behavior
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, layering, tables
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — V2/V3 deferrals
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — tested acceptance evidence
- [`docs/BUILD_STATE.md`](docs/BUILD_STATE.md) — build session log
- [`CHANGELOG.md`](CHANGELOG.md) — release notes
