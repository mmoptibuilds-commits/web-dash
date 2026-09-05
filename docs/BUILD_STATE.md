# BUILD_STATE — Hearth V1 one-shot build

**Last updated:** 2026-09-05 · **Branch:** `build/v1-one-shot`
**Session goal:** complete + verify the full V1 per the authoritative one-shot
spec (`Web-dashboard-One-Shot-Claude-Code-Prompt.md`).

## Current phase
Phase 4 (functional E2E) committed. Next: Phase 5 — responsive + visual QA
(viewport sweeps + screenshots), then harsh critique, engineering review,
release readiness.

## Completed milestones (git)
- Phase 0/1 committed (`2c28da0`, `ab1b76b`): docs/contracts, Vite 8 + React 19
  + TS ~5.9.3 pin, tokens/global/glass/motion CSS, frozen domain/widget/app
  types, Dexie v1 (11 tables) + repositories + barrel + seed, ui store, theme,
  url/search/nav/run libs, widget registry, PWA config, test scaffold.
- Phase 1 shell committed (`488128b`): `main`/`App` boot (theme sync, global
  keys, mode switch), Home launcher (paged strip, ordered grid, tiles,
  edit mode + dialogs, folder overlay), Dashboard (overview, floating windows,
  mobile sheets), shell chrome (menubar, control-center-lite, dock, backdrop),
  search overlay, all CSS modules. Typecheck/lint green.
- Phase 2 lanes merged + integration committed (`59a2…` pending hash,
  `feat(integration)`): notes+tasks, calendar+bookmarks, settings (incl.
  wallpaper + JSON backup/import). All three diffs additive; typecheck green
  after each merge. Feature mini-apps wired into `AppContent`; registry now has
  the full V1 addable list (clock/search/notes/tasks/calendar/links/photo/
  embed); interim panel removed. PWA icon set generated (flame mark,
  192/512/maskable-512/apple-180/favicon). `npm run check` green:
  lint 0, typecheck 0, 12 files / 45 tests, build + PWA (15 precache entries).
- Phase 4 E2E committed (`<pending hash>`): Playwright config (msedge channel,
  desktop 1440×900 + mobile 390×844 projects, runs against `vite preview` so the
  PWA/SW is exercised), shared helpers, 8 spec files covering all 16 spec flows
  incl. reload-persistence and PWA manifest/offline. `e2e`/`test:e2e` scripts.

## Lane worktrees
- `D:\web-dash-lanes\{notes-tasks,calendar-bookmarks,settings}` —
  branches `lane/*` now merged into `build/v1-one-shot`. Coordinator owns the
  integrated tree; no further writes on lane branches.

## Verification status
- lint: PASS (0) · typecheck: PASS · test: 45 PASS · build: PASS (+PWA)
- Playwright E2E (Phase 4): PASS — desktop 18/18, mobile 16/16 + 2 desktop-only
  skips (drag-reorder #7, JSON import/export #16). PWA flows 14/15 pass on both
  projects. Screenshots captured as test artifacts on failure only.
- Not yet run: responsive + visual QA sweep, harsh critique, engineering
  review, release-readiness gates.

## Known integration notes
- Dexie schema indexes added to v1 (unreleased): `layoutItems.refId`,
  `tasks.done`, `dockItems.appId/shortcutId` (cascade + clearCompleted).
- `wipeAllData` seeding-order bug (Settings → Reset) fixed on coordinator.
- Restored backups may contain `{kind:'user'}` wallpaper refs whose media is
  excluded from export; backdrop falls back to the builtin gradient if the
  referenced wallpaper row is absent.
- Version string lives in Settings (`1.0.0`, mirrors package.json).
- E2E: `SearchOverlay` resolves `defaultSearchEngine` one render after mount
  (settings load async); tests wait on the engine hint before submitting. On
  phone widths the menu-bar Home/Dashboard tabs are hidden — mobile switches
  mode via the brand (Home) and the dock "Dashboard" launcher. Fresh IndexedDB
  per test (new context) seeds the starter layout via `ensureBootData`.

## Next action
1. Phase 5: responsive + visual QA — viewport sweeps at key widths, capture
   screenshots (desktop + mobile), fix visual defects.
2. Phase 6–8: harsh critique loop, engineering review (lint/typecheck/tests/
   build, code/security/simplification review, secrets check), release
   readiness (PWA manifest/SW verify, README, CHANGELOG, QA checklist).
