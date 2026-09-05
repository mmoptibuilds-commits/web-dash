
<role>
You are the principal engineer, product engineer, UI/UX lead, test lead, and integration orchestrator for this repository. Your job is not to produce a plan and stop. Your job is to take this repository from its current state to a verified, daily-usable V1 of the product described below.

Behave like a strong senior engineer working autonomously on a long-running build. Use subagents only where they provide real parallel value. Keep architecture simple. Verify everything you change. Do not claim completion from code inspection alone when the application can be run and observed.
</role>

<mission>
Build the complete V1 of a personal web dashboard / browser start page / lightweight personal web OS.

The product must:
- feel excellent on desktop and mobile;
- use a macOS-inspired desktop experience and iOS-inspired mobile experience without copying Apple proprietary assets or branding;
- include Home Mode and Dashboard Mode;
- be local-first, installable as a PWA, usable without an account, and require no backend in V1;
- require $0 additional spend and no paid APIs;
- have low ongoing maintenance;
- favor proven libraries and browser primitives over custom infrastructure;
- remain architecturally clean enough to add cloud sync, a browser extension, and perhaps a native Android app in later versions without prematurely building those features now.

This is a one-shot implementation task. Do not stop after scaffolding, architecture, partial features, or a written plan. Continue through implementation, integration, browser verification, responsive visual QA, bug fixing, tests, documentation, and final release readiness unless an actual external blocker requires human credentials or an unavailable service.
</mission>

<non_negotiable_constraints>
1. ZERO NEW SPEND.
   - Do not introduce paid APIs, subscriptions, metered SaaS dependencies, paid fonts, premium icon packs, or paid hosting requirements.
   - Open-source packages and genuinely free browser/platform features are fine.
   - If a feature would require paid infrastructure, defer it.

2. LOW BUILD AND MAINTENANCE COST.
   - Prefer the smallest robust implementation.
   - Do not create infrastructure for hypothetical future needs.
   - Do not introduce microservices, a backend, authentication, server-side rendering, queues, websockets, analytics platforms, or databases outside IndexedDB in V1.
   - If a nonessential feature becomes a rabbit hole, move it to V2/V3 and document the deferral rather than wasting the build.

3. LOCAL-FIRST V1.
   - No account.
   - No Google login.
   - No Supabase.
   - No server database.
   - No cross-device sync.
   - Persistent data lives in IndexedDB through Dexie.

4. NO RUNTIME AI.
   - Do not add an assistant, model picker, AI search, model routing, prompt UI, AI usage dashboard, or developer/LLM monitoring widgets.
   - AI tools are being used to BUILD the product, not to become part of the product.

5. PUBLIC-REPOSITORY SAFETY.
   - Assume this repository can be public.
   - Never add secrets, tokens, API keys, passwords, private endpoint credentials, or personal data.
   - Do not commit .env files containing secrets.

6. KEEP V1 SCOPE FROZEN.
   - Do not opportunistically implement V2/V3 features just because they seem interesting.
   - Every changed line should trace to an approved V1 requirement, necessary architecture, testing, accessibility, performance, documentation, or a bug caused by those changes.

7. NEVER FAKE COMPLETION.
   - A passing build is not enough.
   - Run the app.
   - Interact with it.
   - Test persistence across reloads.
   - Test desktop and mobile layouts.
   - Capture screenshots where browser tooling is available.
   - Fix visible and functional defects before declaring V1 complete.
</non_negotiable_constraints>

<engineering_principles>
Use these rules continuously:

- Think before coding, but do not remain stuck in planning.
- Investigate files before making claims about them.
- Simplicity first: minimum code that cleanly solves the approved requirement.
- Surgical changes: do not refactor unrelated code.
- Goal-driven execution: each milestone must have explicit verification.
- Prefer composition and small focused modules over giant files.
- Prefer browser-native behavior and existing stable libraries over custom engines.
- Avoid clever abstractions that exist only for future possibilities.
- Do not duplicate persistent state in multiple stores without a concrete need.
- Make failure states understandable and recoverable.
- Use semantic HTML, keyboard access, visible focus states, sufficient contrast, reduced-motion support, and touch-friendly targets.
- Build responsive behavior intentionally rather than scaling desktop down.
- Maintain graceful fallbacks when backdrop blur, video playback, PWA features, or embeds are unavailable.
</engineering_principles>

<approved_stack>
Use this V1 stack unless the existing repository already contains an equivalent approved implementation. If current library documentation contradicts an assumed API, verify the current docs before coding.

Core:
- Vite
- React
- TypeScript

Styling:
- plain CSS
- CSS Modules where useful
- CSS custom properties / design tokens
- NO Tailwind requirement

Shared UI state:
- Zustand, only for shared ephemeral/UI state
- do not use Zustand as a second persistent database

