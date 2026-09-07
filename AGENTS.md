# Hearth OS agent/contributor rules

Read `CLAUDE.md`, `docs/CURRENT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCT_SPEC.md`, `DESIGN.md` and the relevant reference README before changing code.

## Rules

1. Preserve the existing v1.1 application; references are not replacement architecture.
2. Keep persistence behind repositories/Dexie and preserve migrations/backups.
3. Use the shared Home geometry contract for every placement path; committed boxes must remain bounded and collision-free.
4. Keep the outer document/shell/Home viewport-locked; scrolling belongs inside bounded app/widget/embed content.
5. Use shared tokens/materials/glyphs rather than one-off visual systems.
6. App artwork and system/control glyphs are separate. Do not copy reference HTML icons or unreviewed Figma assets into runtime.
7. Selective WebGL Liquid Glass is approved only behind a central material boundary with CSS/solid fallbacks and performance/Reduced Effects handling.
8. No secrets, paid runtime services, backend/auth/analytics or runtime AI without an explicit product decision.
9. When parallelizing, use one writer per file/worktree and coordinate shared contracts.
10. Verify before handoff; report exactly what was and was not run.

## Runtime verification

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

For shell/material/responsive changes, also inspect major desktop/mobile states, overflow, keyboard/touch behavior and console errors.
