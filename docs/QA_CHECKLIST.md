# Hearth OS v1.1 QA checklist

## Automated gate

- [x] npm run lint
- [x] npm run typecheck
- [x] npm test
- [x] npm run build
- [ ] desktop and mobile Playwright suites against a fresh production build (blocked here: no local e2e files or browser executable)
- [x] git diff --check

## Core flows

- [x] Home remains visible when Notes, Tasks, Calendar, Links, Calculator, or Settings opens.
- [x] Multiple desktop windows remain visible and focusable together.
- [x] Apps opens and dismisses Launchpad without changing the workspace.
- [x] Minimized windows remain represented in the dock and restore on activation.
- [x] Mobile sheets close with Back, Escape, or the grab handle.
- [x] Links widget keeps all rows reachable inside its own scroll region.
- [x] Embed toolbar remains usable at narrow sizes and exposes Open/fullscreen controls.
- [x] Freeform layout rejects overlap and stays inside measured bounds.
- [x] Settings changes material, icon, dock, density, contrast, motion, and restore behavior.

## Viewports and states

Sweep 320, 360, 390, 430, 768, 1024, 1280, and 1440px. Inspect light, dark, high transparency, reduced transparency, reduced effects, and reduced motion. The document, shell, and Home must have no scrollbar; app bodies and embedded documents may scroll only within their bounded surfaces.

## Manual visual review

Review Home, Launchpad, folder, dock editing, stacked windows, maximized/resized windows, mobile sheet, Links, Embed, Settings Simple/Advanced, and PWA reload. Confirm no copied Apple/Figma asset and no console/page errors.
