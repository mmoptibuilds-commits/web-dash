# CURRENT STATE — Hearth

**Updated:** 2026-09-07  
**Default branch:** `build/v1-one-shot`

This file is the short current-state index. The detailed historical implementation ledger remains in [`V2_STATUS.md`](V2_STATUS.md).

## Shipped baseline

Hearth is a local-first Vite/React/TypeScript PWA with Dexie/IndexedDB persistence and Zustand UI state. The completed overhaul already includes:

- macOS-inspired desktop and deliberately iOS-inspired mobile shells;
- desktop freeform Home geometry with grid/lattice behavior and migration/backfill for older V1 layouts;
- compact mobile Home presentation, mobile full-screen sheets, and bounded mini-app/embed content;
- configurable dock, folders, wallpapers, Settings, search/URL navigation and PWA/offline behavior;
- Notes, Tasks, Calendar, Links and Calculator mini-apps/widgets;
- Dexie schema evolution through v3, including the offline editable currency-rate store;
- Reduced Effects/reduced-motion handling, accessibility/performance E2E coverage and reference-led visual polish.

## Latest recorded green baseline

The latest completed visual-polish ledger entry records:

- `npm run check`: lint + typecheck + **126/126 Vitest tests** + PWA build passed.
- `npm run test:e2e`: **81 passed / 23 skipped / 0 failed** against the production build.

Those are the latest recorded runtime results. The 2026-09-07 repository-preparation change is documentation/reference-only and does **not** claim to have rerun the application test suite.

## Active next milestone — V1.11 visual/UX overhaul

V1.11 is **not yet implemented** by this repository-prep pass. Its approved direction is:

- stronger macOS-like desktop / iOS-like mobile visual language without turning the app into a generic website;
- viewport-bound shell (no page-level dashboard scrolling), with scrolling contained inside mini-apps/embeds where needed;
- selective WebGL Liquid Glass using `ybouane/liquidglass` on high-value shell surfaces, with CSS/solid fallbacks and performance safeguards;
- dock proximity magnification refined into restrained spring-like motion plus touch-safe behavior;
- app-icon replacement from reviewed/exported Figma assets, while system/control glyphs stay a separate consistent icon family;
- restrained, varied widget geometry, tighter hierarchy, optical spacing and fewer oversized pills;
- live glass settings/presets only when backed by real behavior and persistence.

Read [`../DESIGN.md`](../DESIGN.md) and [`V1_11_WORK_HANDOFF.md`](V1_11_WORK_HANDOFF.md) before implementing V1.11.

## Source precedence

When documents disagree:

1. **Current implementation facts:** source code + tests, then `V2_STATUS.md` / this file.
2. **Current V1.11 visual intent:** `DESIGN.md` + `V1_11_WORK_HANDOFF.md`.
3. **Architecture rules:** `CLAUDE.md`, `AGENTS.md`, `ARCHITECTURE.md` unless contradicted by newer code/tests.
4. **Historical baseline:** `PRODUCT_SPEC.md` and `Web-dashboard-One-Shot-Claude-Code-Prompt.md` describe the original frozen V1 and are not allowed to undo later approved work.
