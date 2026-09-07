# V1.11 repository source-of-truth design

**Date:** 2026-09-07

## Goal

Prepare the existing `build/v1-one-shot` default branch for the V1.11 visual/UX overhaul without changing working application behavior. Future agents must be able to tell the difference between the shipped implementation, the V1 historical baseline, and the V1.11 target.

## Decisions

1. **Preserve the working app.** This change is documentation and reference hygiene only. No runtime source, package dependency, persistence schema, or test behavior changes in this pass.
2. **Make current state explicit.** Active agent instructions (`AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, README and architecture docs) describe the already-shipped V2-era freeform/mobile work and the V1.11 target. Historical V1 material remains historical rather than being silently rewritten.
3. **Use a source-precedence rule.** For implementation facts, code/tests and `docs/V2_STATUS.md` win. For V1.11 visual intent, `DESIGN.md` and `docs/V1_11_WORK_HANDOFF.md` win. `docs/PRODUCT_SPEC.md` and the one-shot prompt are baseline/history when they conflict with later approved work.
4. **Centralize design references.** Move the existing root `assets/` reference tree intact to `design-references/assets/`. Add the supplied HTML prototype beside it as `design-references/macos-liquidglass-motion-reference.html` and document exactly what may and may not be borrowed.
5. **Reference roles are separate.** The existing app is the functionality/architecture source of truth; the Figma frame is app-icon artwork reference; `ybouane/liquidglass` is the preferred WebGL material reference for a future selective implementation; the HTML is motion/shape/proportion reference only.
6. **V1.11 supersedes one old design restriction.** The previous blanket ban on WebGL/refraction is no longer an active design rule. V1.11 may use `ybouane/liquidglass` selectively on high-value shell surfaces, with CSS fallback, Reduced Effects, performance limits, and no assumption that WebGL is already implemented.
7. **Do not copy the HTML prototype wholesale.** Preserve current React/Dexie/Zustand architecture, freeform layout engine, responsive behavior, accessibility and tests. Do not use its hand-drawn app SVGs when better icon sources exist.
8. **Keep runtime assets separate.** `design-references/` is not production content and should not be imported into the shipped bundle unless an asset is deliberately reviewed, licensed, copied into a runtime asset location, and wired by a later implementation task.

## V1.11 visual direction

- Desktop should read as a polished macOS-like personal desktop rather than a website.
- Mobile should switch to an intentionally iOS-like interaction model rather than squeeze the desktop shell.
- The dashboard shell itself stays viewport-bound; scrollable mini-app/embed content scrolls inside bounded surfaces.
- Dock motion should use proximity-based magnification as a reference, then be refined into a restrained spring-like interaction with touch-safe fallback.
- Widget proportions and radii should remain varied and restrained, avoiding generic equal-sized SaaS cards and excessive pills.
- Liquid Glass is selective: dock, menu/status bar, Control Center, windows/sheets and important popovers first; ordinary content can retain cheaper CSS material.
- App icons and system-control glyphs are separate systems. App artwork may come from approved Figma assets; control glyphs remain a consistent system-icon family.

## Safety and performance

- Zero additional spend.
- No runtime AI, backend, auth, analytics or cloud dependency added by this pass.
- Preserve Reduced Effects and `prefers-reduced-motion` behavior.
- Do not create many WebGL contexts or mark large dynamic DOM regions for continuous capture.
- Add the LiquidGlass package only during the implementation task after integration and fallback tests are defined.

## Acceptance for this repo-prep pass

- Default branch contains a clear V1.11 handoff and source-precedence rule.
- Stale active docs no longer claim the current desktop layout is ordered-grid-only or that refraction is categorically forbidden.
- Historical V1 documents are clearly labeled as baseline/history where relevant.
- Existing reference assets live under `design-references/` with no content conversion.
- Supplied HTML reference is committed under `design-references/` with a README that prevents wholesale copying.
- Changelog/roadmap/QA/build-state documentation records that V1.11 implementation is pending; this pass does not falsely claim WebGL or icon replacement is shipped.
