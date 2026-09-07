# Changelog

All notable changes to **Hearth** are recorded here. See [`README.md`](README.md), [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md), and [`docs/ROADMAP.md`](docs/ROADMAP.md).

The format follows Keep a Changelog conventions. Until a later tagged release, active work remains under `[Unreleased]`.

## [Unreleased]

### Changed — V1.11 repository preparation (2026-09-07)
- Established an explicit source-of-truth hierarchy: current code/tests and `docs/V2_STATUS.md` define implemented behavior; `DESIGN.md` + `docs/V1_11_WORK_HANDOFF.md` define the approved V1.11 visual target; the frozen V1 product spec/one-shot prompt are historical baseline documents.
- Added `docs/CURRENT_STATE.md` and a dedicated V1.11 Work/Codex/Claude handoff so future agents preserve the existing application rather than rebuilding from references.
- Superseded the old blanket "no WebGL/refraction" active design restriction. V1.11 may use `ybouane/liquidglass` selectively with CSS/solid fallbacks, Reduced Effects and performance safeguards. **No WebGL runtime implementation is claimed by this docs-only change.**
- Moved the reference-only root `assets/` tree intact to `design-references/assets/` and added `design-references/README.md`.
- Added the supplied `design-references/macos-liquidglass-motion-reference.html` for dock-motion, widget-proportion and material study, with explicit rules against copying its hand-drawn icons/hard-coded architecture wholesale.
- Documented the Figma app-icon frame `401:3` as the app-artwork reference and kept system/control glyphs as a separate visual system.
- Updated README, architecture, roadmap, build state, QA, active agent instructions and legacy handoff pointer for the current freeform/mobile/calculator-era codebase.

### Existing overhaul work
- V1 initial build completed: local-first PWA, Home/Dashboard modes, shortcuts/folders/dock/widgets/wallpapers, Notes/Tasks/Calendar/Links, search/navigation, backup and responsive desktop/mobile shell.
- Subsequent V2-era work added desktop freeform geometry/migration, improved mobile sheets/bounded embeds, Calculator + offline currency rates (Dexie v3), accessibility/performance/PWA hardening, Reduced Effects fixes, dock narrow-phone fixes and reference-led visual polish.
- Detailed chronological implementation/evidence remains in `docs/V2_STATUS.md`.

### Latest recorded verification before V1.11 prep
- `npm run check`: lint + typecheck + **126/126 Vitest tests** + PWA build passed.
- `npm run test:e2e`: **81 passed / 23 skipped / 0 failed** against the production build.

The 2026-09-07 repository-preparation change itself is documentation/reference-only and does not claim a fresh runtime-suite run.
