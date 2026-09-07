# Hearth OS roadmap

## Shipped — v1.1.0

- permanent Home desktop + Launchpad overlay;
- concurrent desktop windows and narrow-screen sheets;
- persistent window geometry/lifecycle state with opt-in restore;
- collision-free bounded Home placement;
- contained app/widget/embed scrolling;
- configurable icon/dock/material/layout/contrast/motion presentation;
- Dexie v4 migration and backup coverage;
- local-first PWA architecture.

## Next — visual/material refinement

Prioritize polish without rebuilding the product:

- selective `ybouane/liquidglass` WebGL refraction for high-value shell surfaces only;
- central material adapter with CSS/solid fallbacks, Reduced Effects and performance gating;
- refined proximity-based dock animation inspired by the committed HTML study;
- reviewed/exported Figma app-icon artwork where licensing permits;
- widget shape/radius/typography/optical-spacing polish;
- full desktop/mobile Playwright + visual/performance verification after the material pass.

## Later product improvements

- richer calendar events/reminders;
- richer Notes formatting/attachments;
- more first-party widgets with explicit bounded-scroll contracts;
- additional Hearth-authored icon packs;
- performance profiling for very large Home layouts.

## Deferred

- cloud sync/cross-device backup;
- authentication/multi-user product;
- analytics;
- third-party plugin marketplace/arbitrary-code widgets;
- arbitrary iframe rewriting or cross-origin embed state control;
- native platform packaging.
