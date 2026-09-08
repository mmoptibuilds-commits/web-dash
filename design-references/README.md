# Design references

This directory contains **reference-only** material for Hearth OS. Nothing here is runtime code unless a later implementation task deliberately exports/reviews an asset into a production location.

## Source roles

### `assets/`
Contains the existing macOS/iOS UI-kit exports, screenshots and icon-template material that previously lived in the repository root `assets/` directory. The tree was moved here intact to keep reference material separate from runtime assets.

Use it to study proportion, spacing, hierarchy, platform patterns and visual density. Do not assume every included asset is licensed for redistribution in the product.

### `v1.2/`
Contains the six visual references extracted from the user-supplied v1.2 requirements PDF, plus a small reference map. Use these for side-by-side implementation and visual QA of the status bar, Control Center, desktop composition and responsive Settings experience. They are reference-only and are intentionally stored separately from runtime assets.

### `macos-liquidglass-motion-reference.html`
Standalone visual/interaction reference supplied for the overhaul.

Use it for:
- proximity-based dock magnification;
- widget proportions and shape language;
- spatial density;
- glass/material tuning ideas.

Do **not** use it as the application architecture. Do not copy its hand-drawn app SVGs, hard-coded desktop positions, wallpaper implementation or demo data into production.

### Figma app-icon reference
`https://www.figma.com/design/KkioCa05PlAtIHUNT3xovg/iOS-App-icons-vector--Community-?node-id=401-3`

Use reviewed/exported app artwork only where licensing permits. App artwork and system/control glyphs are separate systems. Production should store only the exact app icons actually used by Hearth rather than importing the complete collection.

### Liquid Glass implementation reference
`https://github.com/ybouane/liquidglass`

This is the implementation reference for the shipped selective WebGL/refraction material pass. Hearth installs the package from npm and wraps it behind a central material boundary with CSS/solid fallbacks, Reduced Effects handling, a single-context limit and performance testing; this reference directory does not vendor the upstream source.

## Rule of precedence

The existing React application is always the source of truth for functionality. References inform visual/motion implementation; they never replace working architecture.
