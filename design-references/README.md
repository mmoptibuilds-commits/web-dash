# Design references

This directory contains **reference material only**. Nothing here is automatically a production asset, dependency, or source file for Hearth.

## Source roles

| Source | Role in V1.11 | Do not use it as |
| --- | --- | --- |
| Existing `web-dash` application | Functionality, data model, architecture, accessibility and test source of truth | Something to replace with a prototype |
| `assets/` in this directory | Local visual/UI-kit/reference material collected for design comparison | A directory to import wholesale into the shipped bundle |
| `macos-liquidglass-motion-reference.html` | Dock motion, widget proportions, material tuning and spatial-density reference | Production architecture, final icons, wallpaper source or exact hard-coded layout |
| Figma iOS App Icons, frame `401:3` | App-icon artwork reference/export source | System/control glyph set |
| `ybouane/liquidglass` | Preferred WebGL Liquid Glass implementation reference for selective V1.11 surfaces | A reason to apply WebGL to every card/widget |

## External references

- Figma app icons: `https://www.figma.com/design/KkioCa05PlAtIHUNT3xovg/iOS-App-icons-vector--Community-?node-id=401-3`
- LiquidGlass: `https://github.com/ybouane/liquidglass`

The LiquidGlass README describes the package as MIT-licensed. Before publicly shipping any Figma Community or Apple-origin reference artwork, verify the creator/source license for the specific asset being promoted into production.

## HTML reference rules

The HTML prototype is intentionally committed because it contains useful concrete behavior, especially the proximity-based dock magnification and restrained widget geometry. It also contains hand-drawn SVG approximations of familiar app icons, hard-coded desktop positions, a demo wallpaper and a direct CDN import. **Do not copy those pieces into the application as-is.**

Use it for:
- dock proximity/magnification behavior and motion feel;
- widget/card proportions and restrained radii;
- selective glass tuning ideas;
- overall density and spatial relationships.

Do not use it for:
- replacing the React/Dexie/Zustand application architecture;
- final app icon artwork;
- hard-coded production positioning;
- a production wallpaper;
- a blanket WebGL-on-everything strategy.

## Promoting a reference into runtime

1. Confirm the asset or library license is appropriate for the intended use.
2. Export/copy only the exact needed asset or implementation piece.
3. Give the runtime copy a stable, descriptive name outside `design-references/`.
4. Wire it through the existing component/token architecture.
5. Add visual, responsive, accessibility and performance verification.

Keeping this directory reference-only prevents future agents from accidentally bundling the entire research set.
