# Changelog

All notable Hearth OS changes are recorded here.

## [Unreleased]

## [1.2.0] — Responsive shell, snapping and selective Liquid Glass

### Changed
- Fixed right-edge Home widget folding by gating the persisted 1120px freeform coordinate model on both viewport and configured canvas capacity.
- Replaced duplicated/dead top-bar navigation with a compact `mmoptibuilds` status bar and hardened Control Center dismissal/focus behavior.
- Added persisted left/right, four-corner and maximize window snapping with floating-geometry restoration and drag-edge discovery.
- Made built-in app layouts container-responsive, removed shortcut double boxing and expanded the full-viewport Launchpad to use the shared user-link repository.
- Made folders appearance-customizable and limited add/remove/delete operations to Edit Mode; removed folder counts and added outside/Escape dismissal.
- Added one lazy, selective `@ybouane/liquidglass` renderer for the menu bar and Dock, settings presets/custom controls, accessibility/device/FPS fallbacks, and cosine dock magnification.

### Compatibility and assets
- Older settings, backup and window rows remain accepted through default merging and optional-field validation.
- No Figma community artwork ships in v1.2 because production-use licensing metadata was not available.

### Verification
- Clean-install ESLint, TypeScript, **26 Vitest files / 143 tests**, production build/PWA generation, aggregate `npm run check` and `git diff --check` passed.
- Fresh production Playwright: **106 discovered; 82 passed, 24 intentionally project-inapplicable skips, 0 failed** across desktop/mobile projects. PWA/offline, viewport overflow and clean console/page-error journeys passed.
- Desktop/phone light/dark, Settings, Control Center and Launchpad captures were reviewed against all readable v1.2 references and the live HTML motion study. Supplied references 01–03 are truncated in both the checkout and canonical Git blob and could not be decoded; dimensions/README guidance were still checked.

### Repository consolidation — 2026-09-07
- Consolidated the v1.1 UI/runtime branch and the newer reference/documentation branch into one maintained history.
- Kept the v1.1 runtime implementation as the application source of truth.
- Moved reference-only UI-kit/screenshots under `design-references/` and retained the supplied Liquid Glass/dock HTML study there.
- Removed obsolete one-shot prompts, V2/build ledgers, superseded planning files, `issues.txt`, the old root `assets/` path and the unrelated vendored `liquidGL-main/` directory.
- Replaced competing documentation with one current set for v1.1 plus the approved next visual/material refinement.
- No new runtime feature is claimed by this repository consolidation.

## [1.1.0] — Hearth OS visual and structural overhaul

### Changed
- Home became the permanent desktop surface; Apps opens Launchpad instead of replacing the workspace.
- Desktop apps support concurrent floating windows with focus/z-order, traffic-light controls, minimize/restore, maximize, resize and viewport bounds.
- Narrow devices use safe-area-aware sheets while Home remains mounted.
- Dexie schema v4 added persistent Hearth-owned window state with opt-in reload restoration.
- Home placement became bounded and collision-free with shared geometry, soft snapping/alignment guidance and per-kind minimums.
- Links/Embed behavior was contained inside bounded surfaces; Embed gained host toolbar/Open/fullscreen controls.
- Settings gained material, icon, dock, density, transparency, contrast, motion, restore and embed controls.
- Shared glyph/material/token systems replaced inconsistent per-surface styling.

### Compatibility
- Existing Home pages, shortcuts, folders, widgets, wallpapers, notes, tasks, dock items and settings remain readable through defaults/migrations.
- Backup/restore includes the new window table and validates new fields.

### Verification recorded by the v1.1 implementation workspace
- lint passed;
- typecheck passed;
- Vitest passed: **19 files / 130 tests**;
- production build/PWA generation passed;
- `git diff --check` passed;
- desktop/mobile Playwright was not run in that workspace because it lacked the browser/e2e environment.

## [1.0.0] — Initial release

Initial local-first PWA with Home pages, Dashboard-era mini-apps, widgets, wallpapers, Settings, backup/restore, local search/navigation and offline app-shell support.
