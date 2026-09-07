# Hearth OS current state

**Updated:** 2026-09-07  
**Canonical branch:** `build/v1-one-shot`  
**Package version:** `1.1.0`

## Implemented

- Permanent Home desktop with Launchpad overlay.
- Concurrent bounded desktop windows and safe-area mobile sheets.
- Dexie v4 window-state persistence with opt-in reload restoration.
- Collision-free, viewport-bounded desktop Home geometry and compact narrow layouts.
- Bounded internal scrolling for content-heavy widgets/apps/embeds.
- Notes, Tasks, Calendar, Links, Calculator, Settings and existing Home widgets.
- Shared glyph/material/token system plus configurable icon/dock/material/layout/contrast/motion settings.
- Local-first backup/restore, safe navigation and PWA/offline architecture.

## Latest implementation verification record

The v1.1 implementation workspace recorded:

- `npm run lint` — passed;
- `npm run typecheck` — passed;
- Vitest — **19 files / 130 tests passed**;
- `npm run build` — passed and generated the PWA service worker;
- `git diff --check` — passed;
- Playwright — **not run in that workspace** because its checkout/browser environment was incomplete.

This branch-consolidation operation is Git/repository-only and does not claim a fresh runtime-suite run.

## Active next visual refinement

Approved direction, **not yet implemented**:

- selective WebGL Liquid Glass using `ybouane/liquidglass` on high-value shell surfaces;
- CSS/solid fallbacks, Reduced Effects and device/performance gating;
- refined proximity-based dock animation based on the committed HTML study;
- reviewed/exported Figma app artwork where licensing permits;
- further widget/radius/typography/optical-spacing polish without regressing the current shell/layout architecture.

## Source of truth

1. Current code/tests for implemented behavior.
2. This file + `docs/PRODUCT_SPEC.md` + `docs/ARCHITECTURE.md` for current product/architecture.
3. `DESIGN.md` for current visual rules and approved next refinement.
4. `CHANGELOG.md` for history.
5. `design-references/` for non-runtime visual/motion source material.

There are intentionally no separate V2/build-state/one-shot planning ledgers anymore.
