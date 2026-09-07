# Design references

This directory contains **reference-only** material for Hearth OS. Nothing here is runtime code unless a later implementation task deliberately exports/reviews an asset into a production location.

## Source roles

### `assets/`
Contains the existing macOS/iOS UI-kit exports, screenshots and icon-template material that previously lived in the repository root `assets/` directory. The tree was moved here intact to keep reference material separate from runtime assets.

Use it to study proportion, spacing, hierarchy, platform patterns and visual density. Do not assume every included asset is licensed for redistribution in the product.

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

This is the preferred reference for the next selective WebGL/refraction material pass. It is **not currently vendored or installed** in Hearth. If adopted, wrap it behind a central material boundary with CSS/solid fallbacks, Reduced Effects handling, WebGL/context limits and performance testing.

## Rule of precedence

The existing React application is always the source of truth for functionality. References inform visual/motion implementation; they never replace working architecture.
