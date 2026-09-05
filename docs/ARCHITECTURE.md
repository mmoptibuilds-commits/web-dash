# ARCHITECTURE — Hearth V1

## Stack
Vite 8 + React 19 + TypeScript 5.9 (strict), plain CSS + CSS modules with
design tokens, Dexie 4 + dexie-react-hooks (persistence), Zustand 5 (ephemeral
UI only), dnd-kit (Edit-Mode reorder), lucide-react icons, vite-plugin-pwa.

## Layering & data flow
```
UI (features/*, components/shell)                 (never touches db.*)
   │  reads via reactive hooks (hooks/data.ts)
   ▼
Repositories (data/repositories/*)  ← the ONLY data-access path
   │  named exports per table domain; barrel index exports namespaced
   │  (settingsRepo, noteRepo, taskRepo, shortcutRepo, folderRepo,
   │   layoutRepo, pageRepo, widgetRepo, historyRepo, wallpaperRepo, dockRepo)
   ▼
Dexie schema (data/db/db.ts)  →  IndexedDB
```
- `db` versioned (currently 1). `data/defaults.ts` holds default settings +
  home page shape; `data/seed.ts` does first-run seeding (`ensureBootData`)
  and full wipe (`wipeAllData`). Idempotent, settings-row-guarded.
- Persistent state: Dexie. Ephemeral UI (mode, windows, edit mode, open
  overlays): `state/ui.ts` (Zustand). Derived data: derive, don't duplicate.

## Domain & tables
Entity types live in `types/domain.ts` (frozen, versioned). Tables:
`settings`, `homePages`, `layoutItems`, `shortcuts`, `folders`,
`widgetInstances`, `notes`, `tasks`, `history`, `wallpapers`, `dockItems`.

- **Layout contract:** a home page has `LayoutItem`s `{id, pageId, kind,
  refId, order}`. `order` = row-major flow index; span is derived from payload
  (shortcuts/folders 1×1; widgets by `size`). Reorder = rewrite dense
  `order`. Strict snap grid, no free x/y.
- **Widget contract:** `WidgetInstance {id, type, size, settings}`. The typed
  registry (`features/widgets/registry.tsx`) maps `type` → def (name, icon,
  allowed sizes, default size, component). Components receive
  `{instance, editMode?}` and render a self-contained glass panel filling the
  tile. Registry + `ADDABLE_WIDGETS` are **coordinator-owned**.
- **Shared shortcuts:** a Shortcut is one entity; pages reference it via a
  LayoutItem; folders reference it via `shortcutIds`; the dock references it
  via `DockItem.shortcutId`. Links/Bookmarks and the search/link UI all read
  this single store — never a second link DB.

## Feature content contract
`src/features/<name>/index` exports `<Name>MiniApp` (fills parent 100%, owns
scrolling, no chrome) and, for Home features, `<Name>Widget`. Shell maps app
id → MiniApp for windows/sheets. Coordinator wires widget entries into the
registry after features land.

## Shell responsibilities (components/shell)
- Wallpaper backdrop layer (builtin gradients / uploaded media, muted video,
  pauses when hidden) under all surfaces.
- Menu bar (mode switch, date/time, Edit, Control Center, Settings).
- Dock (nav apps + shortcut pins; Edit-mode reorder).
- Desktop windows host (`AppWindow` frame: traffic lights, title, drag,
  focus/z, maximize, close) — content = feature MiniApp.
- Mobile sheet host (full-screen, back affordance).
- Dashboard workspace, Home pages/canvas/edit UI, Control Center, search
  overlay, folder overlay. State lives in `state/ui.ts`.

## Cross-app navigation
`lib/nav.ts` opens external URLs same-tab and records history (fire-and-forget
+ `setTimeout` flush). `lib/run.ts` plans/executes a typed address
(url/search). Built-in app launch from Home/dock switches mode and opens the
mini-app window/sheet (Zustand `openApp` + `setMode`).

## PWA
`vite-plugin-pwa` (workbox) generates manifest + SW at build; `registerType:
'autoUpdate'`, navigateFallback → index.html. Uploaded wallpaper blobs are in
IndexedDB and never precached. Verify SW behavior from the production build.

## Testing
Vitest + RTL + fake-indexeddb. Unit tests cover pure logic (url/search
classification, build URLs), repo CRUD + cascade rules, defaults/seed init,
history upsert/prune. Tests never navigate the real page. Co-locate tests
`src/**/*.test.*`.

## Path alias
`@/*` → `src/*` (vite + tsconfig). Import shared modules only through their
barrel/index; components never import `db` directly.
