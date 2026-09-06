# Hearth OS design rules

## Product surface

Hearth is a personal desktop surface, not a scrolling web page. Home owns the viewport. Wallpaper, status bar, Home pages, windows, folders, Launchpad, and dock are layered surfaces; content-heavy apps may scroll inside their own bounded body.

## Visual language

Use the platform's system font stack, an 8px spacing rhythm, modest 14–20px surface corners, small control radii, fine borders, and a shallow layered shadow hierarchy. Icons use one optical box and a restrained neutral/accent treatment. Random per-app gradients, oversized pills, nested dashboard cards, and decorative blur on every element are not part of the system.

Materials use CSS/DOM only:

- a wallpaper layer with adjustable dimming;
- surface fill alpha controlled by the Transparency setting;
- blur/saturation from the Glass preset;
- border plus inset highlight;
- solid or high-contrast fallbacks;
- reduced-effects and reduced-transparency modes.

The shared variables live in src/styles/tokens.css, materials in src/styles/glass.css, and application of theme/material attributes in src/app/theme.ts.

## Shell

The status bar is a compact system bar with Hearth, Apps, current app context, Home editing, Search, Control Center, and clock. Apps opens an accessible Launchpad overlay.

The dock is a measured shelf with running indicators. Fine pointers may lift icons slightly; coarse pointers do not depend on hover. Dock size, shelf/glass style, magnification, and indicators are settings.

Desktop windows use traffic lights, a centered title, focus-based z-order, direct drag/resize, maximize/restore, and a visible minimum titlebar. Mobile sheets use safe-area padding, a grab handle, and pull-to-dismiss.

## Icons

SystemGlyph is the shared Hearth-owned app symbol surface. Settings choose:

- family: System, Mono, Tinted;
- shape: Squircle, Rounded, Circle, Plain;
- treatment: Material, Flat, Contrast;
- size and labels.

Shortcuts still support favicons, uploads, emoji, and monograms. The Figma community links supplied for this release are references only; no Apple or Figma asset is copied.

## Layout and motion

Home's desktop canvas is capped at a configurable width and bounded by the status bar and dock. Every item has a per-kind minimum. Freeform moves use soft snapping and alignment guides but commit only non-overlapping positions. Resize is bounded on every edge. Narrow layouts use a compact grid with internal widget list scrolling where needed.

Motion is short and interruptible: 160–240ms overlays, 220–320ms windows/sheets, and a small dock lift. Reading content does not animate. Reduced motion removes large transforms and spring effects. The v1.1 implementation uses CSS transitions; GSAP is not a required dependency.
