# Changelog

All notable changes to **Hearth** are recorded here. Hearth is a local-first,
installable PWA personal dashboard / start page (web-dashboard V1). See
[`README.md`](README.md) to run it and [`docs/ROADMAP.md`](docs/ROADMAP.md) for
what is deliberately deferred.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and
this project adheres to [Semantic Versioning](https://semver.org/). Until the
first tagged release the log lives under `[Unreleased]`.

## [Unreleased]

### Added — v1.0.0 (initial build)

**Shell & modes**
- Installable PWA (Vite + vite-plugin-pwa): app shell, auto-update service
  worker, offline support after first load, manifest with icon set
  (`public/`), no in-app install button.
- macOS-inspired Home launcher with horizontally paged, snap-scrolling pages;
  prev/next + dot indicators; tappable page title opening the Pages manager.
- Dashboard mode: Notes / Tasks / Calendar / Links mini-apps as floating
  windows on desktop and full-height sheets on mobile.
- Menubar (app menu, mode switcher, search, clock, control center), dock with
  badge counts and context menus, empty-state + first-run guidance.

**Home Mode**
- Ordered snap grid (`LayoutItem.order`), span-by-size tiles, edit mode with
  drag-to-rearrange, per-tile resize, remove-with-confirm.
- Shortcuts (label + URL + icon, record-and-open navigation), folders with
  cascade delete and full-screen folder view, multiple pages.
- Widgets (typed registry over stable `WidgetInstance` rows): search, notes,
  tasks, calendar, clock/date, links, photo, and an embed widget with a clear
  fallback when a site blocks framing.
- Design tokens + CSS modules only (no Tailwind); light/dark/system theme with
  touch-target enlargements and reduced-motion support.

**Dashboard mini-apps**
- Notes: autosave, pin, search, delete. Tasks: add/complete/clear, filters.
  Calendar: month view. Links: grid over the shared shortcut store.
- Data lives in a shared store — bookmarking from the browser app and the Links
  mini-app write the same rows.

**Search / omnibox**
- Type a URL to navigate same-tab, or a query to search Google / Bing /
  DuckDuckGo (configurable). Suggestions come only from local history.

**Wallpapers & appearance**
- Gradient presets plus uploaded image / animated / video backgrounds with
  size checking, video pause-when-hidden, and reduced-motion handling.
- Simple and Advanced Settings levels; appearance, wallpaper, search engine,
  grid/label/icon options, reduced effects.

**Backup**
- Versioned JSON export/import for normal (non-blob) tables; import validation;
  large media blobs excluded from exports by design.

### Fixed
- Page-activation races in the Home pager (instant jump vs. smooth scroll;
  `onScrollSync` guard while a new page id has not yet materialized).
- Dot-indicator hit-area overlap that could make a tap on a page dot land on
  the neighboring page's pill.
- Window close action swallowing events in the Dashboard shell.

### Engineering
- Repositories layer (`data/repositories`) is the only data-access path; no
  component touches `db.` directly.
- Domain types in `types/domain.ts` as the frozen, versioned contract.
- Ephemeral UI state in a single Zustand store; persistent state in Dexie.
- 45 unit/component tests (Vitest + Testing Library), 35 E2E scenarios across
  desktop (1440×900) and mobile (390×844) Playwright projects covering all 16
  spec flows, including reload persistence and offline app-shell behavior.
- `npm run check` (lint + typecheck + tests + build) is green.

### Documentation
- PRODUCT_SPEC (frozen V1 contract), ARCHITECTURE, ROADMAP (V2/V3 deferrals),
  QA_CHECKLIST, BUILD_STATE, plus repo-root README and DESIGN.
- Repo-root one-shot build spec + AGENTS.md parallel-work ownership rules.
