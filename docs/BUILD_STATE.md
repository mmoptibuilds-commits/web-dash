# Hearth OS v1.1 build state

## Current release

- Version: 1.1.0
- Branch: feat/v1.1-hearth-os-overhaul
- Release: Hearth OS visual and structural overhaul
- Storage migration: Dexie v3 -> v4 with windowStates
- Figma references: visual inspiration only; no supplied asset copied
- Motion runtime: CSS transitions; no GSAP dependency added

## Implemented surfaces

Home is now permanent under apps. Apps/Launchpad, status bar, dock, folders, windows, mobile sheets, shared glyphs, materials, Settings, collision-free geometry, Links, Embed, and responsive containment were updated together. Existing app data contracts remain compatible and backups include the window table.

## Verification record

The local implementation has focused Vitest coverage for geometry collision/bounds, Links reachability, and window-state persistence, plus the existing feature suite.

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test -- --reporter=dot` — passed: 19 files, 130 tests.
- `npm run build` — passed: Vite production build and PWA service worker generated.
- `git diff --check` — passed.
- Desktop/mobile Playwright — not run in this workspace: the reconstruction does not include local `e2e/` files and no Edge/Chromium executable is installed. Run the repository's browser suite in CI or a browser-enabled checkout before promotion.

## Known limitation

A cross-origin iframe's internal document remains browser-owned. Hearth persists its own widget/window settings but cannot inspect or restore the iframe's internal scroll position.