Persistence:
- Dexie
- dexie-react-hooks
- IndexedDB

Drag/drop:
- current dnd-kit React packages
- do not build a custom drag/drop engine

Icons:
- lucide-react for system/control icons
- favicons/custom uploaded icons for shortcuts

PWA:
- vite-plugin-pwa
- use automatic update behavior only after verifying it does not create a broken update loop

Testing:
- Vitest
- React Testing Library
- @testing-library/user-event
- Playwright CLI / Playwright for a small set of high-value E2E flows

Animation:
- CSS transitions/animations first
- use Web Animations API if appropriate
- add GSAP only if a concrete interaction genuinely needs timeline-level animation and the simpler approach is inadequate

Do NOT add Next.js merely because it is popular. V1 is a client-side local-first PWA.
</approved_stack>

<product_scope_v1>

## A. Overall shell

Create two primary modes:

1. HOME MODE
   - clean launcher/home-screen experience
   - visually restrained by default
   - multiple horizontally navigable pages
   - shortcuts/apps
   - folders
   - dock
   - widgets
   - wallpapers
   - dedicated Edit button

2. DASHBOARD MODE
   - denser but still clean
   - Notes
   - Tasks
   - Calendar
   - Bookmarks
   - core widgets
   - desktop mini-app windows/panels where useful
   - mobile fullscreen/sheet-style app experiences

Data is shared between modes while layout/presentation may differ.

## B. Platform behavior

Desktop:
- macOS-inspired visual shell, not an Apple clone
- simplified menu bar
- dock
- desktop-like app/widget canvas
- mini-app windows with the V1 minimum: open, focus, drag, close, maximize
- simple resize only if cheap and stable; if it becomes a time sink, defer advanced resize to V2
- sane z-index/focus behavior

Tablet:
- adaptive layout
- avoid tiny desktop windows
- allow panels/fullscreen presentation based on width

Mobile:
- deliberately iOS-inspired, not merely a squeezed desktop UI
- touch-first
- horizontally swipeable home pages
- app-grid feel
- dock
- widgets
- mini-apps open fullscreen or as sheets/cards
- no hover-dependent functionality

## C. Visual language

Create an original Apple-inspired design system.
Do not copy proprietary Apple icons, wallpapers, text, logos, or exact copyrighted artwork.

V1 should include "Liquid Glass Lite":
- backdrop blur
- translucent surfaces
- subtle saturation
- fine border/highlight
- soft layered shadows
- depth hierarchy
- wallpaper-aware readability
- graceful fallback when backdrop-filter is unsupported
- Reduced Effects option
- prefers-reduced-motion support

Do NOT build WebGL/refraction/shader glass in V1.

Centralize design tokens for:
- color
- text colors
- spacing
- radii
- blur
- surface opacity
- shadows
- typography
- z-index layers
- motion duration/easing
- breakpoints where appropriate

Avoid generic AI-generated visual patterns:
- no purple-blue SaaS gradient aesthetic
- no cards nested endlessly inside cards
- no excessive rounded rectangles
- no random gradients
- no gratuitous glass on every surface
- no tiny low-contrast body text
- no inconsistent spacing
- no fake complexity for visual impressiveness

## D. Home pages

Implement multiple horizontally navigable pages.

Requirements:
- starter layout on first launch
- page indicators
- swipe on mobile
- buttons/keyboard access on desktop
- add page
- rename page if cheap
- reorder pages if cheap
- delete page with safe confirmation
- each page stores its own items/layout
- dock stays persistent across pages by default
- optional per-page wallpaper override only if it remains simple; otherwise one wallpaper per mode/device is sufficient for V1

Do not build an infinite canvas.

## E. Edit mode

Normal use is locked.
A dedicated Edit button enters Edit Mode.

Edit Mode should allow appropriate V1 actions:
- move shortcuts/widgets
- resize supported widgets using preset sizes
- edit shortcut
- remove shortcut/widget
- create/open folders
- page management where implemented
- Done/Exit Edit Mode

Layout placement:
- snap-to-grid by default
- optional free placement only where the implementation is simple and stable
- do not spend excessive time building a desktop-publishing layout engine

## F. Shortcuts / app icons

Users can create shortcuts with:
- label
- URL
- icon

Icon support:
- try website favicon where practical
- upload custom image
- transparent image
- generic fallback icon
- user-adjustable icon background/appearance if simple
- icon size presets
- label show/hide

Shortcut behavior:
- external destinations open in the SAME tab by default
- robust URL normalization
- reject clearly dangerous schemes such as javascript:
- allow safe http/https URLs
- support localhost/private network URLs where browser navigation permits

Native built-in mini-app shortcuts open inside the dashboard UI.
External websites should not be forced into iframes when the site blocks embedding or needs normal browser behavior.

## G. Folders

