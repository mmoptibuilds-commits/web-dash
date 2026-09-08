# Hearth OS v1.2 QA checklist

## Latest recorded implementation gate

From the v1.2 implementation workspace:

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] Vitest — **27 files / 149 tests**
- [x] `npm run build` + PWA service-worker generation
- [x] `npm run check`
- [x] `git diff --check`
- [x] Playwright discovery — **118 cases** parse successfully
- [ ] fresh desktop/mobile Playwright execution after the final corrections — blocked because no browser binary was installed and the Chromium download endpoint timed out; the preceding candidate run recorded **114 discovered; 87 passed, 27 intentional skips, 0 failed**
- [ ] fresh production screenshots after the final corrections — blocked by the same missing-browser limitation; the existing desktop/phone, light/dark, Settings, Control Center and Launchpad captures remain available
- [x] side-by-side review of existing captures against readable references 04–06 and rendered Liquid Glass motion HTML; this review drove final Launchpad title/touch-action contrast corrections

References 01–03 are truncated in both the checkout and canonical Git blob (RIFF payloads end early), so no decoder can render them. Their documented dimensions and `design-references/v1.2/README.md` guidance were inspected; menu/Control Center/full-desktop states were captured in the preceding candidate pass.

## Core behavior to preserve

- [x] Home remains visible beneath opened apps.
- [x] Full-viewport Launchpad opens/dismisses without replacing Home and shows the shared user Links source.
- [x] Launchpad add/edit/delete writes only the shared shortcut repository and cascades safely.
- [x] Multiple desktop windows remain visible/focusable; minimize/restore/snap/resize stay bounded.
- [x] Mobile sheets close through their supported Back/Escape/handle interactions.
- [x] Freeform placement rejects overlap and remains within measured bounds.
- [x] Links and other content-heavy widgets keep all rows reachable through internal scrolling.
- [x] Embed toolbar remains usable at narrow sizes and Open/fullscreen behavior works where permitted.
- [x] Settings material/icon/dock/density/contrast/motion/restore settings persist and apply.
- [x] Backup/restore and Dexie v4 window rows remain backward compatible.
- [x] PWA/offline behavior works from a fresh production build.

## Visual/responsive sweep

Test at least 320, 360, 390, 430, 768, 1024, 1280 and 1440px plus short-height desktop cases. Inspect light/dark, high transparency, reduced transparency, Reduced Effects and reduced motion.

The document, shell and Home must not gain page-level scrollbars. App/widget/embed bodies may scroll only inside bounded regions.

## Material-pass checks

- WebGL unsupported/reduced/performance fallbacks;
- snap preview plus all half/corner/maximize safe-area bounds;
- idle and dynamic frame behavior on desktop and phone-class hardware;
- no proliferation of WebGL contexts;
- settings presets/controls persist and map to real renderer behavior;
- dock proximity animation remains keyboard/touch safe and narrow-phone overflow-free;
- no console/page errors or accessibility regressions.
- 4× browser CPU-throttled 390px phone flow (proxy only, not a real-device claim).
