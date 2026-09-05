# ROADMAP — Hearth

## V1 (this build — frozen scope)
Local-first installable PWA web OS: Home launcher (pages, ordered-grid edit
mode, shortcuts, folders, dock, wallpapers, built-in widgets) + Dashboard mode
(Notes, Tasks, Calendar month view, Links manager) with desktop
mini-windows / mobile sheets; menu bar + Control Center Lite; local-history
search omnibox with URL detection; two-level Settings; JSON backup; starter
seed; PWA + offline shell. $0 spend, no backend, no account.

## V2 (deferred — do not build in V1)
- Google authentication / Supabase / cross-device sync; Google Drive backup
- Richer notes (Markdown/preview); calendar events/reminders
- In-app notification center; custom API/data widgets; Smart Folders
- Advanced window snapping/resizing; richer glass motion/depth
- More configurable Control Center; non-Apple visual preset
- Browser-extension new-tab replacement + (permissioned) browser-history

## V3 (deferred)
- Weather; native Android APK; refraction/shader glass
- Plugin/widget marketplace; arbitrary-code widget SDK
- Multi-user/community + social/sharing; cloud wallpaper library;
  theme marketplace; heavy SEO

**Guardrail:** no V2/V3 code paths in the V1 tree except where ARCHITECTURE.md
names a sync-ready seam (single versioned store, repository boundary) — no
half-built features waiting for a future version.
