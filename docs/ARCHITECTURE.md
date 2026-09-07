# ARCHITECTURE — Hearth current baseline

## Stack

Vite 8 + React 19 + TypeScript 5.9 (strict), plain CSS/CSS modules with design tokens, Dexie 4 + dexie-react-hooks, Zustand 5 for ephemeral UI, dnd-kit for Home/dock interactions, lucide-react for current system/control glyphs, vite-plugin-pwa, Vitest/RTL and Playwright.

## Layering and data flow

```text
UI (features/*, components/*)
   │ reactive hooks / repositories
   ▼
Repositories (data/repositories/*) — canonical persistence boundary
   ▼
Dexie schema (data/db/*) → IndexedDB
```

Persistent state stays in Dexie. Ephemeral window/mode/edit/overlay state stays in Zustand. Derived values should not become a second persistent store.

## Database evolution

The original V1 docs described DB v1. The shipped code has since evolved through **v3**, including the single-row offline `currencyRates` store used by Calculator/Currency plus migration/backfill work needed by the freeform layout overhaul. Treat the code/migrations/tests as authoritative for exact schema/index details.

Core domains include settings, pages/layout items, shortcuts, folders, widgets, notes, tasks, history, wallpapers, dock items and current later-added data such as currency rates.

## Home layout contract

The original V1 used dense row-major ordering only. The current desktop implementation now supports **freeform geometry/grid-lattice behavior**. Older/imported V1 layout rows are backfilled through the current geometry planning/migration path (`planFreeformGeometry` is recorded in the implementation ledger).

Mobile intentionally keeps a compact/paged presentation rather than becoming a tiny freeform desktop. Both views operate over the same domain data; do not create separate desktop/mobile data stores.

When changing geometry, inspect current types/repositories/tests before assuming field shapes from historical docs.

## Widget/mini-app contract

- Widget instances are stable typed registry entries with persisted settings/layout data.
- Mini-apps fill the shell-provided host, provide their own inner layout/scrolling, and do not duplicate window/sheet chrome.
- The shell maps built-in app ids to mini-app content for desktop windows/mobile sheets.

## Shell responsibilities

- wallpaper/media backdrop beneath all surfaces;
- desktop menu/status bar and dock;
- Home pages/freeform desktop canvas + mobile paged model/Edit Mode;
- desktop windows with focus/drag/resize/close/maximize behavior supported by the current implementation;
- mobile full-screen/sheet host and safe-area behavior;
- Control Center/search/folder/settings overlays;
- viewport containment: the outer shell should not become page-scrollable; long app/embed content scrolls inside bounded hosts.

## Navigation

External URL/search navigation remains same-tab through the existing navigation/planning helpers and records only local dashboard history. Do not force sites into embeds when they block framing.

## Material architecture

### Current

The shipped baseline uses shared CSS glass/tokens with Reduced Effects and reduced-motion support.

### V1.11 planned seam

V1.11 may introduce selective `ybouane/liquidglass` WebGL refraction behind a centralized material/glass abstraction. This is a **planned seam, not currently shipped behavior**.

Requirements for that seam:
- CSS glass remains a fallback and inexpensive tier;
- no per-widget WebGL-instance explosion;
- high-value shell surfaces get priority;
- dynamic DOM capture is minimized;
- Reduced Effects/unsupported WebGL/constrained-device fallbacks are explicit;
- settings map to real renderer behavior rather than decorative toggles.

Do not import from `design-references/` into runtime. Promote reviewed assets to a runtime location deliberately.

## PWA

`vite-plugin-pwa` generates the manifest/service worker. Uploaded media lives in IndexedDB and is not precached. Verify service-worker/offline behavior from a fresh production build.

## Testing

Vitest/RTL/fake-indexeddb cover logic/components/data. Playwright covers production desktop/mobile behavior, responsiveness, accessibility, motion, PWA/offline and performance journeys. Source changes require a fresh production build before E2E.

## Path alias

`@/*` maps to `src/*`. Follow existing barrels/boundaries and do not import Dexie directly from random UI components.