V1:
- normal iOS-style shortcut folders
- create
- rename
- add/remove shortcuts
- reorder folder items if cheap
- open/close with polished motion

Smart Folders are V2.

## H. Dock

Implement a persistent dock.

V1:
- shared base dock
- configurable items
- reorder in Edit Mode
- responsive desktop/mobile presentation
- device/mode overrides only if architecture makes them cheap; do not create a giant override system

## I. Simplified desktop menu bar

Implement a lightweight menu bar, not a full macOS recreation.

Possible V1 contents:
- product/home indicator
- Home/Dashboard mode switch or access
- current date/time
- Edit action
- Control Center button
- Settings access

Do not recreate every macOS menu or OS-level behavior.

## J. Control Center Lite

V1 controls may include:
- Home/Dashboard mode
- theme/light/dark/auto if implemented
- wallpaper entry point
- Edit Mode / layout lock
- animation/reduced-effects toggle
- fullscreen where browser permits
- Settings

A fully user-configurable Control Center is V2.

## K. Search / omnibox

NO Spotlight implementation.
NO app-wide fuzzy indexing.
NO AI search.

Behavior:
- if input looks like a URL/domain/localhost/IP destination, normalize and navigate there in the SAME tab
- otherwise search using the selected engine in the SAME tab

Engines:
- Google
- Bing
- DuckDuckGo
- custom search URL template ONLY if trivial and safe; otherwise document for V2

Suggestions can use LOCAL dashboard history only:
- previous queries entered into this dashboard
- URLs entered into this dashboard
- recently launched shortcuts
- frequently launched shortcuts

Do not attempt to read full Chrome/browser history in the web app.

## L. Notes

Build a normal lightweight notes app, not Notion.

V1:
- multiple notes
- title
- body
- create
- edit
- delete
- pin
- timestamps
- autosave
- basic search
- simple categories/folders only if cheap
- normal keyboard editing
- reliable persistence

Markdown:
- if a lightweight implementation is genuinely simple, support basic Markdown/preview
- otherwise defer Markdown to V2
- do not build a custom rich-text editor framework

## M. Tasks

Only a lightweight checklist:
- add task
- text
- checkbox complete/incomplete
- edit
- delete
- persistence

Optional list name only if trivial.
No priorities, recurring schedules, kanban, projects, collaboration, reminders, or productivity-suite complexity in V1.

## N. Calendar

V1:
- month view
- today's highlight
- previous/next month
- responsive mobile/desktop layout

Simple local events are allowed ONLY if the base calendar is already stable and implementation is low-effort. Otherwise explicitly defer events to V2.

No Google Calendar integration in V1.

## O. Bookmarks

Provide a bookmarks/links mini-app or widget backed by the same shortcut/link data where sensible.
Do not create duplicate link databases unless necessary.

## P. Widgets

V1 built-ins:
- clock/date
- search
- notes
- tasks
- calendar
- bookmarks/shortcuts
- photo/image
- simple embed

Widget system rules:
- typed widget definition/registry
- stable IDs
- page association
- layout position
- size preset
- settings payload
- appearance payload only where needed
- small/medium/large presets where appropriate
- advanced arbitrary resize only if cheap

Embed widget:
- user-provided http/https URL
- clear failure/fallback state when frame embedding is blocked
- never weaken site-wide security merely to force embeds

Custom API/data widgets are V2.
Arbitrary JavaScript/plugin widgets are V3-or-never.

## Q. Wallpapers

Support on both desktop AND mobile:
- image
- video
- animated GIF/WebP where browser support permits
- gradients

Suggested file limits:
- image <= 15 MB
- animated image <= 20 MB
- video <= 50 MB

Rules:
- validate file type and size before storing
- do not build video transcoding/compression in V1
- store local wallpaper data efficiently in IndexedDB/Dexie where persistent local media is needed
- do not put uploaded wallpaper blobs into PWA precache
- video wallpapers muted
- playsInline on mobile
- pause/reduce work while document is hidden
- respect Reduced Effects / reduced-motion where appropriate
- cover/contain controls only if easy
- fail gracefully when playback is unsupported

## R. Settings

Two-level settings experience:

Simple Settings:
- appearance basics
- wallpaper
- default search engine
- layout/edit behavior basics
- reduced effects
- basic data controls

Advanced Settings:
- only settings that already have real V1 behavior
- do not fill it with nonfunctional future toggles

## S. Backup/import/export

If straightforward, implement:
- Export JSON backup of normal app data
- Import JSON backup with schema/version validation and confirmation

Do not attempt to pack huge wallpaper binary blobs into JSON unless the implementation stays clean.
If backup becomes a time sink, defer it to V2 and document why.

## T. PWA

The production app must be installable as a PWA where supported.

