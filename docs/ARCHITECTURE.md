# Hearth OS architecture

## Layers

UI components -> feature components -> repository functions -> Dexie IndexedDB.

The shell owns viewport chrome, window frames, focus, z-order, bounds, Launchpad, dock, status bar, and mobile sheet presentation. Feature mini-apps own their internal layout and bounded scrolling. Components do not access db tables directly.

## Shell composition

App mounts Backdrop, MenuBar, HomeMode, WindowsHost, MobileSheetHost, FolderView, AppLauncher, Dock, and SearchOverlay. Home stays mounted in every app state. DashboardMode remains as a compatibility export for the mobile sheet host; it is not a rendered page.

WindowsHost iterates visible focus order, uses traffic-light controls and a resize handle, and clamps restored/live geometry between status bar and dock. MobileSheetHost uses the same AppContent resolver in a safe-area-aware sheet.

## Persistence

Dexie database name is hearth. Schema v4 adds windowStates keyed by appId. settings holds all appearance and behavior preferences. windowStates stores only Hearth-owned geometry/lifecycle values; it never stores arbitrary iframe internals. windowStates.ts is the repository boundary for read/write/clear/normalization. ui.ts is the immediate Zustand presentation store and hydrates saved windows only when restoreWindowsOnReload is enabled.

Backup export/import includes windowStates and accepts older settings rows through default merging. Wallpapers stay out of JSON backups because their blobs may be large.

## Home geometry

geometry.ts is pure and shared by seeded placement, add-item placement, migration, editing, and backup backfill. It defines canonical boxes, hard width/height clamping, min sizes, snapping, alignment guides, collision checks, and nearest valid placement. A failed bounded placement leaves the prior box unchanged.

## Visual system

Tokens in src/styles/tokens.css define spacing, radii, surfaces, materials, motion, safe areas, and z-index. Glyph.tsx provides SystemGlyph and shortcut glyphs. theme.ts applies theme/material/icon/layout data attributes. CSS modules own component layout. No WebGL, new UI framework, copied Figma vectors, or required GSAP runtime is used.
