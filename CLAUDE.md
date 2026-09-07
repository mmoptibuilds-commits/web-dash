# CLAUDE.md — Hearth current engineering contract

**Hearth** is a local-first, installable personal web OS/start page: macOS-inspired on desktop and intentionally iOS-inspired on phone. The current codebase is beyond the original frozen V1 and includes the completed V2-era freeform/responsive/calculator/accessibility work recorded in `docs/V2_STATUS.md`.

## Source precedence

Read `AGENTS.md`, `DESIGN.md`, `docs/CURRENT_STATE.md`, `docs/V1_11_WORK_HANDOFF.md`, `docs/ARCHITECTURE.md`, and the newest relevant `docs/V2_STATUS.md` sections before changing behavior.

The root one-shot prompt and `docs/PRODUCT_SPEC.md` are historical V1 baseline documents. When they conflict with current code/tests or an approved V1.11 decision, they do not win.

## Hard constraints

- **No spend** — no paid APIs/SaaS/fonts/hosting dependency.
- **Local-first** — persistence remains Dexie/IndexedDB; no backend, auth, SSR, queues, websockets, analytics or server DB without a new explicit decision.
- **No runtime AI** in Hearth.
- **Public-repo safe** — never commit secrets, keys, credentials or personal data.
- **Preserve the working app** — V1.11 is not a ground-up rewrite.
- **No fake completion** — runtime changes require fresh build/test/browser/visual evidence.

## Commands

```sh
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
npm run test:e2e
```

Playwright exercises the production preview; rebuild before judging E2E behavior.

## Current architectural invariants

- UI → feature/components → repositories → Dexie. Components do not call the DB as an ad-hoc persistence path.
- Persistent state = Dexie. Ephemeral/shared UI state = Zustand. Derived values are derived rather than duplicated.
- Shared domain types and registries are contracts; inspect migration/backward-compatibility implications before edits.
- Desktop Home uses the current freeform geometry/lattice system. Mobile uses its intentional compact/paged model. Do not restore the obsolete strict ordered-grid-only rule.
- Mini-apps fill their host and own internal scrolling. The outer shell should stay viewport-bound.
- Shared visual primitives flow through `styles/tokens.css` and existing CSS/module patterns; do not bypass the system with unrelated styling islands.

## Current baseline to preserve

The completed overhaul includes freeform desktop layout/backfill, responsive mobile sheets, bounded embed/window content, Calculator mini-app/widget with offline currency rates, Reduced Effects, accessibility/performance coverage, PWA/offline verification and reference-led visual polish. See `docs/CURRENT_STATE.md` and `docs/V2_STATUS.md` for evidence.

## V1.11 material rule

The previous blanket rule **"never WebGL/refraction"** is superseded for V1.11.

V1.11 may integrate `ybouane/liquidglass` **selectively**, behind a central material boundary with CSS/solid fallback, Reduced Effects, unsupported-WebGL behavior and performance safeguards. Do not create one WebGL instance per widget or mark broad dynamic DOM as continuously recaptured. The package is not currently a dependency; do not claim WebGL Liquid Glass is implemented until it actually is.

## Reference safety

- `design-references/` is non-runtime research/reference material.
- Use the supplied Figma frame for reviewed app-icon exports where licensing permits.
- Use the HTML prototype for motion/proportion/material ideas only. Do not copy its hand-drawn app SVGs, hard-coded layout, demo wallpaper or architecture into Hearth.

## Pitfalls

- Verify current code before trusting old docs or old commit-specific prompts.
- PWA tests must run against a fresh production build.
- Reduced Effects and `prefers-reduced-motion` are accessibility behavior, not optional polish.
- Changes to geometry, backup/import, Dexie schema, dock behavior or responsive hosts can have migration/E2E consequences; add discriminating tests for actual behavioral changes.
