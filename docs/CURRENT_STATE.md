# Hearth OS current state

**Updated:** 2026-09-08
**Canonical branch:** `build/v1-one-shot`
**Package version:** `1.2.0`

## Implemented

- Permanent Home desktop with a full-viewport Apps + user Links Launchpad.
- Concurrent bounded desktop windows, persisted half/corner/maximize snapping and safe-area mobile sheets.
- Dexie v4 window-state persistence with opt-in reload restoration.
- Collision-free, viewport-bounded desktop Home geometry with responsive fallback whenever the canonical canvas cannot fit, eliminating right-edge folding.
- Bounded internal scrolling for content-heavy widgets/apps/embeds.
- Notes, Tasks, Calendar, Links, Calculator, Settings and existing Home widgets.
- Compact `mmoptibuilds` status bar, focus-safe Control Center and Edit-Mode-safe customizable folders.
- Shared glyph/material/token system, single-context selective Liquid Glass with CSS/solid fallbacks, and restrained cosine dock motion.
- Local-first backup/restore, safe navigation and PWA/offline architecture.

## Latest implementation verification record

The v1.2 implementation workspace recorded:

- `npm run lint` — passed;
- `npm run typecheck` — passed;
- Vitest — **26 files / 143 tests passed**;
- `npm run build` — passed and generated the PWA service worker;
- Playwright — **106 discovered / 82 passed / 24 intentionally skipped / 0 failed** against a fresh production build;
- responsive sweep — zero horizontal overflow at 320, 360, 375, 390, 393, 430, 768, 834, 1024, 1280, 1366, 1440 and 1920px;
- scripted performance journey — zero console errors, page errors and ResizeObserver-loop warnings;
- `npm run check` — passed;
- `git diff --check` — passed;
- visual QA — desktop/phone light/dark plus Settings, Control Center and Launchpad captures compared side by side with references 04–06 and the rendered motion study. References 01–03 are truncated in the source Git blob and are not decodable.

The v1.2 material refinement is implemented. The referenced Figma community sheet was reviewed but not exported because its production-use license could not be established.

## Source of truth

1. Current code/tests for implemented behavior.
2. This file + `docs/PRODUCT_SPEC.md` + `docs/ARCHITECTURE.md` for current product/architecture.
3. `DESIGN.md` for current visual and material rules.
4. `CHANGELOG.md` for history.
5. `design-references/` for non-runtime visual/motion source material.

There are intentionally no separate V2/build-state/one-shot planning ledgers anymore.
