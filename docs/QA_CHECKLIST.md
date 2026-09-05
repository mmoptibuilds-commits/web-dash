# QA CHECKLIST — Hearth V1

Tracked against docs/BUILD_STATE.md; tick when **verified with evidence**
(screenshot / console / reload test), not by inspection.

## Functional (E2E)
- [ ] Clean first launch → starter layout (seed content present)
- [ ] Home ↔ Dashboard mode switch
- [ ] Add / edit / remove shortcut (label, URL, icon, bg) — safe-URL rule shown on bad input
- [ ] URL shortcut opens correct destination (same tab) — test w/ safe local URL
- [ ] Search query produces correct Google / Bing / DDG URL; URL-like input navigates
- [ ] Create second home page; page nav (buttons/keyboard/swipe); rename/reorder/delete page
- [ ] Edit Mode: reorder an item (dnd), resize widget preset, remove item, Done exits
- [ ] Folder create / rename / open / close / add-remove shortcut
- [ ] Dock: pinned items launch; reorder in Edit Mode; persistent across pages
- [ ] Notes CRUD + autosave + pin + search; **reload → persists**
- [ ] Tasks add/check/uncheck/delete/clear; **reload → persists**
- [ ] Calendar month nav + today highlight; responsive layout
- [ ] Links mini-app lists shared shortcuts; opens destinations
- [ ] Widgets render; layout + settings persist across reload
- [ ] Wallpaper: gradient + image + video (or graceful fallback) on desktop + mobile; persists
- [ ] Settings persist (theme, engine, effects, labels, size)
- [ ] Reduced Effects + reduced-motion honored
- [ ] JSON backup export → import (schema/version validation + confirm) if implemented
- [ ] PWA: production build loads; manifest valid; offline app shell after load; update path sane

## Quality / visual
- [ ] No console errors in normal flows
- [ ] No horizontal overflow at 375×812 / 430×932 / 768×1024 / 1440×900 / 1920×1080
- [ ] No broken focus/keyboard trap in core desktop flows; Escape closes overlays
- [ ] Touch targets comfortable on mobile; nothing hover-only
- [ ] Glass readable over varied wallpapers (bright + dark)
- [ ] Mobile is designed, not a shrunk desktop
- [ ] No unfinished placeholder panels

## Engineering
- [ ] `npm run check` green (lint, typecheck, test, build)
- [ ] Critical E2E suite (Playwright) passes where configured
- [ ] No secrets; no paid-service dependency; no backend
- [ ] No V2/V3 creep; no duplicated data architecture
- [ ] Code/security/simplification review findings addressed or justified

## Docs
- [ ] README run/build/PWA basics; PRODUCT_SPEC matches impl; ARCHITECTURE real;
      ROADMAP separates V2/V3; CHANGELOG updated; BUILD_STATE finalized/removed
