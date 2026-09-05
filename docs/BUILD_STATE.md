# BUILD_STATE — Hearth V1 one-shot build

**Last updated:** 2026-09-05 · **Branch:** `build/v1-one-shot`
**Session goal:** complete + verify the full V1 per the authoritative one-shot
spec (`Web-dashboard-One-Shot-Claude-Code-Prompt.md`).

## Current phase
Phase 6 (harsh critique loop, ≤3 rounds) IN PROGRESS — a read-only workflow of
four independent critics (UX/functional, accessibility/interaction, visual
design code-grounded, spec/copy conformance) returns findings which an
adversarial verify stage confirms; coordinator fixes confirmed defects, then
re-runs unit + E2E. Then Phase 7 engineering review and Phase 8 release
readiness.

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
- Phase 2 lanes merged + integration committed (`d852b66`, `feat(integration)`): notes+tasks, calendar+bookmarks, settings (incl.
  wallpaper + JSON backup/import). All three diffs additive; typecheck green
  after each merge. Feature mini-apps wired into `AppContent`; registry now has
  the full V1 addable list (clock/search/notes/tasks/calendar/links/photo/
  embed); interim panel removed. PWA icon set generated (flame mark,
  192/512/maskable-512/apple-180/favicon). `npm run check` green:
  lint 0, typecheck 0, 12 files / 45 tests, build + PWA (15 precache entries).
- Phase 4 E2E committed (`f87e1e6`): Playwright config (msedge channel,
  desktop 1440×900 + mobile 390×844 projects, runs against `vite preview` so the
  PWA/SW is exercised), shared helpers, 8 spec files covering all 16 spec flows
  incl. reload-persistence and PWA manifest/offline. `e2e`/`test:e2e` scripts.
- Phase 5 committed (`d110b35`): responsive width-sweep spec
  (`e2e/responsive.spec.ts`) asserting no horizontal overflow and in-viewport
  chrome at 360/390/768/1024/1280/1440, plus platform-correct window vs sheet
  surfaces. Fixed a latent shell bug it caught: window traffic-light buttons
  could be swallowed by the titlebar drag/pointer-capture handler (buttons now
  exempt drag initiation). Screenshot sweep captured to `.shots/` (gitignored)
  for human visual review across 6 widths × 8 states.

## Lane worktrees
- `D:\web-dash-lanes\{notes-tasks,calendar-bookmarks,settings}` —
  branches `lane/*` now merged into `build/v1-one-shot`. Coordinator owns the
  integrated tree; no further writes on lane branches.

## Verification status
- lint: PASS (0) · typecheck: PASS · test: 45 PASS · build: PASS (+PWA)
- Playwright E2E (Phase 4): PASS — desktop 19/19, mobile 16/16 + 3 skips
  (drag-reorder #7, JSON import/export #16, and the responsive width sweep which
  runs once on desktop). PWA flows 14/15 pass on both projects.
- Responsive sweep (Phase 5): PASS — no horizontal overflow at any width/state;
  chrome inside viewport; window↔sheet surfaces follow the <1024px breakpoint.
- Screenshots: 48 frames (6 viewports × 8 states) in `.shots/`. NOTE: this
  build session's model has no image input, so pixel-level aesthetics were not
  judged by eye here — frames are saved for the human acceptance gate; layout
  integrity was verified by the automated DOM/geometry checks above.

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
- Desktop window traffic lights sit inside the titlebar drag handler; presses
  that start on a button are exempt from drag/pointer-capture so Close/Maximize
  clicks always land (WindowsHost).

## Next action
1. Phase 6 (in progress): await critique-workflow result; apply each
   adversarially-confirmed fix; re-run unit tests + `npm run check` + the full
   desktop/mobile Playwright suites; up to 3 critique rounds until dry.
2. Phase 7: engineering review — lint/typecheck/tests/build, code/security/
   simplification review, dead-code removal, secrets check, no V2/V3 surface.
3. Phase 8: release readiness — PWA manifest/SW verify, README, CHANGELOG, QA
   checklist finalize, final commit.
