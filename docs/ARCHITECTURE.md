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

WindowsHost owns desktop frame behavior, focus/z-order, traffic lights, drag/resize/maximize and viewport clamping. Mobile sheets reuse the app-content resolver inside safe-area-aware bounded presentation.

## Persistence

Database name: `hearth`. Dexie schema v4 adds `windowStates` keyed by app ID. Window state stores only Hearth-owned geometry/lifecycle values. Repository functions own normalization/read/write/clear behavior.

Settings hold appearance/behavior preferences. Backup import/export includes supported persistent tables and accepts older rows through defaults/migrations; large wallpaper media blobs may be excluded.

## Home geometry

`src/data/layout/geometry.ts` is the shared pure geometry contract for seed/add/migration/edit/backup placement. It owns canonical boxes, canvas/height clamping, minimum sizes, snapping, guides, collision checks and nearest valid placement. Failed bounded placement leaves the prior valid box unchanged.

## Scrolling contract

The document, app shell and Home surface are viewport-bound. Mini-apps, lists and embeds own their internal scrolling. Cross-origin iframe document state is not observable/persistable by Hearth.

## Visual system

`src/styles/tokens.css` defines spacing, radii, surfaces, motion, safe areas and z-index. Shared CSS material behavior and `src/app/theme.ts` apply appearance attributes. `Glyph.tsx` is the shared symbol presentation layer.

Current runtime material is CSS/DOM based. If `ybouane/liquidglass` is adopted, add one centralized material adapter/boundary; do not scatter raw instances through widgets. Preserve CSS/solid fallbacks, Reduced Effects and device/performance gating. Do not create one WebGL context per surface.

## PWA/testing

`vite-plugin-pwa` builds the production service worker. Playwright targets a production build/preview. Runtime changes should pass lint, typecheck, Vitest, build and the desktop/mobile browser suite when the environment is available.
