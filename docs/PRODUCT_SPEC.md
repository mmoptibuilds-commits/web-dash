# Hearth OS product specification

## Release

Hearth OS v1.1.0 is a local-first installable PWA that behaves like a personal desktop or phone home screen. It has no account, backend, analytics, or runtime AI.

## Workspace

Home is the permanent workspace. It owns the wallpaper, pages, shortcuts, folders, widgets, status bar, Launchpad, dock, and open windows. Opening an app never replaces Home or hides other open windows. Apps opens as a Launchpad overlay. The legacy Dashboard identifier is retained only as the persisted Apps dock item for compatibility.

Desktop apps open as floating windows with traffic lights, focus/z-order, minimize/restore, maximize, and resize. Narrow screens use full-height iOS-style sheets. The document, shell, and Home do not scroll; app bodies and embedded documents may scroll inside bounded regions.

## Home layout

Home pages remain horizontally paged. Desktop items use persisted freeform geometry inside a hard maximum canvas width and measured usable height. Moves snap softly, show alignment guides, and commit only collision-free boxes. Resize respects per-kind minimums and all four viewport edges. Narrow layouts use a compact responsive grid; list widgets own their internal scroll.

## Apps and widgets

Built-in apps include Notes, Tasks, Calendar, Links, Calculator, and Settings. Widgets include Clock, Search, Notes, Tasks, Calendar, Links, Photo, Calculator, and Embed. Links renders all saved links in an internally scrollable list when its tile is small. Embed keeps a sandbox, safe URL validation, a separate host toolbar, open-in-new-tab action, and browser-permitted fullscreen. Hearth cannot control the internal scroll position of a cross-origin iframe.

## Appearance

Settings cover theme, glass preset, transparency, wallpaper dimming, icon family/shape/treatment/size, labels, dock style/size/magnification/indicators, Home density/canvas/snap, window restore, embed toolbar/fullscreen, reduced transparency, reduced effects, and contrast.

## Persistence and safety

IndexedDB is the only persistent store. Dexie schema v4 adds windowStates. Window geometry and Hearth-owned lifecycle state persist; reload restoration is off by default. Backups validate settings, layout, app ids, geometry, URLs, and new window rows before replacing data. Wallpaper blobs remain excluded.

External URLs are restricted to safe HTTP(S) addresses. Embedded pages remain sandboxed and cannot access the top-level application.

## Out of scope

Sync, authentication, analytics, a plugin marketplace, arbitrary iframe rewriting, copied Apple/Figma assets, and shader/refraction dependencies remain deferred.
