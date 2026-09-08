# Hearth OS

Hearth is a local-first, installable personal desktop for the browser. **Home is the desktop**: wallpaper, shortcuts, folders, widgets, Apps/Launchpad, status bar and dock stay mounted while apps open over them.

Current package version: **1.2.0**.

Hearth has no account, backend, ads, analytics or runtime AI. Persistent data lives in IndexedDB through Dexie for the current browser origin.

## Current v1.2 experience

- Permanent Home workspace; the Dock opens a full-viewport Launchpad with built-in apps and user links.
- Desktop apps use floating windows with focus/z-order, traffic lights, minimize/restore, resize and half/corner/maximize snapping.
- Narrow screens use safe-area-aware iOS-style sheets while Home remains underneath.
- Window geometry/lifecycle state persists through Dexie v4; reload restoration is opt-in.
- Desktop Home uses bounded, collision-free freeform geometry only when the canonical canvas fits; all narrower/configured-small canvases use compact responsive placement without folded right-edge widgets.
- Widgets and embeds own their scrolling inside bounded surfaces. The document, shell and Home do not become website-like vertical scroll containers.
- A compact `mmoptibuilds` status bar exposes only live controls; Control Center is keyboard trapped, Escape/outside dismissible and restores focus.
- Settings controls theme/material appearance, selective Liquid Glass presets, icon presentation, dock behavior, Home density/canvas behavior, transparency, contrast, motion, window restoration and embed chrome.
- Notes, Tasks, Calendar, Links, Calculator and Settings are built-in apps; Home includes the existing typed widget set.
- PWA/offline behavior, backup/restore, safe URL handling and local-first persistence remain intact.

## v1.2 material refinement

The menu bar and Dock use one lazy `@ybouane/liquidglass` WebGL context where supported. CSS and solid tiers cover unsupported, low-memory, reduced-effects, reduced-transparency and sustained low-FPS cases. Dock magnification uses a restrained cosine falloff and stays disabled for touch, editing and reduced motion. The reviewed Figma community sheet was not shipped because production-use licensing metadata was not available.

See [`DESIGN.md`](DESIGN.md), [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) and [`design-references/README.md`](design-references/README.md).

## Run locally

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

## Verify

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run test:e2e
```

Playwright uses a production build/preview, so rebuild after changing `src/`.
The v1.2 release gate completed with 26/26 Vitest files (143 tests) and 82 passed / 24 intentionally skipped Playwright cases from 106 discovered, with no failures.

## Code layout

```text
src/components/     shell chrome, launcher, windows, shared glyphs
src/features/       Home, mini-apps, widgets, search, Settings
src/data/           Dexie schema/migrations, repositories, geometry
src/state/          immediate UI state; durable state stays in Dexie
src/styles/         tokens, materials, global primitives, motion
design-references/  non-runtime visual/motion references
```

## Maintained documentation

- [`DESIGN.md`](DESIGN.md) — current visual/material rules
- [`CLAUDE.md`](CLAUDE.md) — current engineering contract for Claude/agent work
- [`AGENTS.md`](AGENTS.md) — shared contributor/agent rules
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — current product behavior
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — current architecture
- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — concise status/source of truth
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — verification requirements/record
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — next/deferred work
- [`CHANGELOG.md`](CHANGELOG.md) — release history
