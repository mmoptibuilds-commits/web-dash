# BUILD_STATE — Hearth V1 one-shot build

**Last updated:** 2026-09-05 · **Branch:** `build/v1-one-shot`
**Session goal:** complete + verify the full V1 per the authoritative one-shot
spec (`Web-dashboard-One-Shot-Claude-Code-Prompt.md`).

## Current phase — COMPLETE

Phases 0→8 are done: scaffold → features → integration → functional E2E →
responsive/visual QA → harsh critique loop → engineering review → release
readiness. Final gate green: `npm run check` (lint 0, typecheck 0, **50/50
vitest**, build + PWA) and full Playwright **35 passed / 3 intentional skips**
(desktop 19/19, mobile 16/16).

## Completed milestones (git)
- Phase 0/1 committed (`2c28da0`, `ab1b76b`): docs/contracts, Vite 8 + React 19
  + TS ~5.9.3 pin, tokens/global/glass/motion CSS, frozen domain/widget/app
  types, Dexie v1 (11 tables) + repositories + barrel + seed, ui store, theme,
  url/search/nav/run libs, widget registry, PWA config, test scaffold.
- Phase 1 shell committed (`488128b`): `main`/`App` boot, Home launcher (paged
  strip, ordered grid, tiles, edit mode + dialogs, folder overlay), Dashboard
  (floating windows / mobile sheets), shell chrome (menubar, dock, backdrop),
  search overlay, CSS modules.
- Phase 2 lanes merged (`d852b66`): notes+tasks, calendar+bookmarks, settings
  (wallpaper + JSON backup/import); full V1 widget list; PWA icons. First
  `npm run check` green: 45 tests.
- Phase 4 E2E committed (`f87e1e6`): Playwright (msedge channel, desktop
  1440×900 + mobile 390×844, against `vite preview` so PWA/SW exercised), 8
  specs covering the spec flows incl. reload persistence + PWA/offline.
- Phase 5 committed (`d110b35`): responsive width sweep (360→1440, no overflow,
  chrome in-viewport), window↔sheet breakpoint, screenshot sweep to `.shots/`.
- Phase 6 committed (`a2e362d`): harsh critique loop (four independent critics
  → adversarial verify → fix confirmed defects). Round 1 fixes: widget footers
  sheet-aware (launch mini-app), tasks clear-completed + empty copy, pages/
  history cascade + dedupe, copy + mono + settings toggles, danger-red token
  sweep, dock configuration in Edit Mode (+ E2E selectors for radio ModeSwitch),
  Home add-page activation + dot hit-area overlap.

## Phase 7 — engineering review (read-only reviewers + coordinator)
Three independent reviewers (code/correctness, security, simplification) each
verified before any change was applied.

