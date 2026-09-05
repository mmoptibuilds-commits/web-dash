# AGENTS.md — shared rules for coding agents on Hearth

Read **CLAUDE.md**, **DESIGN.md**, **docs/ARCHITECTURE.md** and the relevant
product sections in **docs/PRODUCT_SPEC.md** before writing code.

## Non-negotiables

1. **One writer per worktree.** You work only inside your assigned git
   worktree on your own branch. Never edit the coordinator checkout.
2. **Respect file ownership.** Your lane owns only the paths listed in your
   task. Everything else is read-only to you. If a shared/coordinator-owned
   file needs changing (types, widget registry, repositories, tokens, DB
   schema, package config, `state/ui.ts`, `hooks/data.ts`), do NOT edit it —
   report the proposed change to the coordinator instead.
3. **Run verification before handoff.** From your worktree, run at minimum:
   `npm run typecheck`, `npm run lint`, `npm run test` (your tests), and make
   sure you have not broken anything that already existed. Fix failures you
   caused; report pre-existing failures without touching them.
4. **Commit coherent work** on your lane branch with clear messages. Do not
   leave the worktree dirty at handoff.
5. **No secrets** anywhere. **No scope creep** — V1 only, no V2/V3 features.
6. **Do not fake it.** If you cannot fully implement a required piece, ship
   the rest, and report precisely what is missing/unverified.

## Feature content contract (the shape every mini-app feature must export)

A feature directory `src/features/<name>/` must expose from its `index`:

- `<Name>MiniApp` — full experience; must fill `100% × 100%` of its parent and
  manage its own scrolling. No outer window chrome/card — the shell supplies
  that. Desktop mini-windows and mobile sheets both render this.
- `<Name>Widget` (features that appear on Home) — compact widget for the
  registry; a `React.FC<WidgetComponentProps>` (see widget registry). Render a
  self-contained glass panel that fills the tile and looks right at the tile's
  size. Read `features/widgets/builtins/ClockWidget.tsx` +
  `SearchWidget.tsx` for the house recipe (CSS-module panel, tokens, empty
  state).
- Unit tests for core behavior, co-located under your directory
  (`src/**/*.test.ts(x)` is picked up by vitest).

Only add files under your owned directory. Do not register widgets in the
registry — the coordinator wires them in after your lane merges.

## Handoff report format

In your final message report: files created/changed, exact verification
commands + results, any coordinator-owned changes you need, and known
limitations. Keep it factual and terse.