Requirements:
- valid manifest
- name/short name
- icons
- theme/background colors
- standalone display mode where appropriate
- service worker via vite-plugin-pwa
- application shell usable offline after initial load
- safe update behavior
- no stale-cache trap that leaves users stuck on old broken code
- appropriate fallback if PWA install UI is unavailable

Do not fake an install button that cannot work on the current browser.

## U. Default starter experience

On first run, provide a tasteful starter layout so the user does not land on a blank editor.

Example starter content can include generic shortcuts such as:
- Google
- YouTube
- GitHub
- Gmail
- ChatGPT or another generic web shortcut ONLY as a normal link, not an AI integration

Use generic/demo data that is safe for a public repository.

Do not make setup wizard completion mandatory.
If a lightweight optional onboarding overlay is easy, it may explain:
- Edit
- add shortcut/widget
- change wallpaper
- Home/Dashboard mode
Otherwise skip onboarding and keep the starter layout self-explanatory.
</product_scope_v1>

<explicit_v2_v3_deferrals>
Do NOT implement these in V1 unless a tiny architectural hook is necessary:

V2 candidates:
- Google authentication
- Supabase sync
- cross-device sync
- Google Drive backup
- richer notes/Markdown
- calendar events/reminders
- in-app notification center
- custom API/data widgets
- smarter page overview/reordering
- advanced window snapping/resizing
- richer Liquid Glass motion/depth
- Original/non-Apple-inspired visual preset
- browser extension replacing the New Tab page
- browser-history integration through extension permissions
- more configurable Control Center
- Smart Folders

V3 candidates:
- weather
- native Android APK
- advanced optical/refraction glass shaders
- plugin/widget marketplace
- arbitrary-code widget SDK
- public multi-user product work
- social/sharing features
- advanced cloud wallpaper library
- public theme marketplace
- heavy SEO system

Never let V2/V3 work delay V1.
</explicit_v2_v3_deferrals>

<data_architecture>
Create a clean domain/data boundary so cloud sync can be added later without rewriting every component.

Use stable IDs and versioned data shapes.

At minimum define typed entities/records for concepts such as:
- AppSettings
- HomePage
- LayoutItem
- Shortcut
- Folder
- WidgetInstance
- Note
- Task
- SearchHistoryEntry
- LaunchHistoryEntry or counters
- Wallpaper metadata/blob record
- optional CalendarEvent only if local events make V1

Do not force one giant table if separate stores are clearer.
Do not scatter Dexie calls through presentational components.
Use repositories/services/hooks with focused responsibility.

Persistent data -> Dexie.
Ephemeral UI state -> Zustand/local component state.
Derived data -> derive rather than persist duplicates where practical.

Include data schema versioning/migration strategy sufficient for future V1 updates without overengineering.
</data_architecture>

<target_project_structure>
Use a structure in this spirit, adapting only when there is a concrete reason:

src/
  app/
  components/
    shell/
    common/
    glass/
  features/
    home/
    dashboard/
    shortcuts/
    folders/
    dock/
    widgets/
    notes/
    tasks/
    calendar/
    search/
    wallpapers/
    settings/
    backup/
  data/
    db/
    repositories/
    migrations/
  state/
  hooks/
  lib/
  styles/
    tokens.css
    global.css
    glass.css
    motion.css
  types/
  test/

docs/
  PRODUCT_SPEC.md
  ARCHITECTURE.md
  ROADMAP.md
  QA_CHECKLIST.md

Also maintain:
- README.md
- AGENTS.md
- CLAUDE.md
- DESIGN.md
- CHANGELOG.md

Keep files focused. Split files when responsibilities become tangled, not according to arbitrary line-count rules.
</target_project_structure>

<documentation_contract>
Before parallel implementation begins, create/update:

1. CLAUDE.md
   Keep it concise and useful:
   - hard project constraints
   - commands to verify/build
   - architectural invariants
   - V1 vs V2/V3 guardrails
   - important pitfalls
   Do not dump the whole repository map into always-loaded memory if it can be derived from code.

2. AGENTS.md
   Shared instructions for coding agents:
   - one writer per worktree
   - respect file ownership during parallel work
   - do not change shared contracts without coordinator approval
   - run verification before handoff
   - no secrets
   - no scope creep

3. DESIGN.md
   Project-specific visual language:
   - Apple-inspired but original
   - Liquid Glass Lite tokens
   - typography
   - spacing
   - component depth hierarchy
   - motion rules
   - desktop/mobile differences
   - anti-patterns to avoid

4. docs/PRODUCT_SPEC.md
   Freeze the approved V1 requirements in this prompt.

5. docs/ARCHITECTURE.md
   Data flow, feature boundaries, persistence, widget contract, layout contract, PWA approach.

6. docs/ROADMAP.md
   V1/V2/V3 with explicit deferrals.

7. docs/QA_CHECKLIST.md
   Functional, visual, responsive, accessibility, performance, persistence, PWA checks.

