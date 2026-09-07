# Hearth OS

Hearth is a local-first, installable personal desktop for the browser. **Home is the desktop**: wallpaper, shortcuts, folders, widgets, Apps/Launchpad, status bar and dock stay mounted while apps open over them.

Current package version: **1.1.0**.

Hearth has no account, backend, ads, analytics or runtime AI. Persistent data lives in IndexedDB through Dexie for the current browser origin.

## Current v1.1 experience

- Permanent Home workspace; Apps opens an overlay instead of navigating away.
- Desktop apps use floating windows with focus/z-order, traffic lights, minimize/restore, maximize, resize and viewport bounds.
- Narrow screens use safe-area-aware iOS-style sheets while Home remains underneath.
- Window geometry/lifecycle state persists through Dexie v4; reload restoration is opt-in.
- Desktop Home uses bounded, collision-free freeform geometry; narrow layouts use compact responsive placement.
- Widgets and embeds own their scrolling inside bounded surfaces. The document, shell and Home do not become website-like vertical scroll containers.
- Settings controls theme/material appearance, icon presentation, dock behavior, Home density/canvas behavior, transparency, contrast, motion, window restoration and embed chrome.
- Notes, Tasks, Calendar, Links, Calculator and Settings are built-in apps; Home includes the existing typed widget set.
- PWA/offline behavior, backup/restore, safe URL handling and local-first persistence remain intact.

## Active visual refinement

The next approved visual pass should **refine the existing v1.1 app, not rebuild it**:

- selective WebGL Liquid Glass using `ybouane/liquidglass` only on high-value shell surfaces, behind CSS/solid fallbacks;
- smoother proximity-based dock magnification inspired by the committed HTML reference;
- reviewed Figma app-icon artwork where licensing permits, while keeping system/control glyphs separate;
- restrained widget geometry, typography, radii and optical spacing;
- continued desktop/mobile responsiveness, Reduced Effects and performance safeguards.

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

- [`DESIGN.md`](DESIGN.md) — current visual/material rules and next refinement
- [`CLAUDE.md`](CLAUDE.md) — current engineering contract for Claude/agent work
- [`AGENTS.md`](AGENTS.md) — shared contributor/agent rules
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — current product behavior
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — current architecture
- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — concise status/source of truth
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — verification requirements/record
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — next/deferred work
- [`CHANGELOG.md`](CHANGELOG.md) — release history
