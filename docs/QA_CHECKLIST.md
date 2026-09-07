# Hearth OS v1.1 QA checklist

## Latest recorded implementation gate

From the v1.1 UI/runtime implementation workspace:

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] Vitest — **19 files / 130 tests**
- [x] `npm run build` + PWA service-worker generation
- [x] `git diff --check`
- [ ] desktop/mobile Playwright against a fresh production build — not run in that workspace because the browser/e2e environment was incomplete

The 2026-09-07 branch consolidation itself is repository-only and does not claim these commands were rerun on the merge commit.

## Core behavior to preserve

- [ ] Home remains visible beneath opened apps.
- [ ] Apps/Launchpad opens/dismisses without replacing Home.
- [ ] Multiple desktop windows remain visible/focusable; minimize/restore/maximize/resize stay bounded.
- [ ] Mobile sheets close through their supported Back/Escape/handle interactions.
- [ ] Freeform placement rejects overlap and remains within measured bounds.
- [ ] Links and other content-heavy widgets keep all rows reachable through internal scrolling.
- [ ] Embed toolbar remains usable at narrow sizes and Open/fullscreen behavior works where permitted.
- [ ] Settings material/icon/dock/density/contrast/motion/restore settings persist and apply.
- [ ] Backup/restore and Dexie v4 window rows remain backward compatible.
- [ ] PWA/offline behavior works from a fresh production build.

## Visual/responsive sweep

Test at least 320, 360, 390, 430, 768, 1024, 1280 and 1440px plus short-height desktop cases. Inspect light/dark, high transparency, reduced transparency, Reduced Effects and reduced motion.

The document, shell and Home must not gain page-level scrollbars. App/widget/embed bodies may scroll only inside bounded regions.

## Next material-pass additions

If selective Liquid Glass is implemented, also verify:

- WebGL unsupported/reduced/performance fallbacks;
- idle and dynamic frame behavior on desktop and phone-class hardware;
- no proliferation of WebGL contexts;
- settings presets/controls persist and map to real renderer behavior;
- dock proximity animation remains keyboard/touch safe and narrow-phone overflow-free;
- no console/page errors or accessibility regressions.