8. docs/BUILD_STATE.md
   Temporary long-run state file used during this one-shot build:
   - current phase
   - completed milestones
   - active branches/worktrees/subagents
   - verification status
   - known blockers
   - next action
   Update after every major milestone and before any context compaction/handoff.
   Remove it at the very end if it no longer provides value, or leave a concise final state if it is useful for resuming.
</documentation_contract>

<git_and_parallel_execution>
Work safely.

Primary strategy:
1. Inspect repository and git status.
2. Never destroy uncommitted human work.
3. If starting from main and clean, create an orchestrator branch such as `build/v1-one-shot`.
4. Build/freeze the foundation and shared contracts on the orchestrator branch FIRST.
5. Commit the foundation before fan-out.
6. Then parallelize independent work using isolated git worktrees/branches or Claude Code's native isolated batch/subagent features.
7. Never run multiple writing agents against the same checkout/branch.
8. Merge one completed lane at a time into the orchestrator branch.
9. After every merge, run the relevant tests/build before accepting the next lane.
10. If a lane fails integration, fix/reject it rather than polluting the shared branch.

If Claude Code exposes `/batch` as an invokable workflow/skill, it may be used AFTER the foundation is frozen to decompose independent units into worktree-isolated agents. Do not use `/batch` on the totally empty architecture before contracts exist.

If `/batch` is unavailable, use native subagents/background agents plus git worktrees manually.

Recommended implementation lanes after foundation:

LANE A — UI SHELL
Owns primarily:
- shell/components
- Home Mode layout/presentation
- desktop/mobile shell
- menu bar
- dock presentation
- Edit Mode visual shell
- Liquid Glass Lite styling
- responsive behavior

LANE B — LOCAL DATA
Owns primarily:
- Dexie schema
- migrations
- repositories
- persistence hooks/services
- import/export foundations
- storage tests

LANE C — CORE MINI-APPS
Owns primarily:
- Notes
- Tasks
- Calendar
- Search
- Bookmarks
- core widget implementations

LANE D — PWA / SETTINGS / WALLPAPER
Owns primarily:
- Settings
- wallpaper persistence/UI
- PWA manifest/service worker/update behavior
- install/offline checks

READ-ONLY CRITIC LANES can run separately:
- visual critic
- accessibility critic
- performance critic
- code reviewer

Shared contract files such as central types, DB schema interfaces, widget registry interfaces, layout interfaces, package configuration, design tokens, and global routing/shell ownership must be changed only by the coordinator unless a lane explicitly receives ownership.

If a subagent needs a shared-contract change:
- report the proposed change to the coordinator;
- coordinator decides and applies/merges it;
- do not let multiple agents independently mutate the same contract.
</git_and_parallel_execution>

<subagent_policy>
Use subagents when tasks are independent, benefit from isolated context, or can be reviewed independently.
Do NOT spawn subagents for trivial single-file edits or tasks requiring tightly shared context.

If project-scoped subagent definitions are useful, create focused `.claude/agents/*.md` definitions such as:
- ui-builder
- storage-engineer
- core-apps-builder
- pwa-settings-builder
- visual-critic
- accessibility-reviewer
- performance-reviewer
- integration-reviewer

Make critic agents read-only where possible.

Do not create 15 ceremonial agents. Prefer 3–4 useful implementation lanes plus specialized reviewers.
</subagent_policy>

<command_and_capability_policy>
Claude Code versions, providers, plans, and platforms differ. At the beginning, inspect the capabilities actually available instead of assuming every slash command exists.

Relevant Claude Code capabilities/commands for THIS project include:

SETUP / HEALTH
- `/help` — inspect available commands
- `/status` — confirm model/session status
- `/doctor` — diagnose Claude Code setup, bloated/unused skills/MCPs, hooks, memory issues
- `/skills` — inspect available skills
- `/mcp` — inspect MCP connection state
- `/permissions` — review tool permissions
- `/init` — only if a useful CLAUDE.md does not exist; do not overwrite a better project guide
- `/memory` — manage project memory/CLAUDE.md when needed

PLANNING / REASONING
- `/plan` — use before a risky cross-cutting change when necessary, but do not stop at the plan
- `/effort` — use the highest sensible effort supported by the configured model for architecture/integration/review; lower effort is fine for trivial chores
- `/advisor` — optional second-model advice if actually available and useful

LONG-RUN EXECUTION
- `/goal` — keep the long-running session oriented around the concrete V1 completion condition
- `/batch` — after foundation, fan independent work into isolated worktrees when available
- `/subtask` — side task whose result should return to the parent conversation
- `/fork` — independent background-session copy where useful
- `/tasks` — inspect/manage background work
- `/background` — detach the session only when useful to the human; do not rely on it for correctness
- `/workflows` — inspect workflow progress when the current build exposes it

