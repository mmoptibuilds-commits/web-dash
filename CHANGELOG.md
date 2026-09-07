# Changelog

All notable Hearth OS changes are recorded here.

## [Unreleased]

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
