# Hearth OS design rules

## North star

Hearth is a personal desktop surface, not a scrolling website. Desktop should read as a coherent macOS-like environment and phone widths as an intentionally iOS-like home/workspace, while remaining Hearth rather than an Apple clone.

Home owns the viewport. Wallpaper, status bar, pages, windows, folders, Launchpad and dock are layered surfaces. Content-heavy apps, lists and embeds may scroll only inside their bounded bodies.

## Shipped v1.2 visual system

- system/SF-like font stack;
- 4/8px spacing rhythm;
- restrained 14–20px major surface radii and smaller control radii;
- hairline edges, shallow layered shadows and wallpaper-aware contrast;
- shared tokens in `src/styles/tokens.css`;
- CSS/DOM glass/material behavior and theme attributes through `src/app/theme.ts`, plus centralized selective WebGL shell glass;
- shared `Glyph` presentation layer for system/app symbols;
- Settings-driven icon family/shape/treatment, dock presentation, transparency, contrast and motion;
- Reduced Effects/reduced-motion paths.

Avoid oversized pills, random per-app gradients, nested SaaS cards, excessive blur, tiny low-contrast text and inconsistent spacing.

## Shell

The status bar is compact system chrome with `mmoptibuilds` identity and no duplicate launch controls. The Dock opens a high-contrast full-viewport Launchpad without replacing Home; Launchpad manages shared user shortcuts in place. The dock is a measured shelf with running indicators and configurable size/style/magnification.

Desktop windows use traffic lights, focus-based z-order, direct drag/resize and previewed half/corner/maximize snap/restore. Narrow devices use safe-area-aware sheets. Outer shell scrolling is forbidden; internal app scrolling is intentional.

Settings is the reference native-app layout: desktop windows use a compact searchable sidebar and bounded detail pane; container-sized narrow windows and phone sheets collapse to a single touch-friendly detail stack with explicit sheet Back navigation.

## Layout

Desktop Home uses persisted freeform geometry only where the canonical 1120px coordinate space fits inside configured and viewport bounds. Moves snap softly, show alignment guides and commit only collision-free positions. Resize respects per-kind minimums and all viewport edges. Other sizes use a compact responsive layout.

## Icons

App artwork and system/control glyphs are separate systems.

- Hearth-owned glyphs use one app-specific color field as their complete artwork; Dock/Launchpad do not add a second icon box.
- The approved Figma frame in `design-references/README.md` may supply reviewed/exported **app artwork** where licensing permits.
- Do not use the reference HTML's hand-drawn SVG app approximations when better reviewed artwork is available.
- Normalize optical size/alignment rather than forcing identical visual mass.

## Selective Liquid Glass

The v1.2 implementation adds selective WebGL refraction using the MIT-licensed `@ybouane/liquidglass` package and its documented 0..1 refraction scale.

Use three tiers:

1. **Full Liquid Glass** — the direct-child status bar and measured Dock inside one viewport-sized capture root, using one centralized lazy renderer and semantic per-role configuration.
2. **CSS glass** — windows, popovers, Control Center, ordinary widgets and other nested/secondary surfaces.
3. **Solid/reduced fallback** — Reduced Effects, unsupported WebGL, constrained devices or performance fallback.

Do not create one WebGL context per widget. Centralize the integration behind a material boundary and preserve existing CSS tokens/fallbacks.

Settings presets Off, Performance, Balanced, High and Custom map to persisted renderer behavior. Custom controls expose clamped blur, refraction and chromatic-edge parameters.

## Dock motion

Use the committed HTML reference as an interaction study. Its proximity/cosine falloff is a better starting point than disconnected per-icon hover zoom.

The shipped cosine falloff targets:
- restrained proximity magnification with neighbor response;
- bottom-anchored optical lift;
- smooth spring-like interpolation only if it remains performant;
- one animation-frame batch of icon geometry reads followed by style writes;
- stable labels/tooltips and click/tap feedback;
- preserved keyboard focus, edit/reorder behavior and narrow-phone fit;
- touch/coarse-pointer behavior that never depends on hover.

## Motion

Motion stays short, interruptible and purposeful. Reduced motion removes large transforms/springs. Reading content does not continuously animate.
