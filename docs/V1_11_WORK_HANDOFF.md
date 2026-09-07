# V1.11 Work handoff — visual/UX overhaul

Use this as the active handoff for ChatGPT Work, Codex, Claude Code or another implementation agent.

## Mission

Upgrade the **existing** Hearth application to V1.11. Preserve working features, data architecture, persistence, accessibility and responsive behavior. This is a visual/UX/material overhaul and targeted structural cleanup — **not a rebuild from a prototype**.

## Read first

1. `CLAUDE.md`
2. `AGENTS.md`
3. `DESIGN.md`
4. `docs/CURRENT_STATE.md`
5. `docs/ARCHITECTURE.md`
6. Relevant newest sections of `docs/V2_STATUS.md`
7. `design-references/README.md`

`docs/PRODUCT_SPEC.md` and the root one-shot prompt are the historical V1 baseline. They do not override later shipped work or the approved V1.11 design.

## Reference roles

### Existing repository
Source of truth for functionality and architecture. Do not replace the React application with the reference HTML.

### Figma app icons
`https://www.figma.com/design/KkioCa05PlAtIHUNT3xovg/iOS-App-icons-vector--Community-?node-id=401-3`

Use reviewed/exported app artwork only where licensing permits. Download exact required assets into a runtime asset location; do not depend on expiring Figma URLs. App icons are distinct from system/control glyphs.

### LiquidGlass
`https://github.com/ybouane/liquidglass`

Preferred implementation reference for true WebGL refraction. The library can apply blur, refraction, chromatic aberration, edge highlights, specular/Fresnel effects, distortion, tint/saturation/brightness, bevel and shadow settings per element.

Integration constraints from its documented design matter:
- glass elements are direct children of their LiquidGlass root;
- DOM capture is expensive, especially for always-dynamic content;
- each LiquidGlass instance owns a WebGL context, so do not create one instance per widget;
- static scenes can short-circuit when nothing is dirty;
- Reduced Effects/performance fallbacks must remain first-class.

Do not add the package until the implementation task has a central material boundary, fallbacks and tests defined.

### HTML reference
`design-references/macos-liquidglass-motion-reference.html`

Use it for motion/shape/material reference. Its dock uses pointer proximity and a cosine falloff over a 135px radius, reaching about 1.44× scale and ~16px upward lift. Refine this into a restrained, spring-like production interaction with neighbor response, tooltip/label behavior, click feedback and a touch-safe alternative.

Do **not** copy its hand-drawn SVG app icons, hard-coded layout, demo wallpaper or standalone architecture into Hearth.

## Workstreams

### A. Material engine
- Introduce one centralized material/glass boundary rather than scattering raw library calls.
- Preserve CSS glass as a fallback and for cheap ordinary surfaces.
- Prefer full WebGL material only for high-value surfaces such as dock, menu/status bar, Control Center, windows/sheets and important popovers.
- Avoid dozens of WebGL contexts and avoid broad `data-dynamic` recapture.
- Respect Reduced Effects, `prefers-reduced-motion`, unsupported WebGL and constrained/mobile devices.
- If exposing settings, back every control with actual behavior and persistence. Suggested presets: Off, Performance, Balanced, High, Custom. Custom may expose only library controls that are genuinely wired and safe.

### B. Dock motion
- Replace generic per-icon hover zoom with proximity-based magnification influenced by the HTML reference.
- Keep motion purposeful and restrained; avoid huge cartoon scaling.
- Consider spring interpolation/neighbor displacement only if it remains performant.
- Preserve keyboard focus, click/tap targets, edit/reorder behavior and narrow-phone fit.
- Touch devices need explicit touch behavior; never rely on hover.

### C. Icon system
- Export only the app icons actually used by Hearth from the Figma source after license review.
- Keep app artwork separate from interface/system glyphs.
- Do not hand-draw approximations when exact reviewed assets exist.
- Normalize optical sizing, masks and alignment rather than forcing every artwork to identical visual mass.

### D. Shape, typography and spacing
- Use varied widget aspect ratios and restrained radii; do not make every widget the same SaaS card.
- Keep a 4/8 spacing rhythm, system/SF-like font stack, calmer font weights and precise optical alignment.
- Reduce oversized pills, nested cards, heavy shadows and random gradients.
- Preserve readable contrast over varied wallpapers.

### E. Responsive/structural behavior
- The outer desktop/mobile shell must remain viewport-bound and must not become page-scrollable.
- Mini-apps, embeds, lists and settings panes may scroll **inside their own bounded surfaces**.
- Desktop should feel like using a desktop environment; phone widths should switch to intentionally iOS-like sheets/pages/controls rather than shrink the desktop.
- Test at least 360, 390, 768, 1024, 1280 and 1440 widths and relevant height extremes.

### F. Verification

For runtime changes, do not claim completion until:

```sh
npm run check
npm run build
npx playwright test --project=desktop --project=mobile
```

Also visually inspect the major states at desktop and phone sizes, verify no page-level overflow, test Reduced Effects/reduced motion, check console/page errors, verify touch/keyboard behavior, and measure LiquidGlass performance on both idle and dynamic scenes.

## Acceptance criteria

V1.11 is complete only when the existing features still work and:

- the shell reads as a coherent macOS-like desktop and iOS-like mobile experience rather than a generic website;
- the outer shell does not scroll;
- app/widget content scrolling is correctly bounded;
- dock magnification is proximity-based, smooth, accessible and touch-safe;
- app icons use reviewed production assets rather than AI-looking approximations;
- Liquid Glass is visibly refractive on selected supported surfaces, with graceful CSS/solid fallbacks;
- glass settings/presets, if exposed, persist and actually affect the renderer;
- reduced effects and reduced motion remain correct;
- no material responsiveness, accessibility, PWA or persistence regression is introduced;
- full automated gates and visual review are green.