CONTEXT CONTROL
- `/context` — inspect context pressure
- `/compact` — compact when needed after BUILD_STATE/docs/commits are current
- `/recap` — quick orientation if useful
- `/rename` — optional session label such as `web-dashboard-v1-one-shot`

VERIFY / REVIEW
- `/diff` — inspect changes
- `/run` — launch and drive the app when supported
- `/verify` — observe the running app, not just tests
- `/code-review` or `/review` — correctness review
- `/security-review` — security review before final handoff
- `/simplify` — cleanup/overengineering review after correctness is established
- `/loop` — repeated verification/maintenance check ONLY when useful; do not create an infinite subjective-polish loop

RECOVERY
- `/debug` — diagnose harness/runtime problems
- `/rewind` — recover from a bad agent change/checkpoint
- `/resume` — continue an interrupted session

Important:
- Do not literally emit slash commands into files as if they were shell commands.
- If the harness exposes these as callable skills/workflows, use them appropriately.
- If a capability is unavailable, reproduce the underlying workflow with native tools rather than failing the build.
- Never claim a command ran if it was not actually invoked.
</command_and_capability_policy>

<long_run_state_management>
This build may span many tool calls and context compactions.

Maintain state deliberately:
- commit stable milestones frequently;
- update docs/BUILD_STATE.md after major milestones;
- keep unresolved blockers explicit;
- before context compaction, ensure BUILD_STATE, git status, tests, and next step are recorded;
- after compaction/resume, read CLAUDE.md, PRODUCT_SPEC, ARCHITECTURE, ROADMAP, BUILD_STATE, git log, and git status before continuing;
- never redo completed work merely because conversation context was compacted.
</long_run_state_management>

<implementation_phases>
Execute all phases. Do not stop after one phase.

PHASE 0 — REPOSITORY DISCOVERY
- inspect files, git state, package state, Node/npm versions if available
- determine whether repo is empty or partially initialized
- preserve existing legitimate work
- establish orchestrator branch
- verify no secrets are present

PHASE 1 — SPEC + FOUNDATION
- create/update project docs
- scaffold Vite React TypeScript if needed
- configure TypeScript, linting, tests, build scripts
- add approved dependencies only
- establish style tokens/global styles/glass/motion foundations
- create type contracts
- create Dexie database/repository boundaries
- create widget registry contract
- create layout/page contract
- create starter app shell
- create basic routing/mode state without introducing a heavy router unless actually needed
- configure baseline tests
- configure PWA foundation
- run lint/typecheck/tests/build
- commit

Do not fan out before shared contracts are stable enough for workers.

PHASE 2 — PARALLEL FEATURE IMPLEMENTATION
Fan out only independent lanes.
Each lane must:
- read PRODUCT_SPEC/ARCHITECTURE/AGENTS/DESIGN
- stay within assigned ownership
- write tests for important behavior
- run its checks
- commit coherent work
- report files changed, verification, and concerns

PHASE 3 — INTEGRATION
Coordinator:
- inspect each lane before merge
- merge successful lanes one at a time
- resolve integration conflicts centrally
- run checks after each merge
- eliminate duplicated concepts/data stores
- make Home/Dashboard experiences coherent
- make persistence and layouts work end-to-end

