# V2 STATUS — Hearth overhaul ledger

Working ledger for the V2 "macOS/iOS-quality dashboard" overhaul. One section
per completed workstream, most recent first. The authoritative plan is the
task list; this file records what changed, evidence, and open follow-ups.

Branch: `build/v1-one-shot` (V2 continues on top of the V1 one-shot build).

## 2 — Design tokens + typography + icon + surface normalization (done)

Centralized the surface language and removed the "AI-generated" look via
restraint. New recipes live in `styles/tokens.css` (single source of truth);
component CSS-module files consume them instead of hand-rolled literals.

### What changed
- **Token recipes added** (`styles/tokens.css`): `--r-squircle: 24%`,
  `--tracking-wide: 0.05em`, full `--fw-*` weight scale
  (medium/semibold/bold), control heights `--ctrl-h-sm/-/lg` + `--field-h`,
  `--touch-min`, `--stroke-alpha-3`, `--glass-a-elev`, `--wallpaper-fallback`,
  `--overlay`, `--badge-dark`/`--badge-dark-alpha`, plus composable shadow /
  focus recipes `--shadow-accent`, `--shadow-glyph`, `--focus-ring`.
- **Typography normalized** — all `font-weight` literals off the declared scale
  (520/540/550/560/580/620/640/650/680/720…) remapped to the nearest token face
  (ties → lighter); literal `letter-spacing: 0.05em` → `--tracking-wide`;
  `font-size` edge literals (10px) → scale token. Swept across bookmarks,
  search, builtins, menubar, dock, Modal, calendar, dashboard, settings, notes,
  tasks, home, Glyph.
- **Icons through lucide-react only** — migrated the 3 residual unicode glyphs
  (Control-Center row chevron `›`, Pages reorder `↑`/`↓`) to
  `<ChevronRight/>` / `<ArrowUp/>` / `<ArrowDown/>` so every icon shares the
  consistent 24-grid geometry. No new "shared Icon component" abstraction was
  added (V1 scope forbids it) — lucide already provides the single geometry.
- **Surface normalization** — restrained radius hierarchy (squircle folders use
  `--r-squircle`, no new pill/radius literals); borders/separators preferred
  over heavy shadows (`--stroke-*` tokens); backdrop glass centralized with
  `saturate(var(--glass-sat, N))` on BOTH `-webkit-backdrop-filter` and
  `backdrop-filter` lines so #29's single appearance slider can drive every
  glass surface; delete/edit chips + edit-mode folder overlay repainted from
  hard black to `rgb(var(--badge-dark)/…)` and `rgb(var(--overlay)/…)`;
  `::global(...)` typos corrected to `:global(...)`.
- **Fixed a latent accent-color composition bug (visual, app-wide)** — accent
  alpha surfaces were composed `rgb(var(--accent)/α)`, which is **invalid at
  computed-value time** (declaration dropped → transparent) or, in the
  h-s-l-in-rgb form, **rendered teal**. All 17 sites across 8 files now compose
  `hsl(var(--accent-h) var(--accent-s) var(--accent-l)/α)`. This restored every
  accent-soft background, focus ring, guide line and segmented-control "on"
  border that silently never rendered (and removed ~6 teal accents). Verified
  empirically in Chromium; recipe documented in project memory.

### Evidence
- `npm run check` green (lint + typecheck + unit tests + production build).
- Functional E2E: **41 passed / 7 skipped / 0 failed** (desktop + mobile).
- 13-viewport capture to `.shots/v2-tokens/` (26 screenshots, Home + edit-mode
  add-to-dock, 1920→320 × desktop+mobile): **0 console errors, overflowX = 0
  everywhere**. Pixel-level review not possible in this harness (Read cannot
  render images on this model) — geometry asserted programmatically instead.
- Consistency greps clean: no off-scale `font-weight`, no literal
  `saturate(N)`, no `rgb(var(--accent`, no `::global(`, no literal
  `letter-spacing: 0.0X` across `src/`.

### Follow-ups
- **Appearance/glass presets (§29)** builds on this: one `--glass-sat` /
  `--glass-blur` variable driven by a user setting, with live preview in
  Settings, now that every surface reads `var(--glass-sat)`.
