# Hearth OS v1.1 Visual and Structural Overhaul — Implementation Plan

> Execute this plan on \`feat/v1.1-hearth-os-overhaul\`. The approved design is
> \`docs/superpowers/specs/2026-09-06-hearth-os-v1-1-overhaul-design.md\`.

## Goal

Turn Hearth from a two-mode scrolling dashboard into a viewport-locked personal-computer surface:

- Home remains visible underneath every app;
- desktop apps open as real floating windows;
- phones use full-height sheets;
- only bounded app bodies and embedded documents scroll;
- widgets fit the viewport and never overlap;
- window and Hearth-owned app state persist;
- icons, status bar, dock, folders, widgets, dialogs, and app surfaces share one restrained macOS/iOS-inspired system;
- documentation and release metadata describe v1.1.0 accurately.

## Working rules

- Write tests before implementation for every behavior change.
- Keep Dexie as the only persistent store; do not add localStorage or a second state store.
- Keep components out of direct \`db.*\` access. New persistence goes through repositories and hooks/adapters.
- Use existing CSS Modules and tokens. Do not add a UI framework or icon dependency.
- Use CSS/WAAPI for small transitions. Use GSAP only if a coordinated timeline cannot be expressed cleanly without it. The default plan does not add GSAP as a dependency.
- Keep external embeds sandboxed and do not attempt to rewrite cross-origin documents.
- Preserve existing stored data and migration compatibility.
- Do not copy assets from the supplied Figma community files.
- Stage intended paths explicitly. Do not include \`assets/\`, \`liquidGL-main/\`, \`issues.txt\`, or screenshot scratch files.
- Keep one writer on the branch. Use logical commits and run focused checks after each slice.

## Target file map

Shared contracts and persistence:

- \`src/types/domain.ts\`
- \`src/data/db/db.ts\`
- \`src/data/defaults.ts\`
- \`src/data/seed.ts\`
- \`src/data/repositories/index.ts\`
- \`src/data/repositories/backup.ts\`
- new \`src/data/repositories/windowStates.ts\`
- new \`src/hooks/windowState.ts\` if the adapter needs a React boundary
- \`src/state/ui.ts\`
- \`src/state/nav.ts\`
- \`src/hooks/data.ts\`
- \`src/app/theme.ts\`
- \`src/main.tsx\`
- \`src/App.tsx\`

Shell and icon system:

- \`src/components/shell/MenuBar.tsx\`
- \`src/components/shell/ControlCenter.tsx\`
- \`src/components/shell/Dock.tsx\`
- \`src/components/shell/WindowsHost.tsx\`
- \`src/components/shell/appContent.tsx\`
- \`src/components/shell/menubar.module.css\`
- \`src/components/shell/dock.module.css\`
- \`src/components/shell/windows.module.css\`
- \`src/components/common/Glyph.tsx\`
- \`src/components/common/Glyph.module.css\`
- new \`src/components/shell/AppLauncher.tsx\`
- new \`src/components/shell/app-launcher.module.css\`
- \`src/styles/tokens.css\`
- \`src/styles/global.css\`
- \`src/styles/glass.css\`
- \`src/styles/motion.css\`
- \`src/components/shell/backdrop.module.css\`

Home, layout, widgets, and embeds:

- \`src/data/layout/geometry.ts\`
- \`src/data/layout/geometry.test.ts\`
- \`src/features/home/HomeMode.tsx\`
- \`src/features/home/home.module.css\`
- \`src/features/home/HomeDialogs.tsx\`
- \`src/features/home/FolderView.tsx\`
- \`src/features/widgets/builtins/EmbedWidget.tsx\`
- \`src/features/widgets/builtins/builtins.module.css\`
- \`src/features/bookmarks/BookmarksWidget.tsx\`
- \`src/features/bookmarks/bookmarks.module.css\`

App surfaces and settings:

- \`src/features/dashboard/DashboardMode.tsx\`
- \`src/features/dashboard/dashboard.module.css\`
- \`src/features/notes/notes.module.css\`
- \`src/features/tasks/tasks.module.css\`
- \`src/features/calendar/calendar.module.css\`
- \`src/features/bookmarks/bookmarks.module.css\`
- \`src/features/calculator/calculator.module.css\`
- \`src/features/settings/index.tsx\`
- \`src/features/settings/settings.module.css\`
- \`src/features/settings/controls.tsx\`
- \`src/features/settings/settingsRepo.test.ts\`

Tests:

- existing \`src/**/*.test.*\`
- \`e2e/helpers.ts\`
- \`e2e/shell.spec.ts\`
- \`e2e/windows.spec.ts\`
- \`e2e/home.spec.ts\`
- \`e2e/freeform.spec.ts\`
- \`e2e/responsive.spec.ts\`
- \`e2e/settings.spec.ts\`
- \`e2e/glass.spec.ts\`
- \`e2e/polish.spec.ts\`
- new focused E2E specs where existing files would become unclear

Documentation and release metadata:

- \`package.json\`
- \`vite.config.ts\`
- \`README.md\`
- \`CHANGELOG.md\`
- \`DESIGN.md\`
- \`docs/PRODUCT_SPEC.md\`
- \`docs/ARCHITECTURE.md\`
- \`docs/ROADMAP.md\`
- \`docs/QA_CHECKLIST.md\`
- \`docs/BUILD_STATE.md\`
- \`docs/V2_STATUS.md\`
- \`docs/superpowers/specs/2026-09-06-macos-ios-visual-system-design.md\`
- this plan

## Task 1: Establish the v1.1 contracts and migration

### Tests first

Add repository tests for:

- default v1.1 settings;
- merging old settings rows with new defaults;
- window-state CRUD and update timestamps;
- geometry validation;
- backup export/import of window states and new settings;
- rejection of invalid app ids, invalid geometry, invalid enums, and malformed state;
- migration from DB v3 to DB v4 with no data loss.

Use fake IndexedDB and the existing repository test style.

### Implementation

1. Add explicit settings types for the new behavior:

   - appearance profile;
   - icon family, shape, and treatment;
   - dock configuration;
   - wallpaper dimming;
   - Home density and max canvas behavior;
   - window restoration;
   - embed display/fullscreen preference;
   - reduced transparency/contrast preference where supported.

   Keep values finite, enum-based, and backward-compatible.

2. Add a persisted window-state type keyed by \`BuiltinAppId\`. Store only Hearth-owned app/window state. Do not store arbitrary iframe internals.

3. Bump Dexie from v3 to v4 and add a \`windowStates\` table. Keep all existing stores unchanged. Add an idempotent upgrade that creates no synthetic open windows.

4. Add \`windowStateRepo\` methods:

   - list/get by app id;
   - upsert validated state;
   - delete state;
   - clear all;
   - normalize/clamp state before persistence.

5. Extend backup export/import to include the new table and settings fields. Preserve compatibility with older backups by applying defaults for missing optional values. Update \`BACKUP_SCHEMA_VERSION\` only if the envelope contract requires it; otherwise accept older row shapes within the existing schema.

6. Update seed/defaults so a fresh install receives stable, restrained defaults:

   - restore-on-reload off;
   - no magnification on touch;
   - capped canvas;
   - collision-free placement;
   - conservative translucency;
   - a coherent icon treatment instead of randomized app gradients.

7. Keep repository exports and hooks aligned with the current layering contract.

### Verification

Run the new targeted repository tests, then:

- \`npm run typecheck\`
- \`npm run lint\`
- \`npm run test\`

Commit: \`feat: add v1.1 state contracts and persistence migration\`

## Task 2: Make Home the permanent workspace

### Tests first

Update/add tests that prove:

- launching Notes, Calendar, Settings, and other window apps from Home leaves Home icons/widgets visible;
- launching two apps leaves both windows visible;
- the Apps/Launchpad surface opens as an overlay;
- selecting an app from Launchpad opens its window/sheet without navigating to a separate Dashboard page;
- Home remains the background after closing an app;
- Escape and outside click dismiss the launcher without closing the active app.

Update test helpers so \`openApp\` launches directly from the dock or Home and remove assumptions that Dashboard mode must be entered first.

### Implementation

1. Refactor \`App.tsx\` so the stable base is Home. Render:

   - Backdrop;
   - MenuBar;
   - HomeMode;
   - FolderView/AppLauncher overlays;
   - WindowsHost or mobile sheet host;
   - Dock;
   - SearchOverlay and dialogs.

2. Keep the internal mode state only if it is useful for compatibility, but stop rendering a separate Dashboard overview as a primary page. Do not leave a dead mode switch in the user-facing status bar.

3. Convert the existing Dashboard launcher entry to Apps/Launchpad behavior. It must no longer call \`setMode('dashboard')\` to replace Home.

4. Add \`AppLauncher.tsx\` as an accessible overlay:

   - one dialog landmark;
   - keyboard navigation;
   - Escape dismissal;
   - focus restoration;
   - app icons and labels;
   - responsive grid;
   - bounded height with internal scroll only if the app inventory cannot fit.

5. Move window/sheet rendering to a single shell host that uses the same app content components. Keep desktop traffic lights and mobile back affordance.

6. Remove the condition in \`DashboardMode\` that hides the overview when \`focusOrder.length > 0\`; the new host must not depend on an overview replacement model. Delete or repurpose dead Dashboard overview code only after references and tests are updated.

7. Update dock active-state logic so running windows and sheets show indicators while Home remains active underneath.

### Verification

Run the updated shell, windows, mobile-sheet, and navigation E2E specs at desktop and mobile widths.

Commit: \`feat: make home the persistent app workspace\`

## Task 3: Persist and restore window state

### Tests first

Add unit tests for:

- opening a new window with a default geometry;
- reopening an existing minimized window;
- restoring stored geometry;
- clamping stored geometry after viewport shrink;
- persisting move, resize, maximize, minimize, and close actions;
- restore-on-reload off by default;
- restore-on-reload on reopening only valid previously open windows;
- deleting a closed app’s state when the user explicitly clears it;
- focus order remaining ephemeral unless deliberately persisted.

Add E2E coverage for desktop reload persistence and mobile sheet behavior.

### Implementation

1. Separate ephemeral presentation from persisted window state:

   - Zustand remains the immediate interaction store;
   - Dexie stores durable geometry and user-selected restore data;
   - a repository adapter hydrates initial state after boot;
   - writes are debounced/coalesced for drag and resize, with a final write on pointer-up/unmount.

2. Avoid per-pointer-move IndexedDB writes. Keep the live drag in Zustand/refs and persist only meaningful settled geometry.

3. Normalize geometry at three points:

   - default creation;
   - hydration;
   - viewport resize.

4. Add viewport measurement to \`WindowsHost\` and clamp both restored and live geometry against the usable stage, accounting for status bar, dock, safe areas, and minimum visible titlebar area.

5. Add actual resize handles or a clear maximize/restore path if the current window host exposes resize state without a usable pointer interaction.

6. Persist minimized/maximized state and restore it consistently with dock indicators. Do not restore a minimized window onto the visible stage unless the user activates it.

7. Make mobile sheet state ephemeral by default. Reopen the sheet only from an explicit user action, not from a desktop window record.

8. Document the cross-origin iframe limitation in the Embed UI/help and release docs.

### Verification

Run unit persistence tests, \`e2e/windows.spec.ts\`, mobile-sheet tests, and the full typecheck/lint/test gate.

Commit: \`feat: persist app window state\`

## Task 4: Replace the visual system and icon treatment

### Tests first

Add focused DOM/CSS contract checks for:

- no random HSL gradient generation for built-in app icons;
- all icon styles expose accessible labels;
- icon style/shape settings alter the shared data attributes/classes;
- dock fits at 320px and 390px without horizontal overflow;
- status-bar controls remain inside the viewport;
- transparency endpoints change computed shared material values;
- reduced effects disables blur and uses an opaque fallback;
- reduced motion removes large transforms.

### Implementation

1. Rework tokens into clear tiers:

   - window/surface/material radii;
   - control radii;
   - 8px spacing;
   - status/dock/window heights;
   - content-safe insets;
   - optical icon sizes;
   - material alpha/blur/saturation;
   - contrast and wallpaper dimming;
   - motion durations/curves.

2. Make \`glass.css\`, \`global.css\`, and all shell surfaces consume the shared material aliases. Remove ad hoc radius/fill/shadow recipes where an alias exists.

3. Implement one icon presentation layer in \`Glyph.tsx\` and use it from Home, Dock, Launchpad, folders, and app windows. Do not create separate gradient recipes in \`Dock.tsx\` or \`DashboardMode.tsx\`.

4. Provide restrained icon families/treatments through classes/data attributes. Use existing local icon sources and platform-safe system fonts. Do not add copied Figma/Apple vectors.

5. Redesign MenuBar as a compact system bar. Preserve \`mmoptibuilds\` branding, but make the control hierarchy read as a system surface rather than a website header.

6. Redesign Dock as a narrow, measured launcher:

   - optical icon alignment;
   - small running indicators;
   - optional fine-pointer magnification;
   - no rainbow tile gradients;
   - no oversized capsule;
   - add/edit affordances that do not intercept unrelated desktop clicks.

7. Tune window titlebars, inactive windows, modal cards, folders, search, Control Center, and mobile sheets to share the same geometry and focus language.

8. Add safe-area and viewport CSS. Set the shell root and body to fixed viewport behavior. Keep all scroll ownership explicit.

9. Use the motion gate:

   - CSS transitions for hover/press/material changes;
   - short enter/exit transitions for occasional overlays;
   - direct drag tracking and a short settle transition;
   - no GSAP dependency unless implementation proves a real coordinated timeline is necessary.

### Verification

Run shell/polish/glass/motion/a11y specs. Inspect light, dark, high-transparency, reduced-effects, reduced-motion, 320px, 390px, 768px, and 1440px states.

Commit: \`feat: establish hearth os visual system\`

## Task 5: Make Home layout collision-free and viewport-bounded

### Tests first

Extend \`src/data/layout/geometry.test.ts\` for:

- no overlap after a committed move;
- nearest valid placement when the requested position collides;
- no position outside any canvas edge;
- resize clamping on right and bottom edges;
- minimum sizes per item kind;
- no valid placement leaves the prior box unchanged;
- guide calculations remain independent from collision resolution;
- deterministic results for the same item set and viewport.

Add E2E tests for:

- moving a tile into another tile does not overlap after release;
- resizing a widget cannot push it beyond the bottom or right edge;
- changing viewport size clamps visible items;
- multiple widgets remain distinct at all required widths;
- Home has no vertical scrollbar.

### Implementation

1. Replace the current geometry behavior that allows overlap on drop. Keep soft snapping and guides, but add a separate collision resolver that returns a valid settled box.

2. Define a single usable canvas contract:

   - hard width cap;
   - measured width below the cap;
   - measured height between status bar and dock;
   - minimum inset around the edges;
   - item-kind minimum boxes.

3. Update \`findFreeSpot\`, \`resolveMove\`, \`resolveResize\`, and any pack/migration logic to share collision and bounds helpers.

4. Ensure item addition, migration, backup backfill, drag, keyboard nudge, and resize all use the same rules. No path may produce a box that another path considers invalid.

5. Remove Home page-level \`overflow-y: auto\`. Keep the horizontal page strip only if it is the platform’s intentional page gesture, and ensure it does not create a page-style document scroll.

6. Rework freeform canvas height to remain inside the usable viewport. If content cannot fit, reject the placement or use the nearest valid position. Do not grow the canvas below the viewport.

7. Keep freeform drag state in refs/local state during the gesture, but persist only the final valid geometry.

8. Preserve compact mobile layout, but use the same min/max content contract so a widget’s rendered box cannot be smaller than its useful empty state.

### Verification

Run geometry unit tests, freeform/home/responsive E2E tests, and a viewport sweep at 320, 360, 390, 430, 768, 1024, 1280, and 1440px.

Commit: \`fix: bound home layout and prevent widget overlap\`

## Task 6: Repair widgets, Links, and embedded apps

### Tests first

Add:

- a BookmarksWidget test that renders more links than the visible height and verifies the list is internally scrollable rather than hidden;
- a resize-focused E2E test that expands and shrinks a Links widget and checks that rows remain reachable;
- an embed test for narrow toolbar wrapping and bounded iframe geometry;
- an embed fullscreen/maximize test where the browser supports it;
- a test that blocked/blank embed fallback leaves the toolbar usable;
- a test that widget content never escapes the tile bounds.

### Implementation

1. Change BookmarksWidget sizing behavior:

   - remove fixed row clipping as the only behavior;
   - keep a flex column header;
   - give the list \`min-height: 0\` and \`overflow-y: auto\`;
   - reserve enough height for an intentional empty state;
   - use container queries to adjust row density only within the supported minimum.

2. Audit all widgets for the same pattern: \`height: 100%\`, flex boundaries, \`min-height: 0\`, internal overflow, truncation, and toolbar wrapping.

3. Rebuild EmbedWidget layout so the toolbar and iframe are separate bounded regions rather than an overlay that can hide content.

4. Add an explicit expand/fullscreen action with feature detection. The fallback must be a normal maximize/expand state if native fullscreen is unavailable.

5. Persist only the embed URL and Hearth-owned display preferences. Keep iframe sandbox/referrer policy and safe URL validation unchanged.

6. Make external open behavior clear and keyboard accessible. Do not force a blocked external site to work inside an iframe.

7. Review Notes, Tasks, Calendar, Links, Calculator, Settings, and Search app surfaces for flex-chain failures that cause clipped or overflowing content.

### Verification

Run widget feature tests, apps, calculator, settings, embed, responsive, and mobile-sheet E2E specs.

Commit: \`fix: contain widget and embed content\`

## Task 7: Rebuild Settings around real system controls

### Tests first

Add settings repository/UI tests for:

- every new setting’s default;
- every enum/value validation path;
- immediate live material updates;
- persistence across reload;
- old rows receiving new defaults;
- restore-on-reload behavior;
- icon/dock/layout setting changes;
- reduced transparency/effects fallback.

### Implementation

1. Split settings into clear groups:

   - Appearance;
   - Icons;
   - Dock;
   - Home and layout;
   - Windows and apps;
   - Embedded content;
   - Motion and accessibility;
   - Wallpaper;
   - Data/About.

2. Keep Simple mode focused on safe, high-value controls. Put detailed visual and behavior controls in Advanced mode.

3. Connect every control to the repository and live theme/material attributes. Remove controls that do not change the rendered shell.

4. Update \`applyThemeAttributes\` so transparency changes are visible on real surfaces, including wallpaper dimming and solid fallbacks.

5. Add a shared preview that uses the same material tokens as the status bar, window, and dock. The preview must not claim a setting works if it only changes an unused variable.

6. Keep labels and descriptions short, specific, and user-facing. Apply the writing skill to remove generic “seamless/powerful/beautiful” copy.

### Verification

Run settings, glass, polish, a11y, and motion specs in light/dark/reduced states.

Commit: \`feat: expand system settings\`

## Task 8: Responsive and interaction hardening

### Tests first

Add a dedicated responsive regression suite or extend \`e2e/responsive.spec.ts\` with assertions for:

- no body/document horizontal or vertical scroll;
- no shell child escapes the viewport;
- status bar, dock, launchpad, folders, windows, sheets, modals, and edit controls fit;
- internal app scrolling exists only where expected;
- focus remains visible and restorable;
- touch mode has no hover-only requirement;
- keyboard arrows/nudge/resize remain usable;
- rotation/viewport changes do not destroy state.

### Implementation

1. Audit every flex/grid boundary for \`min-width: 0\` and \`min-height: 0\`.

2. Use \`ResizeObserver\` only where a measured canvas/window is required. Avoid layout reads in per-frame loops.

3. Gate hover/magnification effects behind fine-pointer media queries.

4. Ensure launchpad, control center, search, folder views, and modals have owned dismissal, focus trap/restoration, and safe-area padding.

5. Ensure all interactive controls have accessible names, visible focus, and touch hit areas.

6. Check reduced-motion and reduced-effects paths after every motion/material change.

7. Use browser verification against a production build. Capture representative frames for Home, Launchpad, Notes, Links, Embed, Settings, folder, Control Center, and window stacking at desktop and phone sizes.

### Verification

Run the complete responsive, a11y, motion, polish, shell, window, mobile-sheet, and PWA suites.

Commit: \`test: harden v1.1 responsive interactions\`

## Task 9: Release metadata and documentation

### Implementation

1. Bump \`package.json\` to \`1.1.0\`. Keep the Settings About version synchronized.

2. Update Vite/PWA manifest name/description only where the release identity changes. Keep installability and offline behavior intact.

3. Rewrite README behavior to describe Home as the desktop and Apps/Launchpad as an overlay. Document internal app scrolling and the cross-origin embed limitation.

4. Add a \`[1.1.0]\` CHANGELOG entry covering structural, visual, persistence, widget, embed, responsive, accessibility, and documentation changes.

5. Update DESIGN with the final Hearth OS material, icon, spacing, dock, window, motion, and responsive rules.

6. Update PRODUCT_SPEC to make Home the primary workspace, remove the separate Dashboard page contract, and add persisted window state and no-shell-scroll requirements.

7. Update ARCHITECTURE with Dexie v4, window-state repository boundaries, AppLauncher, shell viewport contract, and collision-free layout rules.

8. Update ROADMAP so shipped v1.1 items are no longer described as V2/V3 deferrals. Keep genuinely deferred shader/refraction, sync, auth, and marketplace work deferred.

9. Update QA_CHECKLIST with exact v1.1 evidence and remove stale claims about 50 tests/35 E2E if the suite has moved on.

10. Update BUILD_STATE and V2_STATUS newest-first with:

    - branch and commit;
    - files/surfaces changed;
    - migration details;
    - test/build/E2E results;
    - visual review states;
    - known cross-origin iframe limitation;
    - no copied Figma assets;
    - no WebGL dependency unless the implementation unexpectedly requires and separately approves one.

11. Mark the earlier visual-system spec as superseded by the Hearth OS v1.1 design record. Do not silently leave contradictory “approved” instructions in the repository.

### Verification

Run a repository-wide stale-language search for:

- “Dashboard Mode” as a separate primary page;
- “ordered grid only”;
- “no database schema changes”;
- old version \`1.0.0\`;
- claims that the shell never scrolls while a child still does.

Commit: \`docs: document hearth os v1.1 release\`

## Task 10: Full verification and handoff

### Required commands

Run exactly:

- \`npm run lint\`
- \`npm run typecheck\`
- \`npm run test\`
- \`npm run build\`
- \`npx playwright test --project=desktop --project=mobile\`
- \`git diff --check\`

Rebuild before E2E. Do not report an E2E result from a stale bundle.

### Manual checks

Inspect at minimum:

- Home with starter content;
- Home with multiple widgets;
- tile move into an occupied area;
- widget resize at top/bottom/right edges;
- Launchpad open/close;
- Notes and Calendar windows stacked;
- minimized window restored from dock;
- mobile app sheet;
- Links widget at multiple sizes;
- Embed widget configured, blocked, expanded, and narrow;
- Settings Simple and Advanced;
- light, dark, high-transparency, reduced-effects, and reduced-motion states;
- 320px, 390px, 768px, 1024px, 1280px, and 1440px viewports.

### Completion criteria

Do not claim completion unless:

- all required commands pass or a precise pre-existing/environment limitation is recorded;
- no body/shell/Home page scroll exists;
- only bounded app/embed content scrolls;
- widgets cannot overlap or leave bounds;
- app windows no longer hide Home;
- persisted state reloads correctly;
- documentation matches the implementation;
- the branch contains only intended changes;
- the final commit SHA and changed paths are recorded.

Final implementation commit should use:
\`feat: release hearth os v1.1 visual overhaul\`
