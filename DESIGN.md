# DESIGN.md — Hearth visual language ("Liquid Glass Lite")

Original, Apple-*inspired* — not an Apple clone. No proprietary Apple icons,
wallpapers, or branding. Calm, intentional, fast, premium.

## Foundations

- **Tone:** restrained by default; warmth via a single ember accent
  (`--accent`, `hsl(18 90% 58%)`). Backgrounds are wallpaper + translucent
  glass, never flat gray panels everywhere.
- **Liquid Glass Lite:** fine translucent surfaces with `backdrop-filter:
  blur()` + subtle `saturate`, hairline borders/highlights, soft layered
  shadows, depth via z-tokens. **Never** WebGL/refraction shaders in V1.
- **Glass is selective.** Use blur on the menu bar, dock, Control Center,
  windows/sheets, folders and floating controls. Do not glass-up everything.
- **Wallpaper-aware readability:** tiles keep a readable tint even over bright
  wallpapers; text uses ink tokens on glass fills that stay legible.

## Design tokens (styles/tokens.css — the single source)

- Color as channels (`rgb(var(--ink-1))`), alpha applied at use site.
- Surfaces: `--glass-1/2/3`, `--glass-a-1/2/3`; strokes: `--stroke-hairline`.
- Text: `--ink-1/2/3`. Accent + `--on-accent`.
- Radii `--r-*`, spacing `--sp-*`, type scale `--fs-*`, blur `--blur-*`,
  shadows `--shadow-*`, z scale `--z-*`, motion `--dur-*` / `--ease-*`.
- **Dark/light** come from `prefers-color-scheme` + explicit
  `data-theme`. Reduced Effects (`html[data-effects="reduced"]`) kills blur and
  raises opacity; `prefers-reduced-motion` kills durations globally.

## Type & rhythm

- System font stack (defined in tokens), `-0.022em` tracking for headings.
- Use the `--fs-*` scale; body ≥ `--fs-md` in most UI, never below 11px
  (`--fs-2xs` is the floor, labels/hints only).
- Consistent spacing from `--sp-*` (4px base). 4/8 rhythm, not random.

## Depth hierarchy (z-scale)

Dock < page content < edit affordances < sheets/windows < menu bar <
Control Center/search overlays < dialogs/folders < toasts. Respect `--z-*`.

## Motion

- CSS transitions/animations (transform/opacity) — fast and responsive.
- Durations from tokens; entrance via `motion.css` (`rise-in`, `pop-in`, …).
- iOS-style page slide + page-dot feedback for Home paging; dock hover
  magnify is subtle and transform-based. No slow cinematic sequences.
- Reduced motion: everything collapses to ~0 duration.

## Component guidance

- Buttons/inputs: pill-ish radii (`--r-pill`/`--r-md`), `--glass-3` wells,
  accent focus ring `0 0 0 3px rgb(var(--accent)/0.22)`.
- Icon tiles: `--app-tile` squircle (24% radius), tile accent colors come
  from data (`--tile-bg`), white glyph, letter-monogram fallback for no-icon
  links, favicon at low opacity when broken.
- Focus states are always visible (`:focus-visible` accent outline).
- Icon-only controls carry `aria-label`/`title`.

## Desktop vs mobile

- **Desktop (≥1024px):** menu bar top; mini-app windows float (open/focus/
  drag/close/maximize); grid on Home is a real wallpaper canvas with gaps.
- **Mobile (<1024px):** no floating windows — mini-apps are full-screen
  sheets with a back affordance; Home pages are a horizontal paged strip with
  swipe + dots; dock respects safe areas. **Intentionally designed mobile,
  never a squeezed desktop.**
- Tablet: panels/column layouts rather than tiny windows.

## Anti-patterns (avoid)

- Purple-blue SaaS gradients; endless card-in-card nesting; gratuitous glass;
  random gradients; tiny low-contrast text; inconsistent spacing; fake
  complexity for impressiveness; hover-only interactions on touch; horizontal
  overflow at any breakpoint.
