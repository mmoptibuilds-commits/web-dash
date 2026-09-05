# CLAUDE.md — Hearth (web dashboard V1)

**Hearth** is a local-first, installable PWA personal web OS: a macOS-inspired
desktop / iOS-inspired mobile start page. Two modes: **Home** (launcher pages,
dock, widgets) and **Dashboard** (Notes / Tasks / Calendar / Links mini-apps in
floating windows on desktop, sheets on mobile).

## Hard constraints (never violate)

- **No spend** — no paid APIs/SaaS/fonts/host.
- **Local-first** — persistence is IndexedDB via Dexie only. No backend,
  auth, SSR, queues, websockets, analytics, or server DB in V1.
- **No runtime AI** in the product.
- **Public-repo safe** — never commit secrets/keys/personal data.
- **V1 scope frozen** — no V2/V3 features (see ROADMAP). Do not add unneeded
  deps, abstractions, or "tiny hooks for later".
- **No fake completion** — run the app, screenshot, test reload persistence
  on desktop + mobile before claiming done.

## Commands

```sh
npm run dev        # vite dev server
npm run typecheck  # tsc -b
npm run lint       # eslint .
npm run test       # vitest run
npm run build      # tsc -b && vite build (PWA)
npm run check      # lint + typecheck + test + build
```

## Architectural invariants

- **Layering:** components → `features/*` + `components/*` → repositories
  (`data/repositories`, the only data-access path) → `db` (Dexie). Never call
  `db.` from a component; use repos + hooks.
- **State split:** persistent → Dexie; ephemeral/UI → Zustand (`state/ui.ts`);
  derived → derive. No second persistent store.
- **Domain types** (`types/domain.ts`) are the frozen shared contract. Keep
  shapes versioned + backward compatible.
- **Widgets** are a typed registry (`features/widgets/registry.tsx`,
  coordinator-owned) over stable `WidgetInstance` rows. Widgets render a
  self-contained glass panel that fills their tile; content uses CSS tokens.
- **Home layout** is an ordered grid — `LayoutItem.order` flows
  row-major; span derives from payload. No free x/y placement.
- **Design tokens** (`styles/tokens.css`) are the single source for color,
  spacing, radii, type, motion, z-index. Plain CSS + CSS modules; no Tailwind.
- Navigation to external sites is same-tab via `lib/run.ts` (URL detection) or
  `lib/nav.ts`. History suggestions use only local dashboard history.

## Ownership during parallel work

See AGENTS.md. In short: lanes own only their directory, one writer per
worktree; shared contract files (types, registry, repos, tokens, package
config) are coordinator-only.

## Pitfalls

- `jsdom` lacks `FileReader`/layout; test pure logic and repo behavior, not
  px geometry.
- Dexie `update()` wants `UpdateSpec`, not `Partial` — cast in crud helper.
- Don't navigate in tests that would destroy state; test URL *planning*
  (`lib/run.ts`) not the `location.assign`.
- PWA dev options are disabled; verify SW behavior from a production build.
