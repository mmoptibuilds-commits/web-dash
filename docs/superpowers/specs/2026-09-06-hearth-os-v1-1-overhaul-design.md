# Hearth OS — v1.1 Visual and Structural Overhaul

## Status

Approved direction for implementation on \`feat/v1.1-hearth-os-overhaul\`.

This document supersedes the earlier macOS/iOS visual-system proposal for this release. The earlier proposal was CSS-first and preserved the separate Dashboard mode. v1.1 changes the workspace model as well as the visual system.

## Release identity

- Product: Hearth
- Release: v1.1.0
- Release label: Hearth OS — Visual and Structural Overhaul
- Target branch: \`feat/v1.1-hearth-os-overhaul\`
- Baseline: \`build/v1-one-shot\` at \`01cf91b49eaca9fa7491bfb2a121b55db6616726\`

The public experience should feel like a personal computer or phone home screen. It must not behave like a scrolling SaaS dashboard or a marketing website.

## Product model

### Desktop

Home is the desktop. It is always the base surface: wallpaper, icons, folders, widgets, status bar, and dock.

Built-in apps open as floating windows directly over Home. Opening one app never removes the other Home icons or already-open windows. Windows keep normal desktop relationships:

- frontmost window receives focus and the highest z-order;
- background windows remain visible and usable;
- closing removes a window;
- minimizing hides it from the stage but keeps its dock indicator;
- clicking a running dock item restores and focuses its window;
- maximizing fits the usable viewport between the status bar and dock;
- moving and resizing are clamped to the usable viewport.

The current visible Dashboard page and its two-mode switch are removed from the primary navigation. The existing Dashboard app entry becomes an Apps/Launchpad surface that opens over Home and provides the complete built-in app inventory.

### Phone and narrow tablet

The same Home surface remains the base surface. Built-in apps open as full-height iOS-style sheets or bounded native-looking panels depending on available width. A narrow device must not receive a squeezed desktop window.

The mobile sheet owns its internal scrolling and safe-area behavior. The document, shell, and Home surface do not scroll as a website.

### Compatibility

Existing stored Home pages, shortcuts, folders, widgets, notes, tasks, calendar state, bookmarks, wallpaper references, dock pins, and settings remain readable. Existing Dashboard-mode UI state is treated as transient and is not restored as a separate page.

## Visual direction

The visual target is high-fidelity macOS/iOS-inspired interaction and proportion, with original Hearth identity.

Use:

- system UI typography and platform-aware sizing;
- restrained translucency on the status bar, windows, dock, sheets, folders, menus, and dialogs;
- fine borders and inset highlights;
- shallow, layered shadows only where depth needs to be understood;
- smaller, more precisely aligned symbols;
- tighter 8px spacing rhythm;
- modest corners for windows and surfaces;
- squircle or platform-shaped icon containers;
- intentional negative space and a balanced desktop grid.

Avoid:

- random per-app rainbow gradients;
- oversized pill containers;
- card-within-card dashboard nesting;
- decorative blur on every element;
- page-level scrollbars;
- generic SaaS headings and empty-state language;
- animation on content that users are reading;
- copying Apple proprietary icons, fonts, wallpapers, or brand marks.

The supplied Figma community files are visual references only:

- iOS icon reference: https://www.figma.com/design/KkioCa05PlAtIHUNT3xovg/iOS-App-icons-vector--Community-?node-id=0-1&t=pgadwmAFQposbZbz-1
- macOS system icon reference: https://www.figma.com/design/ActSLGZKRLg9X7opUkVNF9/%F0%9F%96%A5%EF%B8%8F-Oll-MacOS-System-icons-set--Community-?node-id=1-149&t=6BpR2SxSvGiU3iq-1

No Figma asset is copied into the shipped product. App icons are rendered from a local Hearth icon abstraction using the installed icon source and CSS treatment options.

## Information architecture

### Status bar

The desktop status bar behaves like a system menu bar:

- left side: Hearth/app menu and a compact workspace control;
- center/left context: current surface or active app title when useful;
- right side: search, connectivity/utility controls, Control Center, clock/date;
- menus and popovers are anchored to their triggers and dismiss with Escape or outside click;
- controls are compact but preserve touch-sized hit areas on narrow screens.

On narrow screens, the same information becomes an iOS-like top bar with safe-area padding and only the highest-value actions.

### Apps and Launchpad

The top-level Apps control opens a Launchpad-style overlay on Home. It shows all built-in apps without navigating away from Home. Selecting an app opens it in the appropriate window/sheet.

Home icons, folders, widgets, and windows are separate layers. App launch must never replace the desktop layer.

### Dock

The dock is a restrained system launcher, not a large floating capsule:

- optical sizing with a configurable base size;
- modest magnification on fine pointers, disabled on touch;
- active/running indicators below icons;
- separator between built-in apps and user shortcuts when needed;
- edit mode exposes reorder, remove, and add affordances without covering the desktop;
- narrow widths use measured fit and safe horizontal padding;
- the dock never creates horizontal page overflow.

## Home canvas and widget layout

### Viewport contract

The root app, shell, status bar, dock, Home canvas, and Launchpad remain inside the viewport:

- use \`100dvh\` with safe-area variables;
- reserve explicit status-bar, dock, and bottom-inset space;
- set \`overflow: hidden\` at the document and shell layers;
- do not create a page-level vertical scrollbar;
- cap usable canvas width at a hard maximum of 1120px;
- clamp tiles to the usable left, right, top, and bottom edges;
- adapt the usable height when the viewport, dock, or status bar changes.

Embedded pages, app lists, Settings, Notes, Links, and other content-heavy app bodies may scroll only inside their own bounded surfaces.

### Desktop placement

Desktop Home remains freeform, but collision-free:

- items may be moved freely with soft 8px magnetic snapping;
- alignment guides appear during a move;
- a committed item may not overlap another item;
- a move that would overlap resolves to the nearest valid position within the canvas;
- unrelated items do not auto-reflow;
- resize uses a corner handle and keyboard support;
- minimum size is defined per item kind;
- maximum width and height are bounded by the usable canvas;
- z-order changes only when an item is selected or moved;
- current drag/resize remains performant and does not update React state unnecessarily per frame.

When there is no valid space, the operation is rejected with the item left at its previous valid geometry. The UI must never silently place two widgets on top of each other.

### Narrow layout

At phone and narrow-tablet widths:

- Home uses a platform-aware compact grid that never overflows horizontally;
- widget spans are recalculated from available columns;
- long labels truncate or wrap intentionally;
- widgets that contain lists use their own bounded internal scroll;
- touch targets remain at least 44px where controls are interactive;
- the page itself remains fixed to the viewport.

## Widgets

Every widget fills its assigned tile and reads its container size, not the viewport.

Required fixes:

- Links widget: display all rows that fit; if more rows exist, scroll inside the widget instead of clipping the list with \`overflow: hidden\`.
- Widget headers and toolbars must shrink or wrap without pushing content outside the tile.
- Empty states must remain visible at minimum supported sizes.
- Widget min/max dimensions are defined in one layout contract and reused by placement, resizing, and rendering.
- Container queries handle compact widths; they do not hide actionable content.
- Widget content cannot escape its tile or overlap a neighboring tile.

## Windows and app state

Add a persisted window-state store in Dexie. The record is keyed by built-in app id and includes:

- last valid x/y position;
- width/height;
- maximized state;
- minimized state;
- last opened timestamp or focus order where useful;
- app-specific surface state only when that state belongs to Hearth.

A reload-restoration setting controls whether windows that were open at the last unload reopen automatically. The safe default is off: geometry and app state persist, but a reload returns to a clean Home desktop unless the user enables restore.

Persisted app state includes Hearth-owned state such as selected note, active calculator mode, and widget configuration where practical.

Cross-origin iframe documents remain browser-owned. Hearth cannot reliably read or write an external page’s internal scroll position because of same-origin policy. The product persists the embed URL, widget/window geometry, fullscreen preference where supported, and Hearth-owned controls. The documentation must state this limitation plainly.

Window content rules:

- the shell owns the frame, title bar, focus, z-order, and bounds;
- the app owns internal layout and scroll;
- \`min-width: 0\` and \`min-height: 0\` are applied through every flex boundary;
- maximized windows recalculate on viewport changes;
- window content never causes body scroll;
- minimized windows remain represented in the dock.

## Embedded apps

The Embed widget remains sandboxed and safe.

Add:

- a clear bounded content region below the embed toolbar;
- an optional expand/fullscreen control when the browser permits it;
- responsive toolbar wrapping at narrow widths;
- a blocked-frame state that does not cover or hide controls;
- persistent URL and Hearth-owned display state;
- a visible open-in-new-tab action.

If the embedded site itself is not responsive, Hearth cannot rewrite that external site. The host window must still remain responsive and must not distort or overflow.

## Icon system

Create one local icon presentation layer with independent choices for:

- icon family: Hearth system, monochrome, or tinted;
- container shape: squircle, rounded square, circle, or plain symbol;
- treatment: flat, subtle material, or high-contrast;
- icon size: small, regular, large;
- label visibility and label density;
- app-specific tint palette chosen from a restrained set, not random hues.

Built-in app symbols should use a consistent weight and optical box. External shortcut icons use favicon, uploaded image, emoji, or monogram fallback while preserving the selected container treatment.

The product should feel coherent across status bar, Launchpad, Home, folders, dock, windows, widgets, and mobile sheets.

## Materials and transparency

Transparency must visibly respond to settings.

Use a shared material recipe with:

- explicit surface fill alpha;
- backdrop blur and saturation;
- border and inset highlight;
- wallpaper dimming;
- contrast scrim only where text needs it;
- solid fallback when \`backdrop-filter\` is unavailable;
- reduced-effects and reduced-transparency behavior;
- an honest Settings preview using the same tokens as the shell.

The Transparency control must affect real shell surfaces at its endpoints. The app should not appear unchanged because a dark scrim or opaque fallback dominates the material.

WebGL/refraction is not required for v1.1. A performant CSS/DOM material system is the release baseline. A shader experiment remains a separate future project.

## Settings

Keep Simple and Advanced levels, but make them useful.

### Simple

- appearance profile: Auto, Desktop, Mobile;
- theme: Auto, Light, Dark;
- glass preset and transparency;
- wallpaper and wallpaper dimming;
- icon size and labels;
- reduced motion/effects;
- restore windows on reload.

### Advanced

- icon family, shape, and treatment;
- dock size, position, magnification, and indicators;
- Home density, canvas maximum width, grid snap, and minimum tile sizes;
- window default size and bounds behavior;
- embed toolbar/fullscreen preference;
- contrast and reduced transparency;
- data backup, restore, and reset;
- About/version information.

Settings writes remain local-first through repositories. Every new setting gets a default, migration behavior, backup validation, and a focused test.

## Motion

Motion is purposeful and sparse:

- status menus and Launchpad: 160–240ms ease-out;
- windows/sheets: 220–320ms spatial transition;
- dock hover: subtle scale and lift only for fine pointers;
- drag/resize: direct tracking; release snaps with a short interruptible spring or CSS transition;
- press: 100–160ms scale/color feedback;
- no animation for keyboard nudges, frequent list updates, or readable content;
- no scroll-driven decorative effects;
- reduced-motion preferences remove large transforms and spring motion.

Use existing CSS tokens for simple transitions. Add GSAP only if a coordinated, interruptible timeline is demonstrably needed. The default v1.1 implementation should not add a motion dependency for basic shell transitions.

## Data migration and backup

- bump Dexie schema for persisted window state and any new settings;
- keep old rows valid through defaults and upgrades;
- bump backup schema only when the envelope or validation contract changes;
- include new normal tables/settings in export and restore;
- validate every new enum, number, geometry field, and app id before clearing existing data;
- do not export wallpaper blobs unless the existing product contract is intentionally changed.

## Verification

Add or update tests for:

- Home remains visible when any app opens;
- multiple windows remain visible and retain focus/z-order;
- app launcher opens as an overlay;
- no body, shell, Home, or Dashboard page scrolling;
- viewport sweep at 320, 360, 390, 430, 768, 1024, 1280, and 1440px;
- window geometry clamps on resize;
- window state persists and restore-on-reload setting works;
- Links widget does not clip content after resize;
- widgets do not overlap or escape bounds;
- embed toolbar and content remain usable at narrow sizes;
- fullscreen/maximize behavior is responsive;
- transparency visibly changes shared materials;
- icon and dock settings persist;
- reduced-motion/effects and focus behavior remain correct;
- no console/page errors.

Run \`npm run check\`, then rebuild before the full desktop/mobile Playwright suite. Human visual review must cover Home, Launchpad, folders, every app window/sheet, widgets, embeds, Settings, light/dark/high-transparency/reduced-effects states.

## Documentation

Update these documents in the same release:

- \`README.md\`
- \`CHANGELOG.md\`
- \`DESIGN.md\`
- \`docs/PRODUCT_SPEC.md\`
- \`docs/ARCHITECTURE.md\`
- \`docs/ROADMAP.md\`
- \`docs/QA_CHECKLIST.md\`
- \`docs/BUILD_STATE.md\`
- the v1.1 implementation plan
- the earlier visual-system document with a superseded note or clear cross-reference

The documentation must stop describing Dashboard as a separate primary page, stop claiming that the shell never changes persistence schema, and stop calling Home an ordered-only grid.

## Out of scope

- authentication, sync, backend, analytics, cloud storage, or runtime AI;
- copying Apple proprietary assets;
- rewriting arbitrary external pages embedded in iframes;
- a full plugin marketplace;
- a shader/refraction dependency;
- unrelated feature additions.

## Acceptance standard

The release is successful when Hearth feels like a usable personal computer surface rather than a website:

- Home is the stable desktop;
- apps open over Home and do not erase it;
- shell and Home do not scroll;
- embedded content scrolls only inside bounded app regions;
- widgets fit, resize, and never overlap;
- state survives reload where the user expects it;
- icon, dock, status-bar, window, folder, widget, and sheet treatments read as one system;
- the interface remains responsive at the smallest supported widths;
- all functional and quality gates pass;
- documentation describes what the code actually does.
