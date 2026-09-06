# Changelog

All notable Hearth releases are recorded here.

## [1.1.0] — Hearth OS visual and structural overhaul

### Changed

- Home is now the permanent desktop surface. Apps opens a Launchpad overlay instead of navigating to a Dashboard page.
- Desktop app windows remain visible together, retain focus/z-order, and expose traffic-light close, minimize, maximize, and resize controls.
- Narrow screens use safe-area-aware app sheets while Home remains mounted underneath.
- Status bar and dock proportions were tightened; random app gradients and oversized capsule styling were removed.
- A shared glyph presentation layer now supports system, monochrome, and tinted families with squircle, rounded, circle, or plain containers and flat, material, or contrast treatments.
- Settings now controls appearance profile, icon presentation, dock behavior, Home density/canvas limits, transparency, contrast, motion, window restoration, and embed chrome.
- Window records use Dexie schema v4. Geometry is stored through a repository and reload restoration is opt-in.
- Home placement is bounded and collision-free. Moves resolve to the nearest valid slot, while resize is limited by the usable viewport and per-kind minimums.
- The Links widget keeps all links reachable in an internal scroll region after resize.
- Embed widgets separate host controls from external content, wrap their toolbar at narrow widths, and expose browser fullscreen when permitted.
- The shell, document, and Home surface remain viewport-locked; content-heavy app bodies own their own scroll.

### Documentation

- README, DESIGN, product spec, architecture, roadmap, QA checklist, build state, and V2 status now describe Hearth OS v1.1.
- The earlier visual-system record is marked superseded by the approved Hearth OS overhaul design.

### Compatibility

- Existing Home pages, shortcuts, folders, widgets, wallpapers, notes, tasks, dock items, and settings remain readable.
- Older settings and backup rows receive defaults for new fields.
- No Apple or Figma community asset is copied into the product. No new WebGL or GSAP dependency is required.

## [1.0.0] — Initial release

The initial release shipped Hearth as a local-first PWA with Home pages, Dashboard mini-apps, widgets, wallpapers, settings, backups, and offline app-shell support.
