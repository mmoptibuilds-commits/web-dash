# Hearth OS architecture

## Stack

Vite + React 19 + TypeScript, Dexie/IndexedDB persistence, Zustand for immediate UI state, CSS/CSS Modules with shared tokens/materials, dnd-kit for layout interaction, Vitest and Playwright, vite-plugin-pwa.

## Layers

```text
UI/components -> feature components -> repositories -> Dexie IndexedDB
```

Components do not access DB tables directly. Durable state belongs in Dexie; immediate presentation state belongs in Zustand.

## Shell composition

`App` mounts Backdrop, MenuBar, HomeMode, WindowsHost, MobileSheetHost, FolderView, AppLauncher, Dock and SearchOverlay. Home stays mounted while apps open above it. The legacy Dashboard identifier remains only where compatibility requires it; it is not the main workspace.

WindowsHost owns desktop frame behavior, focus/z-order, traffic lights, drag/resize, edge/corner snapping, floating-bound restoration and viewport clamping. Mobile sheets reuse the app-content resolver inside safe-area-aware bounded presentation.

Window content and mobile sheet bodies establish inline-size containers. Built-in apps, led by Settings' searchable desktop sidebar and narrow single-column detail stack, respond to their allocated surface rather than assuming viewport width. While a modal mobile sheet is open, the mounted desktop stage is inert and hidden from assistive technology.

## Persistence

Database name: `hearth`. Dexie schema v4 adds `windowStates` keyed by app ID. Window state stores only Hearth-owned geometry/lifecycle values. Repository functions own normalization/read/write/clear behavior.

Settings hold appearance/behavior preferences. Backup import/export includes supported persistent tables and accepts older rows through defaults/migrations; large wallpaper media blobs may be excluded.

## Home geometry

`src/data/layout/geometry.ts` is the shared pure geometry contract for seed/add/migration/edit/backup placement. It owns canonical boxes, canvas/height clamping, minimum sizes, snapping, guides, collision checks and nearest valid placement. Failed bounded placement leaves the prior valid box unchanged.

## Scrolling contract

The document, app shell and Home surface are viewport-bound. Mini-apps, lists and embeds own their internal scrolling. Cross-origin iframe document state is not observable/persistable by Hearth.

## Visual system

`src/styles/tokens.css` defines spacing, radii, surfaces, motion, safe areas and z-index. Shared CSS material behavior and `src/app/theme.ts` apply appearance attributes. `Glyph.tsx` is the shared symbol presentation layer.

`LiquidGlassManager` owns one lazy `@ybouane/liquidglass` instance for direct-root high-value shell surfaces. Pure policy/config functions select WebGL, CSS or solid tiers using settings, capabilities, memory and sampled FPS. Widgets do not create WebGL contexts.

## PWA/testing

`vite-plugin-pwa` builds the production service worker. Playwright targets a production build/preview and supports an explicit `PLAYWRIGHT_EXECUTABLE_PATH` for compatible system/headless Chromium installations. Runtime changes pass lint, typecheck, Vitest, build and the desktop/mobile browser suite.
