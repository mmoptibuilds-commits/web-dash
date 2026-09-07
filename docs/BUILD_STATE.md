# BUILD STATE — Hearth

**Last updated:** 2026-09-07  
**Default branch:** `build/v1-one-shot`

## Current phase

The original V1 and the subsequent V2-era overhaul are complete. The repository is now prepared for the **V1.11 visual/UX overhaul**.

The detailed historical implementation ledger remains in `docs/V2_STATUS.md`; this file intentionally stays short and current.

## Latest recorded runtime baseline

From the newest completed visual-polish ledger entry:

- `npm run check` — lint + typecheck + **126/126 Vitest tests** + PWA build: PASS.
- `npm run test:e2e` — **81 passed / 23 skipped / 0 failed** desktop+mobile production E2E.

These results predate the 2026-09-07 documentation/reference reorganization. That reorganization changes no runtime source or dependency and therefore does not claim a fresh runtime suite execution.

## 2026-09-07 V1.11 repository preparation

Completed/targeted in this docs-only prep:
- established explicit source precedence so stale V1 documents cannot override current code/later approved work;
- added a current-state index and V1.11 Work/Codex/Claude handoff;
- changed the active visual rule from blanket "no WebGL" to **selective V1.11 LiquidGlass allowed**, without falsely claiming it is already implemented;
- moved reference-only root assets under `design-references/assets/` intact;
- committed the supplied macOS/LiquidGlass HTML prototype as a clearly labeled motion/shape/material reference;
- documented the Figma app-icon and LiquidGlass reference roles;
- updated README/architecture/product-spec/roadmap/QA/changelog/agent guidance around the current baseline and V1.11.

## Runtime state that must be preserved

- local-first Dexie/IndexedDB persistence and repository boundary;
- current desktop freeform geometry and import/backfill behavior;
- mobile paged/sheet behavior and bounded content scrolling;
- Notes/Tasks/Calendar/Links/Calculator behavior;
- dock/folder/edit-mode functionality;
- Reduced Effects/reduced motion, accessibility/performance/PWA coverage;
- existing responsive and offline behavior.

## V1.11 implementation pending

Not implemented by this repo-prep pass:
- `@ybouane/liquidglass` runtime dependency/integration;
- central GlassEngine/material renderer;
- live glass presets/custom controls;
- final dock spring/proximity production implementation;
- Figma app-icon extraction/runtime mapping;
- full V1.11 visual/structural polish and its regression suite.

Use `docs/V1_11_WORK_HANDOFF.md` for the implementation task and do not rebuild the app from the HTML reference.
