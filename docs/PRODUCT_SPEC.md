# Hearth OS product specification

## Release

Current package version: **1.1.0**.

Hearth is a local-first installable PWA that behaves like a personal desktop/home screen. It has no account, backend, analytics, ads or runtime AI.

## Workspace

Home is the permanent workspace. It owns wallpaper, pages, shortcuts, folders, widgets, status bar, Launchpad, dock and open windows. Opening an app never replaces Home or hides other open windows. Apps opens Launchpad as an overlay.

Desktop apps open as floating windows with traffic lights, focus/z-order, minimize/restore, maximize and resize. Narrow screens use safe-area-aware iOS-style sheets.

The document, shell and Home do not scroll. App bodies, widget lists and embedded documents may scroll only inside bounded regions.

## Home layout

Home pages remain horizontally paged. Desktop items use persisted freeform geometry inside hard canvas width/usable-height bounds. Moves use soft snapping/alignment guidance and commit only collision-free boxes. Resize respects per-kind minimums and all viewport edges. Narrow layouts use a compact responsive arrangement.

## Apps and widgets

Built-in apps include Notes, Tasks, Calendar, Links, Calculator and Settings. The existing typed widget registry includes Clock, Search, Notes, Tasks, Calendar, Links, Photo, Calculator and Embed.

Links keeps content reachable using internal scrolling at small sizes. Embed uses safe HTTP(S) validation, sandboxing, separate Hearth-owned controls, Open-in-tab and browser-permitted fullscreen. Cross-origin iframe internals remain browser-owned.

## Appearance

Settings persist theme/material/glass preferences, transparency, wallpaper dimming, icon family/shape/treatment/size, labels, dock style/size/magnification/indicators, Home density/canvas/snap behavior, window restoration, embed controls, reduced transparency/effects and contrast.

Current runtime materials are CSS/DOM based. Selective WebGL Liquid Glass is an approved future refinement, not a current release claim.

## Persistence and safety

IndexedDB through Dexie is the only persistent store. Schema v4 includes `windowStates`. Window geometry/Hearth-owned lifecycle state may persist; reload restoration is opt-in.

Backups validate settings, layout, app IDs, geometry, URLs and window rows before replacing data. Wallpaper blobs may remain excluded. External navigation is restricted to safe HTTP(S) addresses.

## Product constraints

- $0 additional runtime spend requirement.
- No backend/auth/sync/analytics/runtime AI in the current release.
- No arbitrary iframe rewriting or cross-origin state control.
- No unreviewed/copyright-unclear Apple/Figma artwork shipped as product assets.
- Visual references may guide implementation but do not replace the existing architecture.
