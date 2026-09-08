# Hearth OS engineering contract

Hearth is a local-first Vite/React/TypeScript PWA, package version **1.2.0**. Home is the permanent viewport surface; the Dock opens Launchpad; desktop apps use bounded floating/snapped windows and narrow devices use sheets.

## Read first

1. `docs/CURRENT_STATE.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `DESIGN.md`
5. `docs/QA_CHECKLIST.md`
6. `docs/ROADMAP.md`
7. `design-references/README.md` for visual/reference work

Current code/tests outrank documentation when describing what is already implemented. Update docs when architecture/product behavior changes.

## Hard constraints

- No paid runtime dependencies/services required.
- Dexie/IndexedDB remains the only persistent store; no backend/auth/SSR/websockets/analytics/server DB without an explicit new product decision.
- No runtime AI.
- No secrets/personal data in the repository.
- Preserve backward-compatible data migrations/backup validation.
- Do not rebuild the application from visual references.
- The document, shell and Home remain viewport-bound; apps/embeds own bounded internal scrolling.
- Do not claim completion without fresh verification evidence.

## Architecture invariants

- UI/components -> features -> repositories -> Dexie.
- Components do not access DB tables directly.
- `src/state/ui.ts` is immediate presentation state; durable state stays in Dexie.
- Dexie v4 includes `windowStates`; window persistence runs through its repository.
- Shared geometry is used for seeded/add/migration/edit/backup placement and must remain collision-free/bounded.
- Shared design tokens/materials/glyphs remain centralized.

## Active visual direction

The shipped app uses centralized selective `@ybouane/liquidglass` WebGL refraction on the menu bar and Dock, cosine dock proximity motion, and CSS/solid fallbacks with Reduced Effects and performance limits. No Figma community artwork is shipped without explicit production-use licensing metadata.

## Commands

```sh
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run test:e2e
```

Use a fresh production build for Playwright. For visual/shell changes also inspect desktop and phone states manually.