- **Wallpaper contrast (#31 safe areas / #29)** — `--wallpaper-fallback` added
  so an empty/errored wallpaper keeps text legible; confirm on mobile.

## 1 — Freeform widget canvas (done)

### What changed
Desktop (≥1024px) Home items are now true freeform: each `LayoutItem` may carry
`x/y/w/h/z` px geometry, tiles are placed absolutely with free overlap and
bring-to-front on drag engage — no neighbour auto-reflow, so moving one tile
never pushes another. The compact ordered grid (<1024px) still uses `order`
only and never rewrites desktop geometry, so **per-breakpoint layouts are
independent**: desktop overlaps and placements cannot corrupt the phone layout
and vice versa.

- **`src/data/layout/geometry.ts`** (pure, unit-tested) — canonical constants
  (6-col 1120px canvas, 190px column / 130px row pitch, 8px snap, per-kind
  minimum box), `freeBoxForKind`, `itemBox`, `findFreeSpot`, deterministic
  `assignDefaultGeometry`, `clampBoxX`, `resolveMove` (edge/centre/top/middle/
  bottom guide alignment within `GUIDE_TOL`, else grid snap), `resolveResize`
  (min + snap + clamp).
- **DB v2 + `src/data/migrations/v2Freeform.ts`** — backfills geometry for
  pre-existing rows by packing `order` into the canonical grid, mirroring the
  V1 layout so nothing visibly jumps on upgrade.
- **`layout` repository** — `addItemToPage` stamps geometry (size-aware
  canonical box at the first free spot, next z); new `setItemBox` persists
  drags/resizes/presets/nudges. Dead remove helper deleted.
- **`HomeMode` rewrite** — shared content builder; grid branch unchanged; new
  freeform branch renders `FreeTile` wrappers (group + label + conditional
  focus, free ring in Edit Mode, Remove button, S/M/L preset chips that resize
  BOTH the freeform box and the widget instance size, bottom-right resize
  handle). Pointer move/resize with autoscroll + post-drag click suppression,
  keyboard nudge (1px fine / 8px Shift / Alt+resize), guide overlay lines,
  canvas width from a ResizeObserver.
- **`home.module.css`** — freeform surfaces (canvas/tile/ring/handle), guide
  lines, focus ring styles.

### Evidence
- `geometry.test.ts`: 22 unit tests (snap, free-spot packing, guide resolution,
  min/clamp) — full suite 72 green.
- `e2e/freeform.spec.ts` (desktop): drag-resize grows a tile + persists after
  reload; Size-Large preset widens Search 360px→740px + persists; Shift-nudge
  moves a tile exactly 8px and a plain arrow exactly 1px, both persisting.
- `e2e/home.spec.ts` #7 rewritten for freeform (full-overlap drag, z on top,
  reload + viewport round-trip non-corruption) + new mobile-only compact
  reorder test. Full suite green desktop + mobile; typecheck/lint clean.

### Follow-ups
- **Pointer-events bug sweep** (from §0): audit every `pointer-events:none`
  container for popovers that render inside it without re-enabling events.
  Freeform added several absolutely-positioned overlays (ring, chips, resize
  handle, guide lines) — confirm none sit under a `pointer-events:none` strip.
- **Dock/desktop chrome (§30)** may restyle freeform handles/rings for visual
  coherence once the glass token set lands.

## 0 — Baseline + reported Add bug (done)

### Baseline (recorded before any V2 change)
- 13 viewports × 2 states captured pre-fix in `.shots/v2-baseline/` and
  post-fix in `.shots/v2-after/` (`1920/1440/1366/1280/1024/834/768/430/393/
  390/375/360/320` × Home + Edit-Mode Add-to-dock). Sweep also asserts no
  horizontal overflow and no console/page errors: **overflowX=0 everywhere,
  0 console errors** on both runs.
- Captured with `e2e/baseline.spec.ts` (`BASELINE_OUT` selects the dir). It is
  a capture tool, not an assertion suite.

### Reported bug — reproduced & root-caused
**Symptom:** "Entering Edit Mode, pressing Add — UI appears but nothing inside
is clickable, and clicking dismisses the screen."
**Reproduction (Playwright, pre-fix):** every other Add surface (Shortcut /
Folder / Widget pickers) works; the Edit-Mode **dock "Add to dock"** popover is
broken on desktop *and* mobile. `document.elementsFromPoint()` at the centre of
a candidate row returned the **Home `.page` section**, not the row; computed
`pointer-events` of `.addPop` and its rows was **`none`**.
**Root cause:** `src/components/shell/dock.module.css` sets `.dock {
pointer-events: none }` so the wide fixed strip never blocks the page, and only
`.bar` re-enables `pointer-events: auto`. The `.addPop` popover floats above
the page too but never opted back in, so it and its rows inherited `none`:
painted but inert. Every click fell through to the page beneath and the
document outside-close handler then dismissed the popover.
**Fix:** `pointer-events: auto` on `.addPop` (with a comment explaining the
opt-in pattern).
**Regression test:** `e2e/dock-edit.spec.ts` — enters Edit Mode, opens
Add-to-dock, clicks a candidate row, asserts the item is pinned, the popover
closed itself, Edit Mode is intact, and the pin survives reload. Fails pre-fix
(row click can never land), passes post-fix on desktop + mobile.

### Follow-ups opened
- **A11y (a11y sweep):** in Edit Mode dnd-kit spreads `role="button"` +
  listeners onto each dock tile's *wrapper div*, whose accessible name
  duplicates the real launcher `<button>`'s label — redundant interactive
  element per tile for assistive tech. **FIXED** (commit after e1e40d6): drag
  attributes/listeners now live on the launcher button, the sole interactive
  element per tile; the unpin/indicator never collide with a drag.
- **Pattern sweep (bug sweep):** audit other `pointer-events:none` containers
  (backdrop, windows, home, bookmarks, settings, builtins) for popovers that
  render inside them without re-enabling pointer events — same bug class.
