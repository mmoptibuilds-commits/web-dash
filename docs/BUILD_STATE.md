# BUILD_STATE — Hearth V1 one-shot build

**Last updated:** 2026-09-05 · **Branch:** `build/v1-one-shot`
**Session goal:** complete + verify the full V1 per the authoritative one-shot
spec (`Web-dashboard-One-Shot-Claude-Code-Prompt.md`).

## Current phase
Phase 1 (foundation) nearing commit: shared substrate + doc contracts done;
fan-out to feature lanes next, then shell/Home/Dashboard integration.

## Completed milestones
- Phase 0: repo inspected; orchestrator branch `build/v1-one-shot` created;
  git identity verified (existing local identity, nothing written); no secrets.
- Phase 1 substrate committed (`2c28da0`): package/config (Vite 8, React 19,
  TS ~5.9.3 pinned, Vitest 5, Dexie 4, Zustand 5, dnd-kit, lucide,
  vite-plugin-pwa, workbox), design tokens + global/glass/motion CSS,
  frozen domain/app/widget types, Dexie schema (11 tables, v1) + 11
  repositories + barrel, defaults/seed, reactive hooks, ui store, theme,
  url/search/nav/run libs, widget registry with 4 built-ins
  (clock/search/photo/embed) + tests scaffold. `npm run typecheck` green.
- Doc contract written (CLAUDE/AGENTS/DESIGN/docs/PRODUCT_SPEC/
  ARCHITECTURE/ROADMAP/QA_CHECKLIST) — being committed this milestone.

## Active worktrees / lanes (once dispatched)
- none yet — foundation must be committed first (it now is).

## Verification status
- typecheck: PASS (on substrate).
- lint / test / build: pending (lint may surface issues; no tests authored yet).

## Known blockers
- none genuine. (jsdom FileReader/layout gaps are handled by testing policy.)

## Next action
1. Commit doc contract + `.worktrees/` ignore.
2. Fan out worktree-isolated lanes: **notes+tasks**, **settings+wallpaper
   UI+backup** (and calendar+bookmarks as a coordinator-owned unit) — each
   under AGENTS.md ownership rules.
3. Coordinator: build shell/components + Home + Dashboard + windows/sheets,
   then integrate lanes, wire feature widgets into registry, run `npm run
   check`, and move to Phase 3–8.

## Handoff notes (survive compaction)
- Read CLAUDE.md + docs/ARCHITECTURE.md + docs/BUILD_STATE.md + git log/status.
- Contracts live in `types/domain.ts`, `types/widgets.ts`, `types/apps.ts`,
  widget registry, `data/repositories/index.ts`, `hooks/data.ts`,
  `state/ui.ts`, tokens. Only the coordinator changes them.
- Repos are the only data path; components must never import `db`.
- Home layout = ordered grid (`order` row-major; span derived).