- **Correctness**
  - ShortcutDialog stale-edit overwrite: the dialog persists above `Modal`, so a
    second edit showed the previous draft and Save could clobber the wrong
    shortcut. Now fields re-seed on the open transition, reading the latest
    `initial` via an effect-synced ref (never written during render — a live
    dexie refetch while typing can't wipe in-progress edits).
  - Duplicate-create on Enter auto-repeat (folders / shortcuts / widget picker):
    guarded with in-flight `busy` state on submit buttons + handlers.
- **Security**
  - Backup import validated **zero** row content: a crafted `shortcuts.url`
    could store `javascript:` that later ran same-origin, and a malformed
    `dockItems.appId` could brick the Dock at render. Added per-table row
    validators for all 10 tables (settings enums + wallpaper shape; shortcuts
    http(s)-only + `data:image/` uploads; history url null-or-safe; dock appId
    in the frozen builtin set), run before the import transaction.
  - `sameTab()` now gates on `isSafeUrl` (defense-in-depth closing the
    `javascript:` sink for shortcuts/history/bookmarks/backups).
  - 5 new unit tests cover the hostile-import rejections + a genuine round-trip.
- **Simplification / dead code** (each symbol verified unreferenced in src+e2e)
  - Removed orphaned `data/repositories/crud.ts` and 25+ dead repo helpers
    (`getShortcut`, `getNote`, `getPage`, `getWidgetInstance`, `getWallpaper`,
    `hasAnyData`, `setFolderIcon/Bg`, `reorderFolderShortcuts`,
    `moveItemAcrossPages`, `pruneHistory`/`clearHistory`, …).
  - Removed dead config `DashboardPanelPref` + `settings.dashboardPanels`
    (no consumer) from the frozen type + defaults seed + backup validator +
    test; removed `defaultHomePage`, `allBuiltinIds`, `wallpaperName`,
    `isLikelyUrl`, `DroppedTile`, `useIsTablet`, `isWidgetType`.
  - Removed dead CSS: `glass-e2/-raise/-plain`, `scrim-veil`, `hairline-top`;
    global `.t-*` text scale, `.btn-lg`, `.field-row`, `.app-tile`,
    `.hairline-b`; `.anim-slide-down` + `slide-down` keyframe; embed empty/bar
    states; tasks-widget done compound; home `.dropped`.
  - Wired two latent visual gaps the "dead CSS" audit exposed: the clock widget
    root now establishes a `@container` so the date reveal actually fires on
    wide tiles, and the notes pin pressed state is styled
    (`.iconBtn[aria-pressed='true']`) instead of a dead `.pinBtn` selector.

## Phase 8 — release readiness
- README (run/build/install/PWA/test, incl. the E2E-vs-preview rebuild note)
  and CHANGELOG written; QA_CHECKLIST finalized with per-item evidence and an
  explicit human-acceptance remainder; PRODUCT_SPEC / ARCHITECTURE / ROADMAP
  reviewed against the implementation.
- Final gates re-run after all Phase 7 edits (build then Playwright per the
  E2E-requires-rebuild note).

## Verification status
- lint: PASS (0) · typecheck: PASS · unit test: **50 PASS** (12 files) ·
  build: PASS (+ PWA, 15 precache entries).
- Playwright E2E (final, after Phase 7 fixes): **35 PASS / 3 skip** — desktop
  19/19; mobile 16/16. Skips are by design: drag-reorder is desktop-only,
  the width sweep runs once on the desktop project, JSON import/export is
  desktop-only.
- Screenshots: 48 frames (6 viewports × 8 states) in `.shots/` (gitignored).
  NOTE: this build session's model has no image input, so pixel-level aesthetics
  were not judged by eye here — frames are saved for the human acceptance gate;
  layout integrity was machine-verified.

## Known integration notes
- Dexie schema indexes added to v1 (unreleased): `layoutItems.refId`,
  `tasks.done`, `dockItems.appId/shortcutId`.
- Restored backups may contain `{kind:'user'}` wallpaper refs whose media is
  excluded from export; backdrop falls back to the builtin gradient if the
  referenced wallpaper row is absent.
- Version string lives in Settings (`1.0.0`, mirrors package.json).
- E2E: `SearchOverlay` resolves `defaultSearchEngine` one render after mount;
  tests wait on the engine hint. On phone widths the menu-bar tabs are hidden —
  mobile switches via the brand (Home) and the dock "Dashboard" launcher. Fresh
  IndexedDB per test seeds via `ensureBootData`.
- Desktop window traffic lights sit inside the titlebar drag handler; presses
  starting on a button are exempt from drag/pointer-capture (WindowsHost).

## Blocker / handoff items
- **No git remote** is configured for this repo, so `git push` / a PR could not
  run from here. Work is committed on `build/v1-one-shot` locally.
- `.claude/` (skill tooling incl. a 14.5 MB `impeccable.exe`) is intentionally
  tracked from the seed; a maintainer should decide whether that binary belongs
  in a public repo before pushing. Secrets check: none present.
- Human acceptance: eyeball `.shots/` and the two new visual states listed in
  QA_CHECKLIST.
