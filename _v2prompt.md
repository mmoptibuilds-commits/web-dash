# Hearth — Codex handoff prompt (gpt-5.6-sol via /context7-mcp)

You are continuing work on **Hearth** (`D:\web dash`, git branch `build/v1-one-shot`,
currently at commit `257b9fe` + `b035375` + a docs commit on top of `7b3802c`). It is a
local-first, installable PWA "personal web OS": a macOS-style desktop / iOS-style phone
dashboard. Home = launchers + widgets + dock in a freeform canvas (desktop) / compact
ordered grid (phone); Dashboard = Notes / Tasks / Calendar / Links mini-apps in floating
windows (desktop) / sheets (mobile), plus a Calculator app/widget.

Read these first (no guessing):
- `CLAUDE.md` — hard constraints + commands + architectural invariants (obey strictly).
- `docs/V2_STATUS.md` — the working ledger; §8 is the newest (Calculator milestone).
- `docs/ARCHITECTURE.md`, `docs/PRODUCT_SPEC.md`, `docs/QA_CHECKLIST.md`, `docs/ROADMAP.md`.

Stack: Vite + React 19 + TypeScript; **Dexie/IndexedDB only** for persistence (no backend,
auth, SSR, websockets, analytics); Zustand `state/ui.ts` for ephemeral UI; CSS modules +
`styles/tokens.css` design tokens (no Tailwind); lucide-react; dnd-kit; Vitest (jsdom);
Playwright against a **production build**. E2E must rebuild after any src change: run
`npm run build`, then `npx playwright test --project=desktop --project=mobile`.

Quality gates (never skip; do not claim done on compile/screenshot/unit alone):
`npm run check` (lint + typecheck + 126 unit + PWA build) then the full Playwright suite.
Current green baseline to preserve: **73 E2E passed / 23 skipped / 0 failed** desktop+mobile.

## Current state — already done and committed (do not redo)
1. **Calculator (#35–#37)** — `src/features/calculator/`: three-mode mini-app
   (Basic / Dates / Currency) + a Home widget sharing one pure engine (`calc.ts` reducer),
   month-end-safe age anchor (`age.ts`), USD-anchored offline currency
   (`currency.ts`); single-row Dexie rates store (DB v3) with transient-baseline read,
   "manual" stamp, Reset, backup/restore + validator. Typed app + widget wiring. E2E
   `e2e/calculator.spec.ts` calc.1–4. Ledger §8 written.
2. **Engineering-review pass (#38–#41)** — geometry/data backfill
   (`planFreeformGeometry` on import), Home interactions, dashboard/sheet fixes,
   Reduced-Effects solid-glass, dead-code removal. Committed with the gate.
3. **Full verification gate** — caught and fixed three real regressions (freeform
   resize-handle a11y → `data-testid="resize-handle"`; 7-app dock overflow ≤360px →
   shrink-to-fit; Reduced Effects zeroes `--blur-*` tokens at source, leaves
   `--glass-sat` alone so it owns no material override).

## Remaining work (small polish — pick up where §8's follow-ups and QA_CHECKLIST point)
- **Standing pointer-events audit** (ledger §0/§8): audit every `pointer-events:none`
  container (backdrop, windows, home, dock, settings) for popovers rendered inside
  without re-enabling `pointer-events:auto` — same bug class as the dock `.addPop` fix.
- **Hardening** (recommended): `e2e/pwa.spec.ts` test 15 (offline shell reload) flaked
  once under full-suite parallel load (green isolated and on rerun — not a regression).
  Make it robust: wait for `navigator.serviceWorker.ready` + controller on the active
  registration, then verify a precached asset resolves before going offline.
- **A11y confirmations** (from §32/§33 follow-ups): content hidden by container queries
  (Calendar weekday header under 240px) must be out of the a11y tree/focus order when
  hidden; the mobile sheet pull-handle's focus treatment should read as a control.
- **Optional, V1-scope-respecting** (only if cheap and clearly in spirit): Control Center
  quick toggles mirroring Glass / Reduced-effects; dock freeform handle/ring restyle for
  glass coherence; code-splitting the >500 kB chunk warning if it improves the perf budget.
- Anything QA_CHECKLIST.md or the a11y/perf/motion E2E specs surface as failing — fix at
  the root, never paper over. Add a discriminating regression E2E per real bug you fix.

## Guardrails
- Hard constraints: **no spend** (no paid APIs/SaaS/fonts/host), **local-first** (Dexie
  only, no backend/auth/SSR/websockets/analytics/server DB), **no runtime AI in the
  product**, **public-repo safe** (never commit secrets/keys/personal data).
- **Never stage/commit** these untracked scratch files: `_v2prompt.txt`, `issues.txt`,
  `liquidGL-main/`, `.shots/`. Stage intended source files explicitly.
- Use **Context7 MCP** (`resolve-library-id` → `query-docs`) for any library/framework/API
  detail you need to verify (React 19, Vite 8, Dexie 4, vite-plugin-pwa, lucide-react,
  dnd-kit, Playwright) rather than trusting training memory.
- Respect frozen V1/V2 scope boundaries in `docs/ROADMAP.md`; no feature creep, no new
  deps, no speculative abstractions.
- Finish by running `npm run check` and the full desktop+mobile Playwright suite on a
  fresh production build, verifying reload persistence on both, updating `docs/V2_STATUS.md`
  (newest-first sections), and committing logical commits ending with
  `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
