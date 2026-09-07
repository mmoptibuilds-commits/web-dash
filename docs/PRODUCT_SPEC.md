# PRODUCT_SPEC — Hearth V1 historical baseline

> **Status notice (2026-09-07):** This document preserves the original frozen V1 product contract. It is no longer the sole authority for the current codebase. Later approved/shipped work is recorded in `docs/V2_STATUS.md` and `docs/CURRENT_STATE.md`; the active V1.11 visual target is `DESIGN.md` + `docs/V1_11_WORK_HANDOFF.md`. When this historical baseline conflicts with current code/tests or those later approved documents, the later/current source wins.

## Approved deltas since frozen V1

The shipped application now includes work that the original V1 either made optional or deferred, including desktop freeform geometry with migration/backfill, broader responsive/mobile behavior, Calculator + offline editable currency rates (Dexie schema v3), accessibility/performance hardening and extensive visual polish.

For V1.11, the original blanket deferral of WebGL/refraction is **superseded**: selective `ybouane/liquidglass` integration is allowed when implemented behind fallbacks/performance safeguards. This notice does not claim that integration is already shipped.

## Historical product contract

A personal web dashboard / start page / lightweight personal web OS:
- local-first PWA, no account/backend, $0 spend;
- Home launcher with pages, shortcuts, folders, dock, widgets, wallpapers and Edit Mode;
- Dashboard productivity with Notes, Tasks, Calendar and Links;
- desktop floating-window behavior and deliberately adapted mobile sheets;
- safe same-tab URL/search behavior, local history only;
- versioned local persistence/backup and PWA/offline shell.

## Historical V1 platform behavior

- Desktop: menu bar, dock, windows with open/focus/drag/close/maximize and stable z/focus.
- Tablet: adaptive presentation, not tiny windows.
- Mobile: touch-first paged Home, dock, widgets and full-screen/sheet mini-apps; no hover-only functionality.

## Historical V1 Home/Edit scope

The V1 baseline specified an ordered snap grid, pages, shortcut/folder management, configurable dock and preset widget sizes. Later shipped work intentionally evolved desktop layout into freeform geometry while retaining stable persisted entities and mobile adaptation.

## Historical mini-app/widget scope

Notes, Tasks, Calendar month view, Links/bookmarks, search/clock/date, photo/embed and related built-in widgets. Later Calculator work is recorded in `docs/V2_STATUS.md` rather than retroactively pretending it was part of the original frozen V1.

## Historical wallpaper/settings/PWA scope

- gradient plus local image/animated/video wallpapers with validation/fallbacks;
- Simple/Advanced settings backed by real behavior;
- versioned JSON backup/import with validation;
- installable PWA with safe update/offline shell behavior;
- Reduced Effects/reduced-motion support.

## Historical V2/V3 deferrals

The original document deferred auth/sync/cloud backup, richer notes, calendar events/reminders, notification center, custom API widgets, advanced window behavior, browser extension work, weather/native apps/plugin marketplace and other public/cloud features. Those remain later work unless a newer roadmap explicitly moves them.

**Exception now approved:** optical/refraction glass is no longer categorically V3-only; V1.11 may implement it selectively as described above.

## Acceptance principle retained

Do not claim completion from compilation alone. Functional, responsive, persistence, accessibility, reduced-motion/effects, PWA/offline, visual and engineering gates all need evidence appropriate to the change.

For current acceptance criteria use `docs/QA_CHECKLIST.md` and `docs/V1_11_WORK_HANDOFF.md`.
