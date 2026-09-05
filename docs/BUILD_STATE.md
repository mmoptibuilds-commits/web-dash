# BUILD_STATE — Hearth V1 one-shot build

**Last updated:** 2026-09-05 · **Branch:** `build/v1-one-shot`
**Session goal:** complete + verify the full V1 per the authoritative one-shot
spec (`Web-dashboard-One-Shot-Claude-Code-Prompt.md`).

## Current phase
Phase 3 (integration) committed. Next: Phase 4 — functional E2E in a real
browser (Playwright), then responsive/visual QA, harsh critique, engineering
review, release readiness.

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

## Lane worktrees
- `D:\web-dash-lanes\{notes-tasks,calendar-bookmarks,settings}` —
  branches `lane/*` now merged into `build/v1-one-shot`. Coordinator owns the
  integrated tree; no further writes on lane branches.

## Verification status
- lint: PASS (0) · typecheck: PASS · test: 45 PASS · build: PASS (+PWA)
- Not yet run: real-browser E2E, responsive + visual QA, screenshots.

## Known integration notes
- Dexie schema indexes added to v1 (unreleased): `layoutItems.refId`,
  `tasks.done`, `dockItems.appId/shortcutId` (cascade + clearCompleted).
- `wipeAllData` seeding-order bug (Settings → Reset) fixed on coordinator.
- Restored backups may contain `{kind:'user'}` wallpaper refs whose media is
  excluded from export; backdrop falls back to the builtin gradient if the
  referenced wallpaper row is absent.
- Version string lives in Settings (`1.0.0`, mirrors package.json).

## Next action
1. Phase 4: Playwright E2E over the 16 spec flows (desktop + mobile,
   reload-persistence), capture screenshots.
2. Phase 5–8: responsive/visual QA, harsh critique, engineering review,
   release readiness (public icons present, no secrets, dist clean).
