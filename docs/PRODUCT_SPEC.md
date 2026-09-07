# PRODUCT_SPEC — Hearth V1 (frozen historical baseline)

> **Status notice (2026-09-07):** This file preserves the original frozen V1 scope. It is no longer the sole authority for the current codebase. Current implementation facts come from code/tests plus `docs/CURRENT_STATE.md` / `docs/V2_STATUS.md`; the active V1.11 visual target is `DESIGN.md` + `docs/V1_11_WORK_HANDOFF.md`. When this historical baseline conflicts with those later approved sources, the later/current source wins.
>
> Approved later deltas include desktop freeform geometry/migration, Calculator + offline editable currency rates (Dexie v3), broader responsive/accessibility/performance work, and the V1.11 decision that selective WebGL/refraction via `ybouane/liquidglass` is allowed behind fallbacks/performance safeguards. That decision does **not** mean LiquidGlass is already implemented.

This file freezes the approved original V1 scope. The historical source is `Web-dashboard-One-Shot-Claude-Code-Prompt.md` (repo root). The body below is retained so the original contract remains auditable.

## Product
A personal web dashboard / start page / lightweight personal web OS:
- **Local-first PWA**, no account, no backend, $0 spend.
- Two modes sharing one data store (Dexie/IndexedDB):
  - **Home Mode** — horizontally paged launcher: pages, shortcuts, folders, dock, widgets, wallpapers, Edit Mode.
  - **Dashboard Mode** — denser productivity: Notes, Tasks, Calendar, Links mini-apps. Desktop = floating mini-windows; mobile = full-screen sheets.

## Platform behavior
- Desktop: menu bar, dock, windows (open/focus/drag/close/maximize; simple resize only if cheap), sane z/focus.
- Tablet: adaptive, no tiny windows.
- Mobile: touch-first, swipe pages, sheets, safe-area aware, no hover-only.

## Home Mode
- Starter layout on first run (seed data: Google/YouTube/GitHub/Gmail/Wikipedia, search + clock widgets, Dev folder with MDN/SO, default dock).
- Multiple pages (page indicators, swipe on mobile, prev/next + keyboard on desktop), add/rename/reorder/delete page (delete confirmed; never <1 page), per-page layouts; dock persistent.
- Ordered snap grid for items; Edit Mode (dedicated button → move/resize via presets/edit/remove shortcuts, create/open folders, manage pages, Done).
- Shortcuts: label+URL+icon (auto favicon / upload / monogram fallback), optional bg color, size + label prefs. Same-tab open, robust URL normalization, reject javascript:/etc. Built-in mini-app shortcuts open inside the dashboard UI. Never force external sites into iframes.
- Folders: iOS-style; create/rename/add-remove/reorder/open-close motion.
- Dock: base items configurable, reorder in Edit Mode, responsive.

> **Historical note:** the ordered-grid bullet above records the original V1 contract. The shipped desktop implementation later evolved to freeform geometry; do not use this historical line to revert current behavior.

## Dashboard Mode
Notes (multi, title/body/create/edit/delete/pin/timestamps/autosave/search, plain keyboard editing, no rich-text), Tasks (simple checklist: add/text/check/edit/delete/persist), Calendar (month view, today highlight, prev/next, responsive; events deferred V2), Links/Bookmarks (a manager over the shared shortcut data — no duplicate DB). Core widgets also available on Home.

## Widgets (Home)
Built-ins V1: clock/date, search, notes, tasks, calendar, bookmarks/shortcuts, photo/image, simple embed. Typed registry, stable ids, page assoc, order, size preset (small/medium/large), settings payload. Embed: user URL, clear blocked-frame fallback + open-in-tab, never weaken site security. Custom API/data widgets V2; arbitrary JS widgets V3-or-never.

## Search / omnibox
No Spotlight/AI. URL-looking input normalizes + navigates same-tab; else engine search same-tab (Google/Bing/DuckDuckGo). Suggestions only from local dashboard history (queries/URLs/recent+frequent launches).

## Wallpapers (desktop + mobile)
Gradient presets (built-in) + uploaded image/video/animated. Limits: image ≤15MB, animated ≤20MB, video ≤50MB. Validate type/size before storing; store blobs in IndexedDB (never precache). Video muted + playsInline, pauses when hidden; Reduced-effects/reduced-motion respected; graceful playback fallback.

## Settings
Two levels: Simple (appearance, wallpaper, search engine, edit/layout basics, reduced effects, basic data) and Advanced (only real V1 behaviors). Backup: JSON export/import with schema/version validation + confirmation (reasonable; media blobs may be excluded if that keeps it clean).

## PWA
Valid manifest (name/icons/colors/standalone), SW via vite-plugin-pwa, offline app shell after first load, safe auto-update (no stale trap), no fake install button.

## Original V2/V3 deferrals
V2: auth, sync, cloud backup, richer notes/Markdown, calendar events/reminders, notification center, custom API widgets, advanced window snap/resize, richer glass motion, non-Apple visual preset, extension, deeper CC, Smart Folders. V3: weather, native APK, refraction shaders, widget/plugin marketplace, arbitrary-code widgets, multi-user/community, themes/SEO. See `docs/ROADMAP.md`.

> **Supersession note:** refraction/shader glass is no longer categorically V3-only. V1.11 may implement it selectively under the active design/handoff constraints. Other deferrals remain governed by the current roadmap.

## Acceptance gates (evidence required)
Functional: launches clean, starter layout, Home works, Dashboard works, desktop + mobile shells, multiple pages, Edit Mode, shortcuts, folders, dock, search/URL behavior, Notes CRUD+autosave+persist, Tasks CRUD+persist, Calendar month nav, widgets render+persist settings/layout, image + video + gradient wallpaper, Settings persist, PWA prod build, offline shell, JSON import/export.
Quality: no console errors, no horizontal overflow at breakpoints, no keyboard traps, usable touch targets, reduced-motion works, glass readable over varied wallpapers, mobile designed not scaled. Engineering: lint/typecheck/tests/build pass, no secrets, no paid dep, no backend, no duplicated data architecture. Docs: README/ARCHITECTURE/ROADMAP/QA_CHECKLIST/CHANGELOG.

For current V1.11 acceptance criteria, use `docs/QA_CHECKLIST.md` and `docs/V1_11_WORK_HANDOFF.md`.
