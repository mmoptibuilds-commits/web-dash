# Hearth — Personal Dashboard

Hearth is a local-first, installable PWA that doubles as a browser start page and lightweight personal web OS. Desktop uses a macOS-inspired freeform environment; phone widths switch to an intentionally iOS-inspired paged/sheet experience rather than squeezing desktop UI.

No account. No backend. No ads. No analytics. Persistent user data lives in the browser's IndexedDB through Dexie unless the user explicitly exports a backup.

## Current status

The original V1 is complete and a substantial V2-era overhaul is already merged on the default branch, including freeform desktop geometry, mobile sheets/bounded embeds, Calculator app/widget, Reduced Effects, accessibility/performance hardening and reference-led visual polish.

Latest recorded runtime verification in `docs/V2_STATUS.md`:

- `npm run check` — lint + typecheck + **126/126 Vitest tests** + PWA build passed.
- `npm run test:e2e` — **81 passed / 23 skipped / 0 failed** against a production build.

**V1.11 is the active next milestone and is not yet implemented by the 2026-09-07 repo-preparation commit.** The repo is now prepared with current source-of-truth docs and design references for that work.

See [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) and [`docs/V1_11_WORK_HANDOFF.md`](docs/V1_11_WORK_HANDOFF.md).

## Features

- **Home** — multiple pages, shortcuts, folders, configurable dock, widgets, wallpapers and Edit Mode. Desktop placement uses the current freeform geometry/grid-lattice system; mobile remains compact/paged/touch-first.
- **Dashboard** — Notes, Tasks, Calendar, Links and Calculator mini-apps in floating desktop windows or mobile sheets.
- **Widgets** — search/clock/date, notes, tasks, calendar, links/bookmarks, photo/embed plus Calculator and other current registry items.
- **Search / omnibox** — URLs navigate same-tab; queries use the selected search engine; suggestions come from local dashboard history.
- **Wallpapers** — built-in gradients and locally stored image/animated/video backgrounds with size/fallback/reduced-motion behavior.
- **Settings** — appearance, layout, wallpaper/search, Reduced Effects and versioned JSON backup/import; only real behavior should be surfaced.
- **PWA** — installable and offline-capable after the initial production load.

## V1.11 direction

The approved visual/UX overhaul will preserve existing functionality while targeting:

- stronger macOS-like desktop and iOS-like mobile visual language;
- a viewport-bound outer shell with scrolling contained inside apps/embeds;
- selective true WebGL Liquid Glass through `ybouane/liquidglass`, with CSS/solid fallback and performance safeguards;
- proximity/spring-style dock magnification based on the committed motion reference;
- reviewed/exported Figma app icons instead of hand-drawn/AI-looking approximations;
- restrained widget shapes, spacing, typography and reduced pill/card clutter.

Read [`DESIGN.md`](DESIGN.md) before implementing any of this.

## Requirements

- Node.js ≥ 20
- npm
- Microsoft Edge for the configured Playwright system-channel E2E path

## Development

```sh
npm install
npm run dev
```

## Production build and verification

```sh
npm run check
npm run build
npx playwright test --project=desktop --project=mobile
```

Playwright runs against the production preview. Rebuild after source changes before using E2E results as evidence.

## Data and backups

Persistent app data is per-origin/per-browser in IndexedDB. Clearing site data removes it. Settings can export/import a versioned JSON backup; large wallpaper/media blobs may be excluded by design.

## Project layout

```text
src/
  components/   shared UI + shell chrome
  features/     Home, mini-apps, widgets, search, settings
  data/         Dexie schema/seed + repositories
  hooks/        reactive data hooks
  lib/          navigation/search/geometry/helpers
  state/        ephemeral Zustand UI state
  styles/       design tokens, global material/motion rules

docs/            architecture, current state, QA, roadmap, ledgers
public/          shipped static/PWA assets
design-references/  non-runtime visual/motion/UI-kit references
```

## Design references

`design-references/` is deliberately separate from runtime assets. It contains the existing local UI-kit/screenshots plus the supplied macOS/LiquidGlass HTML motion reference. See [`design-references/README.md`](design-references/README.md) for rules and external Figma/LiquidGlass links.

## Documentation map

- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — short current implementation/status source
- [`DESIGN.md`](DESIGN.md) — active V1.11 visual/material direction
- [`docs/V1_11_WORK_HANDOFF.md`](docs/V1_11_WORK_HANDOFF.md) — implementation handoff for Work/Codex/Claude
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — current architecture and seams
- [`docs/V2_STATUS.md`](docs/V2_STATUS.md) — detailed historical implementation/evidence ledger
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — baseline evidence + pending V1.11 acceptance gates
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — current roadmap
- [`CHANGELOG.md`](CHANGELOG.md) — notable changes
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — **historical frozen V1 baseline**, not the active V1.11 visual contract
- `Web-dashboard-One-Shot-Claude-Code-Prompt.md` — **historical V1 build prompt**
