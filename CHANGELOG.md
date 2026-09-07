# Changelog

All notable changes to **Hearth** are recorded here. See [`README.md`](README.md), [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md), and [`docs/ROADMAP.md`](docs/ROADMAP.md).

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/). Until the first tagged release the log lives under `[Unreleased]`.

## [Unreleased]

### Changed — V1.11 repository preparation (2026-09-07)
- Established an explicit source-of-truth hierarchy: current code/tests and `docs/V2_STATUS.md` define implemented behavior; `DESIGN.md` + `docs/V1_11_WORK_HANDOFF.md` define the approved V1.11 visual target; the frozen V1 product spec/one-shot prompt are historical baseline documents.
- Added `docs/CURRENT_STATE.md` and a dedicated V1.11 Work/Codex/Claude handoff so future agents preserve the existing application rather than rebuilding from references.
- Superseded the old blanket "no WebGL/refraction" active design restriction. V1.11 may use `ybouane/liquidglass` selectively with CSS/solid fallbacks, Reduced Effects and performance safeguards. **No WebGL runtime implementation is claimed by this docs-only change.**
- Moved the reference-only root `assets/` tree intact to `design-references/assets/` and added `design-references/README.md`.
- Added the supplied `design-references/macos-liquidglass-motion-reference.html` for dock-motion, widget-proportion and material study, with explicit rules against copying its hand-drawn icons/hard-coded architecture wholesale.
- Documented the Figma app-icon frame `401:3` as the app-artwork reference and kept system/control glyphs as a separate visual system.
- Updated README, architecture, roadmap, build state, QA, active agent instructions and legacy handoff pointer for the current freeform/mobile/calculator-era codebase.
- Latest recorded pre-prep runtime baseline remains `npm run check` with **126/126 Vitest tests** and `npm run test:e2e` with **81 passed / 23 skipped / 0 failed**; this docs/reference-only change does not claim a fresh runtime-suite run.

### Fixed — V2 overhaul (work-in-progress)
- **Edit-Mode "Add to dock" popover was inert.** `.dock` is `pointer-events: none` (so the full-width fixed strip never blocks the page) and only `.bar` opted back in with `auto`; the Edit-Mode add popover (`.addPop`) inherited `none`, so every candidate row was painted but not clickable — clicks fell through to the Home page beneath and the outside-close handler dismissed the popover ("UI appears but nothing inside is clickable; clicking dismisses the screen"). Fixed by giving `.addPop` `pointer-events: auto`. Regression: `e2e/dock-edit.spec.ts` (fails pre-fix, passes post-fix, desktop + mobile).
- Dock launcher counting in the new spec is CSS-scoped to the real `<button aria-label="Open …">` elements because dnd-kit gives each tile's wrapper div a `role="button"` in Edit Mode whose accessible name duplicates the launcher's (an accessibility issue tracked for the a11y sweep).

### Added — v1.0.0 (initial build)

**Shell & modes**
- Installable PWA (Vite + vite-plugin-pwa): app shell, auto-update service worker, offline support after first load, manifest with icon set (`public/`), no in-app install button.
- macOS-inspired Home launcher with horizontally paged, snap-scrolling pages; prev/next + dot indicators; tappable page title opening the Pages manager.
- Dashboard mode: Notes / Tasks / Calendar / Links mini-apps as floating windows on desktop and full-height sheets on mobile.
- Menubar (app menu, mode switcher, search, clock, control center), dock with badge counts and context menus, empty-state + first-run guidance.

**Home Mode**
- Ordered snap grid (`LayoutItem.order`), span-by-size tiles, edit mode with drag-to-rearrange, per-tile resize, remove-with-confirm. This records the original V1 behavior; later freeform desktop geometry is documented in `docs/V2_STATUS.md` and `docs/CURRENT_STATE.md`.
- Shortcuts (label + URL + icon, record-and-open navigation), folders with cascade delete and full-screen folder view, multiple pages.
- Widgets (typed registry over stable `WidgetInstance` rows): search, notes, tasks, calendar, clock/date, links, photo, and an embed widget with a clear fallback when a site blocks framing.
- Design tokens + CSS modules only (no Tailwind); light/dark/system theme with touch-target enlargements and reduced-motion support.

**Dashboard mini-apps**
- Notes: autosave, pin, search, delete. Tasks: add/complete/clear, filters. Calendar: month view. Links: grid over the shared shortcut store.
- Data lives in a shared store — bookmarking from the browser app and the Links mini-app write the same rows.

**Search / omnibox**
- Type a URL to navigate same-tab, or a query to search Google / Bing / DuckDuckGo (configurable). Suggestions come only from local history.

**Wallpapers & appearance**
- Gradient presets plus uploaded image / animated / video backgrounds with size checking, video pause-when-hidden, and reduced-motion handling.
- Simple and Advanced Settings levels; appearance, wallpaper, search engine, grid/label/icon options, reduced effects.

**Backup**
- Versioned JSON export/import for normal (non-blob) tables; import validation; large media blobs excluded from exports by design.

### Fixed
- Page-activation races in the Home pager (instant jump vs. smooth scroll; `onScrollSync` guard while a new page id has not yet materialized).
- Dot-indicator hit-area overlap that could make a tap on a page dot land on the neighboring page's pill.
- Window close action swallowing events in the Dashboard shell.

### Engineering
- Repositories layer (`data/repositories`) is the only data-access path; no component touches `db.` directly.
- Domain types in `types/domain.ts` as the frozen, versioned contract.
- Ephemeral UI state in a single Zustand store; persistent state in Dexie.
- 45 unit/component tests (Vitest + Testing Library), 35 E2E scenarios across desktop (1440×900) and mobile (390×844) Playwright projects covering all 16 original spec flows, including reload persistence and offline app-shell behavior. Later test counts are preserved in `docs/V2_STATUS.md`.
- `npm run check` (lint + typecheck + tests + build) was green for the original release gate.

### Documentation
- PRODUCT_SPEC (frozen V1 contract), ARCHITECTURE, ROADMAP (V2/V3 deferrals), QA_CHECKLIST, BUILD_STATE, plus repo-root README and DESIGN.
- Repo-root one-shot build spec + AGENTS.md parallel-work ownership rules.
