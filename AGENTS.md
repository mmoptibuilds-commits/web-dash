# AGENTS.md — shared rules for coding agents on Hearth

## Read order and source precedence

Before writing code, read **CLAUDE.md**, **DESIGN.md**, **docs/CURRENT_STATE.md**, **docs/V1_11_WORK_HANDOFF.md**, **docs/ARCHITECTURE.md**, and the relevant newest entries in **docs/V2_STATUS.md**.

When documents conflict:

1. Current code and tests are the source of truth for implemented behavior.
2. `docs/CURRENT_STATE.md` / `docs/V2_STATUS.md` describe the shipped baseline.
3. `DESIGN.md` / `docs/V1_11_WORK_HANDOFF.md` define the approved V1.11 target.
4. `docs/PRODUCT_SPEC.md` and `Web-dashboard-One-Shot-Claude-Code-Prompt.md` are the historical frozen V1 baseline and must not undo later approved work.

## Non-negotiables

1. **No spend.** No paid APIs/SaaS/fonts/hosting requirements.
2. **Local-first.** Dexie/IndexedDB remains the persistent store; do not add backend/auth/SSR/websockets/analytics/server DB without a new explicit product decision.
3. **No runtime AI** in the product.
4. **No secrets or personal data** in the repository.
5. **Preserve working behavior.** V1.11 is an overhaul of the existing application, not permission to rewrite it from a reference prototype.
6. **One writer per file/worktree when parallelizing.** Shared contract files require coordination. The user may explicitly authorize direct work on the default branch; otherwise prefer isolated worktrees/branches.
7. **Do not fake completion.** Verify what you change and state what was not verified.

## Current implementation contract

- Desktop Home already uses freeform geometry/grid-lattice behavior; do not regress it to the original strict ordered-grid-only V1 model.
- Mobile remains intentionally different: compact/paged/touch-first presentation and full-screen sheets rather than tiny desktop windows.
- Mini-app content owns its scrolling inside bounded hosts. The outer desktop/mobile shell should remain viewport-bound.
- Persistent data flows through repositories into Dexie. Components do not create a second persistent store.
- Design tokens in `styles/tokens.css` remain the source for shared color, spacing, radius, type, motion, z-index and fallback material values.

## V1.11 design-reference contract

`design-references/` is reference-only unless a later task deliberately promotes a reviewed asset into runtime.

- Existing app = functionality/architecture source of truth.
- Figma frame `401:3` = app-icon artwork source/reference.
- `ybouane/liquidglass` = preferred selective WebGL material implementation reference.
- `design-references/macos-liquidglass-motion-reference.html` = dock motion/widget proportion/material reference only.

Do not copy the HTML's hand-drawn app SVGs, hard-coded positions, wallpaper or standalone architecture into production.

## Feature content contract

A feature directory `src/features/<name>/` normally exposes:

- `<Name>MiniApp` — fills its host and owns internal scrolling; no duplicate outer window chrome.
- `<Name>Widget` when applicable — typed widget registry component that fills its tile and uses shared tokens/material rules.
- Co-located unit tests for core behavior.

Respect current registry/types/repository ownership and inspect existing patterns before adding new seams.

## Verification

For runtime changes run, at minimum:

```sh
npm run check
npm run build
npx playwright test --project=desktop --project=mobile
```

Use a fresh production build for E2E. Also perform visual desktop/mobile inspection for visual work.

For documentation/reference-only changes, verify the Git tree, links/source precedence, and that no runtime source/package/lock/test files changed. Do not claim runtime tests were rerun when they were not.

## Handoff report

Report files changed, exact verification performed/results, known limitations, and any intentionally deferred work. Keep it factual.
