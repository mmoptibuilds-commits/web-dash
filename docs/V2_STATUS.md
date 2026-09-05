# V2 STATUS — Hearth overhaul ledger

Working ledger for the V2 "macOS/iOS-quality dashboard" overhaul. One section
per completed workstream, most recent first. The authoritative plan is the
task list; this file records what changed, evidence, and open follow-ups.

Branch: `build/v1-one-shot` (V2 continues on top of the V1 one-shot build).

## 9 — PWA/offline and interaction accessibility hardening (done)

Closed the remaining §8 follow-ups with evidence-bound browser checks. The
pointer-events sweep found no additional live-surface defects: every
`pointer-events: none` declaration is an inert overlay, a deliberately hidden
control, or a container whose interactive descendants explicitly opt back in.

### What changed
- **PWA offline proof — `e2e/pwa.spec.ts`** — worker checks now wait on
  `navigator.serviceWorker.ready`, require an activated registration and page
  controller, then confirm a same-origin Vite asset is present in CacheStorage
  and resolves online before the network is disabled for the reload assertion.
- **Hidden Calendar content — `e2e/responsive.spec.ts`** — the compact Calendar
  widget check now confirms the container-query-hidden weekday row has
  `aria-hidden="true"`, computed `display: none`, and no focusable descendants.
- **Mobile sheet handle — `e2e/mobile-sheet.spec.ts`** — keyboard modality now
  verifies the grab handle's accessible close label, focus state, and visible
  accent replacement ring before the equivalent tap dismissal.
- **Sheet scroll containment — `src/features/dashboard/dashboard.module.css`** —
  the fixed mobile sheet contains overscroll so pull-to-dismiss and inner app
  scrolling do not chain into the underlying Dashboard page.

### Evidence
- `npm run check` — lint, typecheck, **126/126 Vitest tests**, and PWA build
  pass.
- `npm run build` — production bundle generated with 16 precache entries.
- `npx playwright test --project=desktop --project=mobile` — **73 passed / 23
  skipped / 0 failed** against a fresh production build.
- `agent-browser` was unavailable on this host; the repository's Playwright
  preview runner provided the browser verification path instead.

### Follow-ups
- Human acceptance remains the saved screenshot sweep and the two visual states
  listed in `docs/QA_CHECKLIST.md`.

## 8 — Calculator mini-app + widget, engineering-review pass, and the verification gate (done)

A three-mode Calculator (Basic / Dates / Currency) as a dock app in a desktop
window / mobile sheet **and** a Home widget that shares the same engine; the
Currency mode converts offline against a user-editable, locally persisted rate
table. This section also logs the #38–#41 engineering-review pass over the
whole V2 and the final full-suite verification gate that shipped it.

### What changed
- **Calculator feature (`src/features/calculator/`)** — a dock app
  (`CalculatorMiniApp`) and a Home widget (`CalculatorWidget`, a compact
  keypad with an "Open Calculator" footer that launches the full app). Three
  mode tabs (Basic / Dates / Currency) stay mounted so switching never loses an
  in-progress entry. Both surfaces share pure, React-free engines, fully unit
  tested:
  - **`calc.ts`** — immediate-execution basic arithmetic (left to right, no
    precedence — `2 + 3 × 4 = 20`, like iOS): operator chaining/replacement,
    contextual `%` (`100 + 10 % = 110`), divide-by-zero → an `Error` sentinel
    that any digit clears. A single reducer drives the app and the widget, so
    behaviour is identical and tested once.
  - **`age.ts`** — age between two calendar dates as whole years/months/days
    via the "anchor" method (step whole years, then whole months, then days),
    UTC-midnight so it is timezone-free, month lengths clamped from the
    **original** birth day-of-month at every boundary (a 29-Feb birthday lands
    on 28-Feb in a non-leap year; a Jan-31 birthday never drifts to the 28th
    across a short month). Also exact total days, "X years" (÷365.2425), and a
    next-birthday countdown.
  - **`currency.ts`** — USD-anchored conversion (`amount × rate(to) /
    rate(from)`), code-shipped baseline for 12 currencies with human names.
