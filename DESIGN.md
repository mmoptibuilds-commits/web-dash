# Hearth OS design rules

## North star

Hearth is a personal desktop surface, not a scrolling website. Desktop should read as a coherent macOS-like environment and phone widths as an intentionally iOS-like home/workspace, while remaining Hearth rather than an Apple clone.

Home owns the viewport. Wallpaper, status bar, pages, windows, folders, Launchpad and dock are layered surfaces. Content-heavy apps, lists and embeds may scroll only inside their bounded bodies.

## Shipped v1.1 visual system

- system/SF-like font stack;
- 4/8px spacing rhythm;
- restrained 14–20px major surface radii and smaller control radii;
- hairline edges, shallow layered shadows and wallpaper-aware contrast;
- shared tokens in `src/styles/tokens.css`;
- CSS/DOM glass/material behavior and theme attributes through `src/app/theme.ts`;
- shared `Glyph` presentation layer for system/app symbols;
- Settings-driven icon family/shape/treatment, dock presentation, transparency, contrast and motion;
- Reduced Effects/reduced-motion paths.

Avoid oversized pills, random per-app gradients, nested SaaS cards, excessive blur, tiny low-contrast text and inconsistent spacing.

## Shell

The status bar is compact system chrome. Apps opens Launchpad without replacing Home. The dock is a measured shelf with running indicators and configurable size/style/magnification.

Desktop windows use traffic lights, focus-based z-order, direct drag/resize and maximize/restore. Narrow devices use safe-area-aware sheets. Outer shell scrolling is forbidden; internal app scrolling is intentional.

## Layout

Desktop Home uses persisted freeform geometry inside hard width/height bounds. Moves snap softly, show alignment guides and commit only collision-free positions. Resize respects per-kind minimums and all viewport edges. Narrow layouts use a compact responsive layout.

## Icons

App artwork and system/control glyphs are separate systems.

- Existing Hearth glyphs remain the safe runtime baseline.
- The approved Figma frame in `design-references/README.md` may supply reviewed/exported **app artwork** where licensing permits.
- Do not use the reference HTML's hand-drawn SVG app approximations when better reviewed artwork is available.
- Normalize optical size/alignment rather than forcing identical visual mass.

## Active material refinement — selective Liquid Glass

The current v1.1 implementation uses CSS materials. The next visual pass may add **selective WebGL refraction** using `ybouane/liquidglass`; this is approved direction, not a shipped claim.

Use three tiers:

1. **Full Liquid Glass** — high-value shell surfaces only: dock, status/menu bar, Control Center, important popovers and selected windows/sheets where performance remains stable.
2. **CSS glass** — ordinary widgets and secondary surfaces.
3. **Solid/reduced fallback** — Reduced Effects, unsupported WebGL, constrained devices or performance fallback.

Do not create one WebGL context per widget. Centralize the integration behind a material boundary and preserve existing CSS tokens/fallbacks.

If Settings exposes Liquid Glass controls, every control must map to real renderer behavior and persistence. Reasonable presets: Off, Performance, Balanced, High, Custom. Custom controls may cover only safely clamped parameters actually supported by the integration.

## Dock motion refinement

Use the committed HTML reference as an interaction study. Its proximity/cosine falloff is a better starting point than disconnected per-icon hover zoom.

Target:
- restrained proximity magnification with neighbor response;
- bottom-anchored optical lift;
- smooth spring-like interpolation only if it remains performant;
- stable labels/tooltips and click/tap feedback;
- preserved keyboard focus, edit/reorder behavior and narrow-phone fit;
- touch/coarse-pointer behavior that never depends on hover.

## Motion

Motion stays short, interruptible and purposeful. Reduced motion removes large transforms/springs. Reading content does not continuously animate.
