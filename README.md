# Hearth OS

Hearth is a local-first, installable personal desktop for the browser. Home is the desktop: wallpaper, shortcuts, folders, widgets, Apps, status bar, and dock stay mounted while apps open over them.

Hearth has no account, backend, ads, or analytics. Data is stored in IndexedDB for the current browser origin and leaves the device only when you export a backup.

## v1.1.0 — Hearth OS visual overhaul

- Home is the permanent workspace; there is no separate Dashboard page.
- Apps opens a Launchpad overlay without hiding Home.
- Desktop apps use floating windows with traffic lights, focus order, minimize/restore, maximize, resize, and viewport bounds.
- Narrow screens use full-height iOS-style app sheets; Home stays underneath.
- Window geometry and Hearth-owned open state persist in Dexie. Reload restoration is opt-in.
- Links lists scroll inside the widget when its tile is small; the Home surface never becomes a website-like vertical scroll.
- Embed widgets have separate toolbar and bounded content regions, plus a browser-controlled fullscreen action.
- Home placement uses a hard width/height contract and collision-free move resolution.
- Icons, dock, status bar, windows, folders, widgets, and settings share one restrained platform-inspired system.
- Appearance settings cover icons, shapes, treatments, dock behavior, layout density, transparency, contrast, motion, window restore, and embed controls.

The interface is macOS/iOS-inspired but uses Hearth's own icon abstraction, palette, and typography. The supplied Figma community files were used as visual references only; no Apple or Figma asset is shipped.

## Run locally

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

The first run creates a starter Home page with widgets, shortcuts, a folder, and an Apps dock item.

## Build and verify

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

Playwright uses the production preview:

```sh
npm run test:e2e
```

Build again before E2E after changing `src/`; the suite intentionally tests the production bundle and service worker.

## Data and embeds

Settings → Advanced → Data exports and restores normal IndexedDB tables as versioned JSON. Wallpaper media blobs remain excluded.

An embedded page is sandboxed. Its URL, widget configuration, and Hearth window geometry can persist, but Hearth cannot read or write the embedded page's internal scroll position when the page is cross-origin. Use Open to move a site to a normal browser tab when it refuses framing.

## Code layout

```
src/components/     shell chrome, launcher, windows, shared glyphs
src/features/       Home, mini-apps, widgets, search, Settings
src/data/            Dexie schema, migrations, repositories, geometry
src/state/           immediate shell state; durable state remains in Dexie
src/styles/          tokens, materials, global primitives, motion
```

Repository boundaries are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Product behavior is in [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), visual rules are in [DESIGN.md](DESIGN.md), and the release record is in [docs/BUILD_STATE.md](docs/BUILD_STATE.md).
