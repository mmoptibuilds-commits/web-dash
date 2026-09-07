# ROADMAP — Hearth

## Shipped baseline

The original V1 and subsequent overhaul are already on the default branch: local-first PWA, Home/Dashboard modes, desktop windows/mobile sheets, desktop freeform geometry, dock/folders/widgets/wallpapers, Notes/Tasks/Calendar/Links, Calculator + offline currency rates, backup, Reduced Effects, accessibility/performance/PWA hardening and reference-led visual polish.

See `docs/CURRENT_STATE.md` and `docs/V2_STATUS.md` for evidence.

## V1.11 — active next milestone

A focused visual/UX/material overhaul that **preserves the existing architecture and features**:

- selective real Liquid Glass/refraction on high-value shell surfaces using `ybouane/liquidglass`, with CSS/solid fallbacks and performance tiers;
- persistent glass presets/settings only when fully wired;
- proximity-based, spring-refined dock magnification with keyboard/touch/edit-mode compatibility;
- reviewed/exported Figma app icons and a separate consistent system/control glyph language;
- stronger macOS-like desktop and iOS-like phone structure;
- viewport-bound outer shell; bounded internal scrolling for embeds/apps/settings panes;
- widget/radius/spacing/typography hierarchy overhaul with fewer pills and less generic card styling;
- full responsive, accessibility, Reduced Effects, motion, performance and PWA regression verification.

V1.11 should remain $0 additional spend and low-maintenance. Do not add cloud infrastructure to accomplish a visual overhaul.

## Later product work

Still deferred unless explicitly reprioritized:
- authentication and cross-device sync;
- Google Drive/cloud backup;
- richer Markdown/rich notes;
- calendar events/reminders/notification center;
- custom API/data widgets and Smart Folders;
- browser extension/history permissions;
- deeper configurable Control Center/window management;
- weather/native apps;
- plugin/widget marketplace, arbitrary-code SDK, multi-user/community/social features;
- public theme/wallpaper marketplaces and heavy SEO.

## Guardrail

Later-product infrastructure must not leak into V1.11. The visual/material work can create a clean central seam where required, but no speculative backend or plugin architecture.
