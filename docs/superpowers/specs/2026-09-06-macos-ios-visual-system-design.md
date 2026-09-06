> **Superseded for v1.1.0.** This earlier CSS-only proposal preserved the separate Dashboard mode. The approved Hearth OS overhaul is documented in `docs/superpowers/specs/2026-09-06-hearth-os-v1-1-overhaul-design.md` and its implementation plan.

# Hearth macOS/iOS Visual System

## Status

Approved direction for implementation on `build/v1-one-shot`.

## Goal

Make Hearth read as a cohesive, high-fidelity Apple-inspired web desktop on
large screens and an iOS-inspired personal launcher on touch screens. The
visual language must be consistent across the shell, Home canvas, widgets,
folders, popovers, embedded mini-app windows, mobile sheets, and Settings.

The existing local-first behavior, navigation, persistence, and the visible
`mmoptibuilds` wordmark remain unchanged unless a visual change requires a
small accessibility or responsive adjustment.

## Visual direction

- Use the supplied macOS/iOS screenshots as visual references for hierarchy,
  translucency, spacing, icon treatment, folder composition, and chrome.
- Keep Hearth's original ember accent and Lagoon wallpaper family so the
  product remains identifiable and does not copy Apple's branding.
- Use CSS materials only: layered fills, borders, shadows, gradients,
  `backdrop-filter`, and explicit reduced-effects fallbacks.
- Do not copy proprietary Apple fonts, icons, wallpapers, or UI assets into the
  product. Do not add `liquidGL-main` or another WebGL/refraction layer; V1
  explicitly defers refraction shaders and requires a robust CSS fallback.

## Scope

### Shared material and typography

Establish shared tokens and recipes for:

- 8px spacing rhythm, control heights, desktop/mobile radii, and squircle icon
  corners.
- Primary, secondary, and tertiary ink colors with sufficient contrast over
  both wallpaper and solid reduced-effects surfaces.
- Quiet, medium, and elevated materials with a consistent alpha hierarchy,
  border hairlines, inset highlights, shadow depth, blur, and saturation.
- System/SF-like typography using the existing safe system stack, balanced
  headings, tabular numerals where appropriate, and predictable truncation.
- Explicit light, dark, transparent, and reduced-effects behavior.

### Desktop shell

- Compact translucent status bar with the `mmoptibuilds` brand, mode switch,
  search, Control Center, Edit affordance, and date/time.
- Centered floating windows with macOS traffic lights, quiet title bars,
  front/inactive elevation, correct scroll ownership, and responsive bounds.
- A centered glass dock with optical icon sizing, active indicators, edit-mode
  affordances, add-to-dock popover, and narrow-width fitting.
- Search, Control Center, and modal surfaces use the same elevation recipes.

### Mobile shell

- Safe-area-aware top chrome with iOS-like compact controls.
- Full-height frosted sheets for mini-apps, with a grab handle, back affordance,
  contained scrolling, and touch targets that remain usable at 320px wide.
- Dock and Home controls remain reachable without hover and do not introduce
  horizontal overflow.

### Home, widgets, and folders

- Home canvas uses the supplied home-screen references for tile density,
  optical icon scale, label treatment, and wallpaper breathing room.
- Every widget uses a self-contained shared glass panel and adapts to its tile
  container width, not the viewport.
- Edit mode keeps controls discoverable but lightweight; picker rows, resize
  chips, and remove affordances share the control recipe.
- Folders use a centered frosted card, a compact four-column icon grid, and a
  clear title/count hierarchy on both desktop and mobile. Existing rename,
  add/remove, open, and delete behavior is retained.

### Mini-apps and embedded surfaces

Tune Notes, Tasks, Calendar, Links, Calculator, Settings, search, and embeds
to feel like first-party system surfaces:

- consistent toolbars and field geometry;
- clear primary/destructive actions;
- restrained empty states;
- content density appropriate to each app;
- mobile sheets that are designed for touch rather than scaled desktop cards;
- no external site forced into an iframe; blocked embeds retain a safe,
  informative fallback.

## Implementation boundaries

- Prefer CSS-module and token changes. Preserve existing feature contracts and
  repository boundaries.
- Do not change database schema, widget registry ownership, or navigation
  semantics for visual work.
- Any behavior adjustment must be a directly related accessibility,
  responsive, or visual-state fix with a focused regression test.
- Do not add external services, auth, analytics, backend code, or V2/V3
  features.

## Verification plan

1. Run targeted unit tests for any behavior touched by the visual pass.
2. Use Playwright against the production preview to capture and inspect:
   Home, Dashboard, every mini-app, folders, search, Control Center, edit
   pickers, and embed fallback at 1440, 1280, 1024, 768, 430, 390, 375, 360,
   and 320px widths where applicable.
3. Repeat visual checks in light, dark, high-transparency, and reduced-effects
   modes.
4. Assert no horizontal overflow, no console/page errors, correct desktop
   windows versus mobile sheets, and usable focus/touch states.
5. Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`,
   and the full `npm run test:e2e` suite.

## Acceptance criteria

- The shell and every feature share the same Apple-inspired material, spacing,
  icon, and typography system.
- Desktop screenshots read as a coherent macOS-style workspace; mobile
  screenshots read as a coherent iOS-style launcher and sheet experience.
- All existing functional tests remain green, including CRUD/persistence,
  PWA/offline, reduced-effects, folders, widgets, and responsive coverage.
- No supplied reference asset is copied into the shipped product, and no
  WebGL/refraction dependency is introduced.
- The final branch contains only scoped changes plus this design record; the
  user-provided `assets/`, `liquidGL-main/`, and scratch files remain untouched.
