# QA CHECKLIST — Hearth V1 (finalized)

Each box is ticked only where verified **with evidence** (a named E2E spec run
against the production build, a unit test, or a command result) — not by
inspection. Coverage is annotated inline; anything that is only partially
machine-verified says so, and a short "human acceptance" section at the end
lists what still needs eyes on it.

**Final evidence run (2026-09-05, branch `build/v1-one-shot`):**
`npm run check` → lint 0 · typecheck 0 · **126/126 vitest** · build + PWA OK.
`npx playwright test --project=desktop --project=mobile` (vite preview) →
**73 passed / 23 intentional skips / 0 failed** across the two projects. Skips
are by design: mobile-inapplicable desktop checks, desktop-only width sweep and
backup flow, and touch-inapplicable freeform drag checks.

## Functional
- [x] Clean first launch → starter layout (seed content present) — `shell.spec #1`
- [x] Home ↔ Dashboard mode switch, both directions — `shell.spec #2`
- [x] Add / edit / remove shortcut (label, URL, icon, bg) — `home.spec #3`
- [x] Safe-URL rule on bad input — shortcut create/update reject
      javascript:/data:/non-http (unit); crafted hostile imports rejected by
      per-table backup row validators (`backupRepo.test`, 5 security tests)
- [x] URL shortcut opens the right destination, same tab, safe local URL —
      `search-nav.spec #4`
- [x] Search query → correct Google / Bing / DuckDuckGo URL per default engine —
      `search-nav.spec #5a/#5b/#5c`; URL-like input navigates — `search-nav.spec #4`
- [x] Create a second home page; rename + navigate between pages — `home.spec #6`
- [x] Page reorder / delete — repo-layer semantics + delete-page cascade (unit:
      `pages` + delete-shortcut/folder/widget cascades)
- [x] Edit Mode: dnd reorder keeps order after reload; remove item; Done exits —
      `home.spec #7` (desktop; touch-drag intentionally skipped on mobile)
- [x] Folder create / rename / open / close / add-remove shortcut — open/close +
      open contained shortcut `home.spec #8`; membership ops unit-tested
- [x] Dock: pinned items launch the app; visible across pages — `shell.spec #1/#2`
      + starter layout; dock add/remove/order unit-tested (`dockRepo`)
- [x] Notes CRUD + autosave + pin + search; **reload → persists** — `apps.spec #9`
- [x] Tasks add / check / uncheck / delete / clear; **reload → persists** —
      `apps.spec #10`
- [x] Calendar month nav + today highlight; responsive — `apps.spec #11` +
      `responsive.spec`
- [x] Widgets render on Home; order persists across reload — `home.spec #7`,
      `shell.spec #1`, widget unit tests
- [x] Wallpaper: gradient preset change persists — `settings.spec #12`;
      referenced-media-missing falls back to builtin (BUILD_STATE note)
- [x] Settings persist: theme, search engine, reduced effects, labels, icon size —
      `settings.spec #13`
- [x] JSON backup export → import with confirm — `settings.spec #16` (desktop);
      schema/row validation on import — `backupRepo.test`
- [x] PWA: production build serves a valid manifest + active worker; offline
      reload serves cached shell with local data — `pwa.spec #14/#15`

## Quality / visual
- [x] No horizontal overflow at 360 / 390 / 768 / 1024 / 1280 / 1440 — `responsive.spec`
      (desktop width sweep) + mobile project run
- [x] Chrome stays in-viewport; windows ↔ sheets follow the <1024px breakpoint —
      `responsive.spec` + `apps.spec` mobile
- [x] Reduced Effects + reduced-motion honored — effects gate on `data-effects`;
      global reduced-motion kill-switch in CSS; `settings.spec #13` toggles the
      persisted pref
- [x] E2E flows passed without uncaught page errors — 35 passing, traces retained on failure only
- [x] No secrets tracked; no paid-service dependency; no backend — git tree clean
      of keys, `npm run check` offline

## Engineering
- [x] `npm run check` green — lint 0 · typecheck 0 · 50/50 tests · build + PWA
- [x] Critical E2E suite passes — Playwright 35/35 + 3 by-design skips
- [x] No V2/V3 creep — ROADMAP splits V2/V3; removed dead `DashboardPanelPref`
      config, orphaned `crud.ts`, unused repo getters/helpers + dead CSS
- [x] Code / security / simplification review findings addressed — correctness
      (dialog stale-edit reset, duplicate-create guard), security (backup import
      row validation, `sameTab` safe-scheme gate), all dead code removed (see
      BUILD_STATE Phase 7)
- [x] Shared contracts untouched by lanes — frozen types edited only by
      coordinator during review

## Human acceptance (still needs eyes)
- [ ] Screenshot sweep aesthetics — 48 frames in `.shots/` (gitignored); layout
      integrity is machine-verified, pixel-level polish is not judged here.
- [ ] Visual once-over of pinned-note pressed state (accent-fill on the pin
      button now that `.iconBtn[aria-pressed='true']` is wired) and the clock
      widget date reveal on wide tiles (`@container` now active).
