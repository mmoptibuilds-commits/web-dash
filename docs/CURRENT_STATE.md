# Hearth OS current state

**Updated:** 2026-09-08
**Canonical branch:** `build/v1-one-shot`
**Package version:** `1.2.0`

## Implemented

- Permanent Home desktop with a full-viewport Apps + shared user Links Launchpad, including in-place shortcut CRUD.
- Concurrent bounded desktop windows, persisted previewed half/corner/maximize snapping and safe-area mobile sheets.
- Dexie v4 window-state persistence with opt-in reload restoration.
- Collision-free, viewport-bounded desktop Home geometry with responsive fallback whenever the canonical canvas cannot fit, eliminating right-edge folding.
- Bounded internal scrolling for content-heavy widgets/apps/embeds.
- Notes, Tasks, Calendar, Links, Calculator, Settings and existing Home widgets.
- Compact `mmoptibuilds` status bar, focus-safe Control Center and Edit-Mode-safe customizable folders.
- Shared single-surface app artwork/glyph/material/token system, semantic material roles, a viewport-sized single-context selective Liquid Glass capture root with CSS/solid fallbacks, and animation-frame-batched cosine dock motion.
- Local-first backup/restore, safe navigation and PWA/offline architecture.

## Latest implementation verification record

The v1.2 implementation workspace recorded:

- `npm run lint` — passed;
- `npm run typecheck` — passed;
- Vitest — **27 files / 149 tests passed**;
- `npm run build` — passed and generated the PWA service worker;
- Playwright — the expanded **118-case** suite parses successfully; a fresh production build completed, but this final workspace could not execute it because no browser binary was installed and the Chromium download endpoint timed out. The preceding v1.2 candidate run recorded **114 discovered / 87 passed / 27 intentionally skipped / 0 failed** before the final WebGL-root, resize-collision, snap-resize and Launchpad-contrast corrections;
- responsive sweep — zero horizontal overflow at 320, 360, 375, 390, 393, 430, 768, 834, 1024, 1280, 1366, 1440 and 1920px;
- scripted performance journeys — zero console errors, page errors and ResizeObserver-loop warnings, including a 4× CPU-throttled phone proxy;
- `npm run check` — passed;
- `git diff --check` — passed;
- visual QA — the available desktop/phone light/dark plus Settings, Control Center and Launchpad captures were compared side by side with references 04–06 and the rendered motion study; their review drove a final Launchpad title/action-contrast correction. A fresh recapture after that correction was blocked by the same missing-browser limitation. References 01–03 are truncated in the source Git blob and are not decodable.

The v1.2 material refinement is implemented. The referenced Figma community sheet was reviewed but not exported because its production-use license could not be established.

## Source of truth

1. Current code/tests for implemented behavior.
2. This file + `docs/PRODUCT_SPEC.md` + `docs/ARCHITECTURE.md` for current product/architecture.
3. `DESIGN.md` for current visual and material rules.
4. `CHANGELOG.md` for history.
5. `design-references/` for non-runtime visual/motion source material.

There are intentionally no separate V2/build-state/one-shot planning ledgers anymore.