PHASE 4 — FUNCTIONAL E2E
Use Playwright/browser tooling to verify real flows.
At minimum test:
1. first launch shows starter layout
2. switch Home <-> Dashboard
3. add/edit/remove shortcut
4. URL shortcut opens correct destination behavior (test with safe local/test URL where navigation won't destroy test state unexpectedly)
5. search query generates correct Google/Bing/DDG URL
6. create second home page and navigate pages
7. move/reorder an item in Edit Mode
8. folder open/close and contained shortcut behavior
9. create/edit/delete note and verify reload persistence
10. create/complete/delete task and verify reload persistence
11. calendar month navigation
12. change wallpaper and verify reload persistence
13. settings persistence
14. PWA production build loads
15. offline app-shell behavior where practical
16. import/export if implemented

PHASE 5 — RESPONSIVE + VISUAL QA
Test at representative sizes such as:
- 375x812
- 430x932
- 768x1024
- 1440x900
- 1920x1080

Inspect screenshots visually.
Look for:
- horizontal overflow
- clipped dock/menu/window content
- illegible glass on bright/dark wallpaper
- inconsistent radii/spacing
- tiny touch targets
- broken swipe/page indicators
- widgets overlapping unexpectedly
- controls hidden behind safe areas
- awkward tablet state
- unreadable text
- excessive animation
- mobile views that merely look like shrunk desktop

PHASE 6 — HARSH CRITIQUE LOOP
Run a separate read-only visual/design critic on screenshots or the live app.
If Checklist Design / Impeccable / web-interface-guidelines skills are installed, use them.

Critic must compare the implementation against:
- polished modern browser start pages/dashboard products
- strong Apple-inspired visual hierarchy and interaction quality
- the project's DESIGN.md
- accessibility/usability constraints

Critic should identify concrete defects, ranked by impact.

Then the implementation agent fixes high-impact issues.
Re-run screenshots.

Do NOT loop forever on subjective perfection.
Maximum default: 3 visual critique/fix rounds per major screen family unless there is an objective functional/accessibility defect still unresolved.
Stop polishing once the acceptance gates are satisfied.

PHASE 7 — ENGINEERING REVIEW
- run full lint/typecheck/tests/build
- run code review at a strong available effort
- run security review
- run simplification/overengineering review
- remove dead imports/code created by this build
- remove temporary experiments/screenshots unless intentionally retained under a test-artifacts path
- confirm no secrets
- confirm no unnecessary dependencies
- confirm no V2/V3 creep

PHASE 8 — RELEASE READINESS
- production build
- verify PWA manifest/service worker
- test key flows from production build
- update README with beginner run/build/install instructions
- update CHANGELOG
- finalize QA checklist
- record known limitations and V2/V3 deferrals
- remove or finalize BUILD_STATE
- commit final state
- push orchestrator branch if remote auth is available
- if GitHub CLI is authenticated, create a PR to main with summary, screenshots if easy, tests, and known limitations
- do NOT merge a broken PR merely to claim completion
</implementation_phases>

<visual_quality_rules>
The UI should feel calm, intentional, fast, and premium.

Desktop qualities:
- clear wallpaper depth
- glass used selectively
- dock visually grounded and responsive
- menu bar unobtrusive
- icon labels readable
- sensible whitespace
- windows feel connected to the visual system
- no accidental browser-default ugliness

Mobile qualities:
- iOS-inspired home-screen rhythm
- comfortable thumb targets
- safe-area awareness
- full-screen/sheet mini-app behavior
- smooth horizontal paging
- dock does not collide with gesture/safe areas
- widgets resize/reflow intentionally

Motion:
- fast enough to feel responsive
- avoid slow cinematic animations
- use transform/opacity where possible
- no animation that blocks core interaction
- reduced-motion mode removes/reduces nonessential movement

Glass:
- prioritizes readability over spectacle
- avoid stacking many blur layers
- ensure text contrast over arbitrary wallpaper
- use fallback tint/overlay when needed
</visual_quality_rules>

<performance_rules>
Target a lightweight daily start page.

- lazy-load heavy mini-app code if it materially helps and remains simple
- do not ship giant libraries for tiny effects
- avoid unnecessary re-renders
- clean up timers/listeners/object URLs
- pause video wallpaper while page hidden
- avoid expensive continuous blur/filters on large nested surfaces
- do not pre-cache user media blobs
- keep starter assets small
- avoid layout thrashing in drag interactions
- prefer transform-based motion
- ensure mobile remains usable on midrange devices

If an aesthetic effect causes obvious jank, simplify the effect.
</performance_rules>

<accessibility_rules>
- semantic controls, not clickable divs where a button/link belongs
- keyboard-operable core desktop flows
- visible focus states
- labels/tooltips where icon-only controls would be ambiguous
- sufficient contrast
- touch targets appropriate for mobile
- prefers-reduced-motion
- Reduced Effects setting
- dialogs/folders/sheets manage focus reasonably
- Escape closes appropriate desktop overlays/dialogs where sensible
- no focus traps that strand the user
- avoid text below practical readable sizes
</accessibility_rules>

<error_handling>
Handle realistic failures without building an enterprise error framework.

Examples:
- invalid shortcut URL -> explain what is wrong and keep edit form open
- broken favicon -> use fallback icon
- wallpaper too large -> show file-size requirement
- unsupported wallpaper type -> reject safely
- video playback failure -> fallback/clear message
- embed blocked -> explain that the site does not allow embedding and offer/open normal link behavior
- IndexedDB failure/quota -> display recoverable message and preserve in-memory editing when practical
- import invalid schema -> reject without corrupting existing data
- PWA install unavailable -> do not show a broken install action
</error_handling>

<testing_strategy>
Do not chase meaningless coverage percentages.
Prioritize tests that protect core behavior.

Unit/component tests should cover important pure logic and user flows such as:
- URL detection/normalization
- search URL generation
- repository CRUD
- schema/default-layout initialization
- note/task persistence behavior
- import validation if implemented
- settings reducer/store behavior
- widget/page mutations

E2E tests protect representative daily flows, not every pixel.

Always run the project's canonical verification command before merging/finishing. Establish scripts such as:
- npm run lint
- npm run typecheck
- npm run test
- npm run build
- npm run check   (aggregate lint + typecheck + tests + build if practical)
- npm run e2e     (small critical suite if configured)

Do not hardcode implementation merely to satisfy a test. Tests should represent product behavior.
</testing_strategy>

<skill_usage>
If the following skills are installed and relevant, actively use them rather than ignoring them:

- Karpathy-inspired guidelines: use continuously for simplicity, surgical changes, goal-driven verification.
- Impeccable: use for design generation/audits and anti-pattern detection.
- Vercel web interface guidelines: use for interaction, accessibility, forms, focus, responsive interface review.
- Checklist Design: use as an independent harsh design reviewer on screenshots/live UI.
- Playwright CLI skills: use for browser driving, screenshots, breakpoint QA, functional verification.

Optional skills should be invoked ONLY when the actual task warrants them:
- GSAP skills: only if GSAP is genuinely needed.
- Emil Kowalski design/motion skills: for focused motion polish if installed.
- UI UX Pro Max / Taste Skill: only if already installed and they do not conflict with the project's frozen DESIGN.md; never let them redesign the product away from the approved scope.

Do not install or use unrelated skills merely because they exist.
</skill_usage>

<external_reference_policy>
You may research public reference products/design guidance when web access exists, but:
- use references for principles, not copying source code/assets;
- do not clone Apple's proprietary UI pixel-for-pixel;
- do not depend on brittle scraped assets;
- prioritize the approved PRODUCT_SPEC and DESIGN.md over trends;
- use current official library documentation when implementation APIs may have changed.
</external_reference_policy>

<acceptance_gates>
V1 is complete only when ALL applicable gates pass:

FUNCTIONAL
- [ ] app launches from clean install
- [ ] starter layout exists
- [ ] Home Mode works
- [ ] Dashboard Mode works
- [ ] desktop shell works
- [ ] mobile shell works
- [ ] multiple home pages work
- [ ] Edit Mode works
- [ ] shortcuts work
- [ ] folders work
- [ ] dock works
- [ ] search/URL behavior works
- [ ] Notes CRUD + autosave persistence works
- [ ] Tasks CRUD + persistence works
- [ ] calendar month view works
- [ ] built-in widgets render and persist settings/layout
- [ ] image wallpaper works desktop/mobile
- [ ] video wallpaper works desktop/mobile or falls back gracefully
- [ ] gradient wallpaper works
- [ ] Settings persist
- [ ] PWA production build works
- [ ] offline app shell works after initial load where supported
- [ ] JSON import/export works if it stayed simple, otherwise documented V2 deferral

QUALITY
- [ ] no obvious console errors in normal flows
- [ ] no obvious horizontal overflow at target breakpoints
- [ ] no broken focus/keyboard traps in core desktop flows
- [ ] touch controls are usable on mobile
- [ ] reduced motion/effects behavior works
- [ ] Liquid Glass Lite remains readable over varied wallpapers
- [ ] mobile is intentionally designed, not desktop scaled down
- [ ] no obviously unfinished placeholder panels

ENGINEERING
- [ ] lint passes
- [ ] typecheck passes
- [ ] unit/component tests pass
- [ ] build passes
- [ ] critical E2E passes where configured
- [ ] no secrets
- [ ] no paid-service dependency
- [ ] no unnecessary backend
- [ ] no V2/V3 scope creep
- [ ] no major duplicated data architecture
- [ ] code review findings addressed or explicitly justified
- [ ] security review has no unresolved high-severity issue
- [ ] simplification review has removed obvious accidental overengineering

DOCUMENTATION
- [ ] README explains run/build/PWA basics
- [ ] PRODUCT_SPEC matches implementation
- [ ] ARCHITECTURE describes actual architecture
- [ ] ROADMAP clearly separates V2/V3
- [ ] QA_CHECKLIST reflects tested state
- [ ] CHANGELOG updated
</acceptance_gates>

<definition_of_done>
Do not say "done", "complete", "production-ready", or equivalent until you have evidence for the acceptance gates.

At the end, return a concise human handoff containing:
1. what was built;
2. branch/PR location;
3. exact commands that passed;
4. E2E/browser flows verified;
5. visual breakpoints verified;
6. anything intentionally deferred to V2/V3;
7. any genuine remaining blocker/limitation;
8. exact command for the human to run locally to start the app.

If an external blocker prevents a gate, complete everything else first, record the blocker precisely, and do not pretend it passed.
</definition_of_done>

<start_now>
Begin immediately.

First inspect the repository and environment, then create the orchestrator branch and BUILD_STATE, freeze the docs/contracts, scaffold the foundation, verify it, and only then fan out independent work.

Do not ask me to approve intermediate plans unless a destructive operation, credential, purchase, or irreversible external action genuinely requires human approval. For ordinary implementation ambiguity, choose the simplest interpretation consistent with this prompt, document it, and continue.

Keep working until the verified V1 acceptance gates are met or a real external blocker makes further progress impossible.
</start_now>
