# DESIGN.md — Hearth V1.11 visual language

## North star

Hearth should feel like a polished personal desktop environment on desktop and a deliberately iOS-like home/workspace on phone — **not a website wearing rounded cards**. The design is Apple-inspired in interaction discipline, proportion, hierarchy and material behavior while remaining a web application with its own product identity.

## Current baseline vs V1.11 target

**Already implemented:** tokenized CSS glass/backdrop blur, responsive desktop/mobile shells, Reduced Effects, freeform desktop Home geometry, mobile sheets, reference-led radius/spacing polish.

**V1.11 target:** Adaptive Liquid Glass, improved app icon artwork, proximity-based dock motion, tighter widget geometry/typography, and full structural responsiveness. Do not describe these target pieces as shipped until implementation and verification exist.

## Material hierarchy — Adaptive Liquid Glass

Glass is selective and has three tiers:

1. **Full Liquid Glass** — preferred for high-value shell surfaces: dock, menu/status bar, Control Center, desktop windows/mobile sheets and important popovers. V1.11 may use `ybouane/liquidglass` here for real refraction.
2. **Lightweight CSS glass** — ordinary widgets and secondary surfaces where WebGL cost is not justified.
3. **Solid/reduced fallback** — Reduced Effects, unsupported WebGL, constrained devices or any scene where the refractive path cannot stay smooth/readable.

The previous blanket V1 ban on WebGL/refraction is no longer an active V1.11 rule. That does **not** mean every translucent surface should use a shader.

### Glass settings target

A real Settings surface may expose **Off / Performance / Balanced / High / Custom** only when each preset is wired to real rendering behavior and persistence. Custom controls can map to supported parameters such as blur, refraction, chromatic aberration, edge highlight, specular, Fresnel, distortion, opacity/tint/saturation/brightness, bevel depth and shadow. Keep unsafe/extreme ranges clamped and keep fallbacks functional.

## Dock

Use the committed HTML reference as an interaction study, not as production code. Its cosine proximity curve is a good baseline because neighboring icons react continuously rather than each icon performing a disconnected hover zoom.

V1.11 dock goals:
- proximity-based magnification with restrained maximum scale;
- smooth spring-like interpolation and subtle neighboring displacement if performance permits;
- bottom-anchored optical motion;
- app label/tooltip behavior that does not jitter;
- click/tap feedback, running/active state where meaningful;
- keyboard focus and edit/reorder behavior preserved;
- touch-safe alternative on mobile — no hover-only functionality;
- narrow phones remain overflow-free.

## Widgets and surfaces

- Use varied aspect ratios and purposeful shapes; not every widget should be an equal SaaS card.
- Keep radii restrained and proportional to component size. Avoid `9999px` unless the control is truly capsule-shaped.
- Use hairline edges and small internal highlights before heavy shadows.
- Let content hierarchy create structure; avoid nested card-inside-card stacks.
- Widget content must adapt/reflow; do not merely scale the desktop version down.

## Typography and rhythm

- Use the existing system/SF-like stack; no paid font dependency.
- Prefer calmer weights and optical alignment over excessive bold text.
- Maintain the existing 4/8 spacing rhythm; use negative space intentionally.
- Keep small labels readable; avoid tiny low-contrast explanatory text.
- Align icon visual mass, baselines and hit targets independently — optical size matters more than identical bounding boxes.

## Icon systems

**App artwork** and **UI/control glyphs** are separate systems.

- App artwork: use reviewed/exported assets from the approved Figma source where licensing permits, storing exact required assets locally in runtime locations.
- UI/control glyphs: keep one consistent system-icon family/visual language for back, close, search, settings, chevrons, toggles and other controls.
- Do not use the hand-drawn SVG app approximations from the HTML reference when better source artwork exists.

## Desktop, mobile and scrolling

### Desktop
- Viewport-bound desktop shell; the page itself should not scroll.
- Menu/status bar, freeform Home canvas, dock and floating windows should read as one environment.
- Windows/apps may contain their own scroll regions.

### Mobile
- Automatically switch to an intentionally iOS-like interaction model.
- Use sheets/full-screen app experiences, safe areas, touch-first controls and paged Home behavior.
- Do not squeeze desktop windows or depend on hover.

### Embedded apps/content

Embeds and long content may scroll inside **bounded containers**. Scroll chaining/overscroll must not turn the outer dashboard into a web page.

## Motion

- Purposeful, short and physically coherent.
- Prefer transform/opacity and spring-like response; avoid constant ambient motion.
- Preserve `prefers-reduced-motion`; Reduced Effects must remove expensive/ornamental material behavior as well as blur where appropriate.
- Motion must communicate state/space, not decorate everything.

## Performance guardrails for Liquid Glass

- Centralize integration; do not initialize a separate WebGL context for every widget.
- Keep capture roots shallow and stable.
- Use always-dynamic capture sparingly; invalidate one-shot visual changes instead of rerasterizing every frame where possible.
- Test idle and dynamic scenes, video wallpapers, resize, dock motion and stacked glass.
- Fall back before sacrificing interaction smoothness or readability.

## Anti-patterns

Avoid purple-blue SaaS gradients, excessive pills, random radii, heavy shadows, endless cards, generic AI iconography, fake complexity, page-level scrolling, hover-only mobile behavior, blanket WebGL, and visual changes that bypass the token/material system.

## Reference index

See [`design-references/README.md`](design-references/README.md), the Figma app-icon frame `401:3`, and `https://github.com/ybouane/liquidglass`. The existing application remains the functionality/architecture source of truth.