- **Offline, user-editable rates** — `src/data/repositories/currencyRates.ts`
  over a single-row Dexie store (`currencyRates`, id `default`) added as **DB
  v3**. `get` only reads and returns a transient baseline when no row exists
  yet (safe from a live query); Save persists and stamps `editedAt` so the UI
  can show a "manual" chip; Reset restores the shipped baseline. The first
  manual edit creates the real row; seed ships the baseline from first boot.
  Rates are wired into the Settings export/restore model (`backup.ts`) with a
  row validator (id `default`, base pinned to `USD`, 3-letter codes, positive
  finite rates).
- **Wiring** — `calculator` registered as a typed dock app
  (`components/shell/appContent.tsx`) and a coordinator-owned typed widget in
  `features/widgets/registry.tsx`; domain `CurrencyRates` type; seed adds the
  Calculator launcher (7 dock apps) and the widget surface.
- **Engineering-review pass (#38–#41)** folded into this gate — geometry + data
  layer (backup backfill of freeform geometry for imported V1 rows via a shared
  `planFreeformGeometry` packer, resize anchor, `MIN_BOX`, size-aware
  `addItemToPage`, Alt+arrow lattice, freeform gate); Home interactions (page
  rename revert, drag threshold, chip drag, pointer-only resize-handle keyboard
  model, destructive-action focus); dashboard/sheet (openMobile window wipe,
  minimize focus, sheet pull animation, notes back button, MobileSheet focus);
  theme/glass/dead-code (Reduced Effects solidifies glass **and** drops the
  backdrop, broader glass fallback, dead setting removed).
- **Gate regressions the full suite caught (all fixed)** — (1) the freeform
  resize handle became pointer-only/aria-hidden (#39), so E2E retargets it by
  `data-testid=resize-handle` (keyboard resize = Alt+Arrows on the focused
  tile); (2) adding the Calculator to the dock (7 apps) overflowed 360px, so
  the dock bar now shrink-to-fits (flex-basis + min-width) with every tile
  inside the viewport; (3) Reduced Effects zeroes the `--blur-*` tokens at the
  source (the build minifier can drop an unprefixed `backdrop-filter:none`
  sweep, and Blink honours the standard spelling over the `-webkit-` alias),
  while `--glass-sat` is deliberately untouched — Reduced Effects owns no
  material override.

### Evidence
- Unit: **126 passed / 18 files** — the 48 Calculator tests (23 calc engine,
  12 age, 7 currency, 4 mini-app, 2 widget) plus the geometry/data review
  tests.
- `e2e/calculator.spec.ts` (calc.1–calc.4, both projects): the widget solves a
  sum and opens the full app; app arithmetic + clear + `Error` recovery; the
  age anchor (2023-01-31 → 2023-04-30 is exactly 3 months, 0 days — a
  regression test for the fresh-clamp month-end fix); currency baseline
  (100 USD → 92 EUR), an edit to parity persists across reload and shows
  "manual", and Reset restores 92.
- Full E2E on a fresh production build, desktop + mobile: **73 passed / 23
  skipped / 0 failed** (the +8 over §7 are calc.1–4 × two projects). One
  pwa.spec offline-reload flake observed once under parallel load reproduced
  green in isolation and on rerun — not a regression.
- `npm run lint` / `npm run typecheck` clean.

## 7 — A11y + motion + performance sweep (done)

Keyboard/focus/semantics (axe-free programmatic), reduced-motion &
reduced-effects, and a lean-bundle/clean-runtime performance pass — plus one
real WCAG 2.4.3 defect found and fixed in the shared modal.

### What changed
- **Modal focus-restore defect (WCAG 2.4.3) — `src/components/common/Modal.tsx`**.
  A dialog whose first control carries native `autoFocus` (ConfirmDialog's
  Confirm button, the Add-shortcut Name field) claims focus during React's
  commit — **before** a passive effect can read `document.activeElement` — so an
  effect-time capture read the dialog's own control. Restoring to it no-ops once
  it disconnects on close, stranding focus on `<body>`. The opener is now
  snapshotted during the render that opens the dialog (pre-commit) via React's
  "adjusting state when a prop changes" pattern (a `useState` transition guard,
  not a render-phase ref write, so the `react-hooks/refs` / `purity` rules stay
  satisfied). Verified discriminating: against a true pre-fix rebuild of dist
  the new test **fails** (focus stranded); with the fix it passes.
- **`e2e/a11y.spec.ts`** (new, desktop project):
  - **33a** — a 24-press Tab sweep over Home; every keyboard-focused control
    must show a real focus treatment (the global 2px `--accent` outline or the
    dock's `0 0 0 3px` `--focus-ring` shadow), text-entry fields exempt as
    "visible via caret"; asserts ≥ 3 distinct controls reached.
  - **33b** — the WAI-ARIA dialog contract on the Add-widget picker: focus moves
    into the card on open, 12 Tabs + a Shift+Tab never escape it (trapTab),
    Escape closes and returns focus to the keyboard-activated opener.
  - **33d** — the regression above: Escape returns focus to the opener even when
    the dialog autofocuses its Name field (would strand focus on `<body>`).
  - **33c** — a semantic scan over Home boot, the opened modal, and the
    Dashboard overview: no unnamed interactive control, no focusable under
    `aria-hidden`, no duplicate ids; the modal carries `aria-modal` +
    `aria-labelledby` resolving to its title.
- **`e2e/motion.spec.ts`** (new, desktop-asserted; 33.3 samples the Notes pulse
  on both projects):
  - **33.1** — OS `prefers-reduced-motion` collapses `--dur-fast` to ~1ms and
    time-squashes the modal's `pop-in` (duration ≤ 6ms) while keeping the name.
  - **33.2** — the in-app "Reduced effects" switch sets `data-effects=reduced` +
    `data-glass=off`, pins glass alphas (0.9/0.88) solid, zeroes `--blur-md`,
    squashes the real Add-shortcut card to a single ≤6ms iteration with
    `blur(0px)`, and is reversible back to the default tokens.
  - **33.3** — at rest no element runs an infinite animation on either project;
    while a Notes autosave is pending the single deliberate `.savingDot` pulse is
    the only one and runs on `--dur-slow` (≥ 300ms); under OS reduce it is
    squashed to a single ≤6ms iteration.
- **`e2e/perf.spec.ts`** (new, desktop project) — Resource-Timing budget
  (largest JS < 560 kB, total JS < 620 kB, ≤ 8 JS assets, CSS < 120 kB) and a
  scripted Home → Notes → Settings → Dashboard journey wired to
  console/pageerror/ResizeObserver listeners before boot, asserting zero errors.

### Evidence
- `npm run check` green (lint + typecheck + 75 unit tests + production build).
- Full E2E suite green on a fresh production build: **65 passed / 23 skipped /
  0 failed** desktop + mobile (the +9/+9 over §6 are the new a11y 4, motion 3
  and perf 2 tests, each with its mobile skip counterpart).

### Follow-ups
- **E2E expansion + reviews (#34)** — cross-lens review of the whole overhaul,
  adversarial verification, and the final verification gates before the release
  commit.

## 6 — Full responsiveness + widget container-query + per-breakpoint persistence (done)

Locked down the three responsiveness pillars with a programmatic guarantee each:
the shell never overflows or cuts content at any width, a widget adapts to its
**tile** width (not the window), and desktop freeform geometry and the compact
phone grid stay independent.

### What changed
- **One source edit** — the Calendar widget's weekday header row now carries
  `data-testid="calendar-weekdays"`, making the container-query boundary
  assertable.
- **`e2e/responsive.spec.ts` restored + extended** (the Phase-5 width sweep had
  been deleted from the working tree; restored verbatim from HEAD so its shell
  coverage survives, then extended):
  - **32a** — a *data-rich* Home (Notes + Calendar widgets added in edit mode)
    is swept across 320/390/430/768/1024/1200/1440. At each width the document
    must not require horizontal scroll, and a purpose-built defect scan walks
    every `[data-page-id]` element with `overflow-x: hidden|clip` and fails if
    any in-flow block child extends past its clip edge (a tile row/grid that
    got cut). Text-ellipsis truncation and fixed full-viewport layers are
    filtered as benign, so only real cut content trips it.
  - **32b (desktop, freeform)** — Calendar lands at its Medium canonical box
    (> 240px) and the weekday row is visible; dragging the resize handle down
    to the tile minimum (< 240px) hides the row **while the 1440px window
    never changes**, proving the `.panel` `container-type: inline-size` query
    fires off tile width, not viewport width; the Size Large preset (> 600px)
    brings the row back.
  - **32c (mobile, compact grid)** — on the 390px phone grid a Medium Calendar
    spans 2 of the 4 columns (~169px < 240) and the weekday row is hidden;
    Size Large spans the full row (> 300px) and it returns — the same
    container query drives compact-grid tiles on a touch surface.
- **Per-breakpoint independence** (unchanged structurally, now re-asserted) —
  `home.spec` #7 covers freeform full-overlap drag + z-order + reload/viewport
  round-trip non-corruption; the mobile-only compact reorder test covers the
  phone grid. The layout invariant guarantees it: compact order writes only
  `order`, freeform only `x/y/w/h/z`; the two never touch.
- **Hardened `pwa.spec` 15** (offline reload, previously flaky only under
  suite load) — after the online reload it now waits for
  `navigator.serviceWorker.controller` before cutting the network, so the
  offline reload is guaranteed to be served from the precache instead of
  racing the worker's first client handoff.

### Evidence
- `npm run check` green (lint + typecheck + 75 unit tests + production build).
- Full E2E suite green on a fresh production build: **56 passed / 14 skipped /
  0 failed** desktop + mobile — the once-flaky offline-reload test passes and
  no longer flakes; the three #32 tests account for the +3/+3 over §5.

### Follow-ups
- **A11y sweep (#33)** — confirm container-query-hidden content (the weekday
  row is `aria-hidden`, so inert to screen readers) has no visible-focus or
  tab-order counterpart, then run the keyboard/semantics/motion pass.

## 5 — iOS-like phone interaction model + safe areas (done)

The phone already rendered Dashboard mini-apps as bottom sheets; this workstream
gave them the real iOS gesture language and made the mobile surface respect
safe areas and touch-target sizes.

### What changed
- **Grab-handle pull-to-dismiss on Dashboard sheets** (`DashboardMode.tsx`,
  `dashboard.module.css`) — every `MobileSheet` now has a grab handle across its
  top. Pull it down and the sheet follows the pointer (transform with the
  transition removed mid-drag; `touch-action:none` so the page can't scroll
  instead); release short of the threshold and it springs back on the sheet's
  own transform transition; pull past 96px — rubber-banded beyond 40% of the
  viewport so a fling can't fly off-screen — and it dismisses. Tap the handle,
  Back, or Escape dismiss it too, so the gesture is a bonus, never the only
  path. Escape is ignored while a text field inside the sheet is being edited.
- **Focus management** — opening a sheet moves focus to the grab handle and
  closing returns it to the opener (the dock tile / app card that the
  full-screen sheet covers), so keyboard and assistive-tech users never land on
  a hidden element.
- **Safe areas** — `.sheetBody` now pads its bottom by `--safe-bottom`, keeping
  the last row clear of the iOS home indicator in standalone/PWA mode (the
  `.sheet` top already cleared the menu bar + `--safe-top`).
- **Home mobile touch targets** (`home.module.css`) — the Home paging
  `navBtn` dots grew the same invisible 5px hit-area recipe as folder dots and
  resize chips, and under `@media (hover:none)` the Edit-Mode toolbar buttons —
  the phone's Add-shortcut/folder/widget surface, floating above the dock — now
  meet `--touch-min` height.
- **New E2E** `e2e/mobile-sheet.spec.ts` (mobile project): 31a tap-handle and
  Back both close the sheet to the overview; 31b Escape closes it, a 44px pull
  springs back (sheet stays), a 180px pull dismisses it. Drags are dispatched
  as synthetic trusted `PointerEvent`s on the handle, so the whole gesture path
  is asserted without pixel vision.

### Evidence
- `npm run check` green (lint + typecheck + 75 unit tests + production build).
- Full E2E suite green on a production build: **53 passed / 11 skipped / 0
  failed** desktop + mobile (the two new sheet tests run mobile-only; two
  desktop-project skips added). One mid-gate run flaked at `pwa.spec` 15
  (offline reload serves the cached shell) purely under suite load — it passes
  in isolation and in the clean re-run, and the #31 changes to that path are
  CSS-only.

### Follow-ups
- **A11y sweep (#33)** — confirm the sheet handle's focus ring reads as a
  visible affordance for keyboard users and that Escape-from-sheet focus
  restoration is covered by an axe/keyboard pass.

## 4 — Desktop shell + dock macOS coherence + continuous Transparency (done)

Closed the macOS-coherence loop on the desktop shell and made translucency a
continuous user setting instead of three discrete presets. The dock, floating
windows and Control Center now share one token-driven switch/geometry/motion
language, and glass fill opacity is a live slider that composes with the Glass
preset (§3, now blur + saturation only).

### What changed
- **Window chrome (macOS traffic lights)** — `WindowsHost` gains the yellow
  **minimize** light between close (red) and zoom (green); the three dots now
  match the existing 54px `.titleSpacer`, so titles stay centered. State: new
  `WindowState.minimized` + `minimizeApp` action (drops the window off
  `focusOrder` → not rendered) while the dock tile keeps its running dot;
  clicking the tile restores. CSS (`windows.module.css`): colours/tokenized
  `--traffic-*`, windows surface `--glass-1` (its documented elevation) at
  `--glass-a-2`, inactive windows dim (grayscale traffic lights + dulled title
  via `:not([data-front])`), `.dot` glyph reveals on hover and on a neutral
  focus halo, heights/weights tokenized.
- **Dock polish** — running `.indicator` is now absolute + out of flow
  (bottom band of the bar) so it no longer inflates the bar above `--dock-h`;
  glyph/unpin/mono ink uses `rgb(var(--glyph-ink))` + `--shadow-glyph-text`;
  squircle radius tokenized; `.tile:hover` uses the `--move-1` token and tiles
  get a real `:focus-visible` ring; "Add to dock" chip separates **hover**
  (neutral fill + `--accent-line` edge) from **open** (`--accent-soft` fill +
  solid accent edge); its popover plays `anim-rise` and **returns focus** to the
  `+` trigger when dismissed by Escape/rows/an outside click on a non-focusable
  spot.
- **Control Center chrome + motion** — entrance rises from the top-right
  (`transform-origin: top right`); dismissal plays a mirrored reverse rise and
  unmounts on `animationend` (Escape is consumed so the app-wide handler can't
  cut it short); Reduce-motion switch now uses the shared token geometry
  (`--switch-w/-h/-knob`) as `.ctrlSwitch/.ctrlKnob`; theme segmented control
  matches the menu-bar Mode switch well geometry; row icon wells unified to 32px
  with the dock's; brand dot highlight computed from `--accent-l` instead of a
  literal lightness.
- **Continuous Transparency setting** — new persisted `AppSettings.glassTranslucency`
  (0..1, default 0.5 = tuned baseline). `applyThemeAttributes` now takes it and
  writes the four `--glass-a-*` tokens inline by scaling the *computed* CSS base
  per theme (`1 + (0.5 − t) × 0.9`, clamped 0.32…0.96); **no number is
  duplicated in code**, and at the 0.5 baseline nothing is written so CSS owns
  the tuned default (zero drift for existing users). Glass presets dropped their
  fill-alpha overrides to own blur + saturation only, so preset + slider compose.
  Reduced Effects clears the inline alphas and its CSS block pins solid fills.
  UI: a `Transparency` range slider (0–100%) inside the Glass setting with a
  live value readout; every surface (including the in-panel sample) re-glasses
  live because all read `--glass-a-*`.
- **Token/`src/styles` cleanups** — `--titlebar-h`, `--switch-*`, `--traffic-*`,
  `--glyph-ink`, `--shadow-glyph-text`, `--accent-line` tokens added; settings +
  Control Center switches share one recipe; dead `dock-hover` keyframes removed;
  `global.css` accent-soft / focus-ring literals replaced with tokens; `Glyph`
  mono ink tokenized; MenuBar Search/Control-Center invokers now use
  `aria-haspopup="dialog"` + `aria-expanded` (not a toggled `aria-pressed`).

### Evidence
- `npm run check` green (lint + typecheck + 75 unit tests incl. new
  `glassTranslucency` default/backfill/persist asserts + production build).
- E2E full suite green after two latent bugs surfaced by the new asserts were
  fixed (see below): **51 passed / 9 skipped / 0 failed** desktop + mobile.
- `glass.spec` 29c (Transparency slider: baseline writes no inline alpha →
  Home/End extremes scale it, persists across reload, Reduced Effects pins it
  solid); new `e2e/windows.spec.ts` (minimize → dock restore; front-most chrome
  + close ordering).

### Latent bugs the new E2E caught (both fixed)
- **ThemeSync boot race** — the session theme effect applied on mount *before*
  the Dexie settings row loaded, so a persisted non-default Translucency was
  wiped back to the 0.5 baseline a frame later (a flash of the wrong opacity).
  `ThemeSync` now no-ops until `settings` is truthy; `main.tsx` keeps the
  pre-paint inline write.
- **Reduced-effects specificity** — `html[data-effects='reduced']` (0,1,1) lost
  the cascade to `:root[data-theme='light'|'dark']` (0,2,0), so Reduce Motion &
  Blur's near-solid fills (0.9/0.88/0.85) silently never applied — only the
  blur was actually being zeroed. Both blocks now select `:root[data-effects='reduced']` (0,2,0, later source order).

### Follow-ups
- **A11y sweep (#33)** — revisit the CC Theme segmented control's `aria-pressed`
  (mutually-exclusive group) and pill-vs-segment grammar across Home/Settings.
- **Control Center quick toggles (#30/§33)** — mirror Glass/Reduced-effects in CC.

## 3 — Appearance/Glass presets with live preview (done)

A user-facing translucency setting that re-glasses the whole shell at once,
built directly on §2's centralized material tokens.

### What changed
- **New domain field `AppSettings.glass: GlassPreset`** (`subtle | standard |
  vibrant`, default `standard`). `getSettings()` now merges persisted rows over
  the defaults, so a settings row written by an older build (which predates
  `glass`) still resolves it — backward compatible, no DB version bump.
- **`src/styles/tokens.css` `:root[data-glass]` preset blocks** — `subtle`
  (sat 1.2, tighter blur, higher fill opacity → calm/crisp) and `vibrant`
  (sat 2, wider blur, lower fill opacity → deep colour) restyle the shared
  `--glass-sat`/`--blur-*`/`--glass-a-*` tokens uniformly, so every surface
  that reads them re-glasses simultaneously. `standard` needs no block. The
  blocks sit *before* the reduced-effects rules so `data-effects='reduced'`
  always wins when both are present.
- **`src/app/theme.ts`** — `applyThemeAttributes` now also sets `data-glass`.
  The attribute reflects what is *rendered*: `'off'` while Reduced Effects is
  on (that mode replaces glass with a solid surface), else the chosen preset.
  Wired through the pre-paint apply (`main.tsx`) and the session `ThemeSync`
  (`App.tsx`).
- **Settings → Appearance → Glass** — a `GlassSetting` control: three preset
  chips plus a **live sample panel** (`settings.module.css`) that is a real
  translucent tile over a colourful gradient, reading the same material tokens
  so the pick re-styles it in place. Because the settings window, dock, menu
  bar and any windows behind it read the same tokens, the whole surface
  re-glasses live as you pick.
- **Backup validator** tolerates `glass` (checked only when present) so v1-era
  backups still import; new exports carry it.
- **`e2e/glass.spec.ts`** — 29a: preset applies `html[data-glass]` + material
  tokens live, persists across reload, stays checked. 29b: Reduced Effects →
  `data-glass="off"` + `data-effects="reduced"` (no material override), and
  turning it back off restores the stored preset. Desktop + mobile.

### Evidence
- `npm run typecheck` / `eslint` clean; settings unit suite green (6 tests,
  incl. new "legacy row backfills `glass`" and "persists a glass preset").
- `npm run build` succeeds. E2E `glass.spec` + `settings.spec` regression:
  **9 passed / 1 skipped / 0 failed** across desktop + mobile.

### Follow-ups
- **Control Center (§30/§33)** could host a quick Glass/Reduced-effects toggle
  mirroring Settings — currently Settings-only by design.

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
