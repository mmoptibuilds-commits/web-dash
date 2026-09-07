# QA CHECKLIST — Hearth current baseline + V1.11 gates

## Latest recorded green baseline

The newest completed visual-polish ledger entry records:

- [x] `npm run check` — lint + typecheck + **126/126 Vitest tests** + PWA build passed.
- [x] `npm run test:e2e` — **81 passed / 23 skipped / 0 failed** desktop+mobile against the production build.
- [x] Existing responsive/mobile/PWA/offline/accessibility/reduced-effects/performance coverage completed as documented in `docs/V2_STATUS.md`.

The 2026-09-07 repository-preparation commit is documentation/reference-only; it does not claim a fresh runtime test execution.

## Baseline behaviors V1.11 must preserve

- [ ] Clean launch and existing seed data/features remain functional.
- [ ] Desktop freeform layout/edit/resize/move persistence remains correct after reload/import.
- [ ] Mobile paged Home and full-screen/sheet app behavior remains intentional and touch-safe.
- [ ] Dock launch/edit/reorder/narrow-phone behavior remains correct.
- [ ] Notes/Tasks/Calendar/Links/Calculator CRUD/calculation behavior persists.
- [ ] Search/URL same-tab safety and local history behavior remains correct.
- [ ] Wallpaper/settings/backup persistence remains correct.
- [ ] PWA production install/offline/update path remains correct.

## V1.11 visual/structural acceptance

- [ ] Outer desktop shell does not page-scroll at supported viewport sizes/heights.
- [ ] Outer mobile shell does not become an accidental long webpage.
- [ ] Long mini-app, Settings and embed content scrolls only inside bounded intended regions.
- [ ] No horizontal overflow at 360 / 390 / 768 / 1024 / 1280 / 1440 widths.
- [ ] Desktop reads as one coherent macOS-like environment rather than a generic website.
- [ ] Mobile switches to an intentionally iOS-like layout/control model rather than squeezing desktop UI.
- [ ] Widget proportions/radii/spacing are varied, restrained and content-led; excessive pills/card nesting removed.
- [ ] App artwork uses reviewed production assets; system/control glyphs remain a separate consistent family.

## Liquid Glass acceptance

- [ ] WebGL Liquid Glass is limited to deliberate high-value surfaces and does not create a WebGL context per widget.
- [ ] Refraction is visibly correct over supported wallpaper/content backgrounds without clipping/stacking artifacts.
- [ ] CSS/solid fallback works when WebGL is unavailable/disabled or Reduced Effects is enabled.
- [ ] Idle scenes do not continuously rerasterize expensive static DOM.
- [ ] Dynamic/video scenes remain usable and smooth on target desktop and phone hardware/classes.
- [ ] Resize, wallpaper changes, stacked surfaces and app/window transitions recover correctly.
- [ ] Any exposed Off/Performance/Balanced/High/Custom settings persist and actually change the renderer.
- [ ] Custom parameter ranges are bounded and cannot produce unreadable/broken UI.

## Dock motion acceptance

- [ ] Pointer proximity produces continuous neighboring magnification rather than isolated hover pops.
- [ ] Motion is restrained, bottom-anchored and stable with labels/tooltips.
- [ ] Click/tap, keyboard focus and Edit Mode/reorder continue to work.
- [ ] Mobile/touch has a deliberate alternative and no hover-only dependency.
- [ ] Reduced motion collapses/simplifies dock motion appropriately.

## Accessibility and performance

- [ ] `prefers-reduced-motion` and in-app Reduced Effects remain functional across all new material/motion paths.
- [ ] Keyboard focus remains visible and dialogs/sheets retain focus management.
- [ ] Touch targets remain usable at narrow widths.
- [ ] No new uncaught console/page errors during the standard journey.
- [ ] Production JS/CSS/performance budgets are reviewed after adding any new material dependency.

## Final V1.11 verification commands

```sh
npm run check
npm run build
npx playwright test --project=desktop --project=mobile
```

Then visually review desktop and phone screenshots/states against `DESIGN.md` and the reference set. Do not tick visual/material items from code inspection alone.
