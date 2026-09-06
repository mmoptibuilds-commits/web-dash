> **Superseded for v1.1.0.** Use `docs/superpowers/plans/2026-09-06-hearth-os-v1-1-overhaul.md` for the approved structural and visual release plan.

# Hearth macOS/iOS Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply one coherent Apple-inspired visual system to Hearth's desktop shell, mobile launcher, widgets, folders, popovers, windows/sheets, embedded apps, and mini-app surfaces while preserving existing V1 behavior.

**Architecture:** Keep the existing React, CSS Modules, Zustand, Dexie, and shell/feature boundaries. Centralize material, radius, spacing, color, type, shadow, and reduced-effects rules in the shared style layer, then make each surface consume those recipes. Visual changes stay CSS-first; any behavior change is limited to accessibility or responsive presentation and receives a focused regression check.

**Tech Stack:** React 19, TypeScript, Vite, CSS Modules, CSS custom properties, `backdrop-filter`, Lucide icons, Dexie/IndexedDB, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-06-macos-ios-visual-system-design.md`

## Global Constraints

- Use the supplied macOS/iOS resources as visual references; do not copy proprietary Apple fonts, icons, wallpapers, or UI assets into the product.
- Use CSS materials only: layered fills, borders, shadows, gradients, `backdrop-filter`, and explicit reduced-effects fallbacks.
- Do not add `liquidGL-main`, WebGL, refraction shaders, external services, auth, analytics, backend code, or V2/V3 features.
- Preserve the visible `mmoptibuilds` wordmark, local-first data, navigation, persistence, feature contracts, and repository boundaries.
- Keep desktop windows at desktop widths and full-height sheets at mobile widths; preserve safe areas, touch targets, focus states, and no-horizontal-overflow guarantees.
- Only edit the owned source/style/docs paths listed by each task; leave `assets/`, `liquidGL-main/`, `_v2prompt.md`, and `issues.txt` untouched.

## File map

- Shared visual language: `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/glass.css`, `src/styles/motion.css`.
- Shell chrome: `src/components/shell/backdrop.module.css`, `src/components/shell/menubar.module.css`, `src/components/shell/windows.module.css`, `src/components/shell/dock.module.css`, `src/components/common/Glyph.module.css`, `src/components/common/Modal.module.css`.
- Home and system overlays: `src/features/home/home.module.css`, `src/features/home/HomeDialogs.tsx`, `src/features/home/FolderView.tsx`, `src/features/search/search.module.css`, `src/features/widgets/builtins/builtins.module.css`.
- Dashboard and app surfaces: `src/features/dashboard/dashboard.module.css`, `src/features/notes/notes.module.css`, `src/features/tasks/tasks.module.css`, `src/features/calendar/calendar.module.css`, `src/features/bookmarks/bookmarks.module.css`, `src/features/calculator/calculator.module.css`, `src/features/settings/settings.module.css`.
- Verification/documentation: existing `e2e/*.spec.ts`, co-located feature tests, `docs/V2_STATUS.md`.

### Task 1: Establish the shared Apple-inspired material system

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/styles/glass.css`
- Modify: `src/styles/motion.css`
- Test: existing `src/features/settings/settingsRepo.test.ts` and full Vitest suite

**Interfaces:**
- Consumes: existing `--glass-*`, `--r-*`, `--sp-*`, `--fs-*`, `--shadow-*`, `--blur-*`, `--dur-*`, theme, and reduced-effects tokens.
- Produces: stable shared recipes consumed by shell and feature CSS: material fills, borders, shadows, radii, control geometry, typography, focus ring, safe-area spacing, and reduced-effects overrides.

- [ ] **Step 1: Inventory existing shared literals**

  Run:

  ```powershell
  rg -n "border-radius:|background:|box-shadow:|backdrop-filter:|font-size:|padding:|gap:" src/styles src/components src/features --glob '*.css'
  ```

  Group the results into shared material, controls, icon tiles, and app-only visuals before editing.

- [ ] **Step 2: Normalize the token hierarchy**

  Keep one quiet-to-elevated material progression and add named aliases for surfaces and controls. Every alias must resolve to existing token values, for example:

  ```css
  --surface-radius: var(--r-lg);
  --control-radius: var(--r-sm);
  --surface-gap: var(--sp-3);
  --surface-pad: var(--sp-4);
  --glass-a-sheet: 0.82;
  ```

  Keep light/dark theme overrides explicit and make `[data-effects='reduced']` set all fill alpha tokens and `--glass-a-sheet` to `1`, with all blur tokens at `0px`.

- [ ] **Step 3: Make shared primitives consume the hierarchy**

  Update `.btn`, `.icon-btn`, `.field`, `.glass`, scrollbar, focus, and reduced-motion rules to use the aliases. Keep transitions property-specific and retain visible `:focus-visible` replacements wherever `outline` is removed.

- [ ] **Step 4: Verify the shared layer**

  Run:

  ```powershell
  npm run lint
  npm run typecheck
  npm run test
  ```

  Expected: zero lint/type errors and all existing Vitest tests pass.

- [ ] **Step 5: Commit the shared-system slice**

  ```powershell
  git add src/styles/tokens.css src/styles/global.css src/styles/glass.css src/styles/motion.css
  git commit -m "feat: establish shared apple-inspired material system"
  ```

### Task 2: Polish the desktop shell and mobile chrome

**Files:**
- Modify: `src/components/shell/backdrop.module.css`
- Modify: `src/components/shell/menubar.module.css`
- Modify: `src/components/shell/windows.module.css`
- Modify: `src/components/shell/dock.module.css`
- Modify: `src/components/common/Glyph.module.css`
- Modify: `src/components/common/Modal.module.css`
- Preserve: `src/components/shell/MenuBar.tsx` visible label `mmoptibuilds`
- Test: `e2e/shell.spec.ts`, `e2e/windows.spec.ts`, `e2e/dock-edit.spec.ts`, `e2e/polish.spec.ts`

**Interfaces:**
- Consumes: Task 1 material/control recipes and the existing `MenuBar`, `WindowsHost`, `Dock`, `Backdrop`, `Glyph`, and `Modal` DOM contracts.
- Produces: macOS-like desktop chrome and iOS-like compact mobile chrome without changing shell state or app launch semantics.

- [ ] **Step 1: Tune the backdrop and chrome contrast**

  Keep the wallpaper full-bleed and use a light edge/scrim gradient for readable chrome. Ensure uploaded wallpaper media remains contained, and preserve the existing reduced-effects behavior.

- [ ] **Step 2: Tune the status bar**

  Use a compact layered material with a quiet brand lockup, restrained mode switch, visible focus, and safe-area padding. At `max-width: 639px`, keep labels visually compact while retaining accessible names and hit areas. The visible brand text must remain:

  ```tsx
  <span className={styles.brandText}>mmoptibuilds</span>
  ```

- [ ] **Step 3: Tune windows, sheets, and modal cards**

  Use the shared surface radius/material, quiet hairlines, front/inactive shadow separation, macOS traffic-light sizing, and contained content scrolling. Keep mobile sheets full-height with a centered title, back affordance, grab handle, and `overscroll-behavior: contain`.

- [ ] **Step 4: Tune the dock and icon recipe**

  Keep the dock centered and fluid on narrow screens. Use squircle icon tiles, optical glyph sizing, a small active indicator, and a clear edit-mode add tile. Avoid a fixed-width row that can overflow the viewport.

- [ ] **Step 5: Verify shell behavior and visual geometry**

  Run:

  ```powershell
  npx playwright test e2e/shell.spec.ts e2e/windows.spec.ts e2e/dock-edit.spec.ts e2e/polish.spec.ts
  ```

  Confirm desktop windows, mobile sheets, dock add/reorder, status controls, and no-console-error journeys remain green.

- [ ] **Step 6: Commit the shell slice**

  ```powershell
  git add src/components/shell src/components/common/Glyph.module.css src/components/common/Modal.module.css
  git commit -m "feat: polish desktop shell and mobile chrome"
  ```

### Task 3: Match Home, widgets, folders, and edit surfaces to the references

**Files:**
- Modify: `src/features/home/home.module.css`
- Modify: `src/features/home/HomeDialogs.tsx` only when a visual state lacks an accessible label or responsive affordance
- Modify: `src/features/home/FolderView.tsx` only when the centered folder card needs a semantic state hook
- Modify: `src/features/widgets/builtins/builtins.module.css`
- Modify: `src/features/search/search.module.css`
- Test: `e2e/home.spec.ts`, `e2e/freeform.spec.ts`, `e2e/responsive.spec.ts`, `e2e/search-nav.spec.ts`

**Interfaces:**
- Consumes: existing layout item, widget registry, folder, search, and edit-mode DOM contracts.
- Produces: reference-led Home density, self-contained widget panels, iOS-style folder cards, and responsive pickers.

- [ ] **Step 1: Tune Home canvas density and shortcut icons**

  Use a calm grid with enough wallpaper breathing room, system-like labels, and consistent optical sizes for shortcut, folder, and widget tiles. Preserve the desktop freeform canvas and mobile compact grid behavior.

- [ ] **Step 2: Tune built-in widget panels**

  Make Clock, Search, Photo, Embed, Notes, Tasks, Calendar, Bookmarks, and Calculator widgets use the same glass panel recipe and container-query density. Ensure long labels truncate and empty states remain intentional.

- [ ] **Step 3: Tune edit-mode pickers**

  Make widget picker rows, shortcut/folder forms, resize chips, remove controls, and dock add popovers match the shared control recipe. Keep the picker above the dock and ensure it remains clickable at phone widths.

- [ ] **Step 4: Tune the folder overlay**

  Preserve the existing centered frosted card, title/count header, four-column icon grid, rename/add/delete actions, and safe overlay scroll. At phone widths, collapse visual button labels without removing accessible text, and keep the card inside the safe viewport.

- [ ] **Step 5: Tune search overlay and suggestion states**

  Use the elevated material, readable query field, predictable suggestion row height, active state, and modal scrim. Keep URL/search routing unchanged.

- [ ] **Step 6: Verify Home and widget behavior**

  Run:

  ```powershell
  npx playwright test e2e/home.spec.ts e2e/freeform.spec.ts e2e/responsive.spec.ts e2e/search-nav.spec.ts
  ```

  Exercise 1440px, 1024px, 768px, 430px, 390px, 360px, and 320px through the existing viewport and container-query tests. Expected: zero horizontal overflow and no clipped in-flow widget content.

- [ ] **Step 7: Commit the Home/widget slice**

  ```powershell
  git add src/features/home src/features/widgets/builtins/builtins.module.css src/features/search/search.module.css
  git commit -m "feat: tune home widgets and ios-style folders"
  ```

### Task 4: Polish every mini-app and embedded surface

**Files:**
- Modify: `src/features/dashboard/dashboard.module.css`
- Modify: `src/features/notes/notes.module.css`
- Modify: `src/features/tasks/tasks.module.css`
- Modify: `src/features/calendar/calendar.module.css`
- Modify: `src/features/bookmarks/bookmarks.module.css`
- Modify: `src/features/calculator/calculator.module.css`
- Modify: `src/features/settings/settings.module.css`
- Modify: `src/features/bookmarks/bookmarksMiniApp.test.tsx` only if the existing async deletion observation remains timing-sensitive
- Test: `e2e/apps.spec.ts`, `e2e/calculator.spec.ts`, `e2e/settings.spec.ts`, `e2e/mobile-sheet.spec.ts`, `e2e/polish.spec.ts`

**Interfaces:**
- Consumes: Task 1 recipes, the shell window/sheet hosts, and existing feature markup/repository hooks.
- Produces: first-party-looking Notes, Tasks, Calendar, Links, Calculator, Settings, Dashboard, and Embed experiences with unchanged data behavior.

- [ ] **Step 1: Normalize feature toolbars and fields**

  Use shared control radii, spacing, focus rings, placeholder copy, and field fills. Keep each feature’s own density: Notes/editor and Calculator can be denser than Settings, while mobile controls stay touch-sized.

- [ ] **Step 2: Tune Dashboard overview cards**

  Use a balanced heading block, two-column desktop cards, one-column mobile cards, smaller optical glyph tiles, and quiet elevation. Keep the overview scrollable behind the dock-safe bottom padding.

- [ ] **Step 3: Tune Notes and Tasks**

  Give Notes a narrow list pane, readable editor body, selected-note state, autosave indicator, and mobile editor sheet. Give Tasks a compact add row, clear check affordance, inline edit state, and footer summary.

- [ ] **Step 4: Tune Calendar, Links, and Calculator**

  Keep Calendar’s month grid calm and tabular, Links’ rows scannable with favicon fallbacks and confirmation state, and Calculator’s tabs/key grid visually close to a native utility while preserving Basic, Dates, and Currency behavior.

- [ ] **Step 5: Tune Settings and material preview**

  Make Settings read like a system preferences pane: segmented navigation, grouped appearance controls, wallpaper/glass preview, transparency slider, reduced-effects switch, and backup controls. Keep the preview honest about the active material tokens.

- [ ] **Step 6: Tune embedded app states**

  Keep the Embed widget’s host label, open-in-tab action, blocked-frame fallback, responsive controls, and safe iframe policy. Ensure the fallback is polished in both a widget tile and a full app surface.

- [ ] **Step 7: Verify all mini-app journeys**

  Run:

  ```powershell
  npx playwright test e2e/apps.spec.ts e2e/calculator.spec.ts e2e/settings.spec.ts e2e/mobile-sheet.spec.ts e2e/polish.spec.ts
  ```

  Expected: Notes/Tasks persistence, Calendar navigation, Calculator modes, Settings persistence, mobile sheet gestures, embeds, and dock launch all pass.

- [ ] **Step 8: Commit the feature-surface slice**

  ```powershell
  git add src/features/dashboard src/features/notes src/features/tasks src/features/calendar src/features/bookmarks src/features/calculator src/features/settings
  git commit -m "feat: polish mini-app and embedded surfaces"
  ```

### Task 5: Run the complete visual/a11y/regression gate and record evidence

**Files:**
- Modify: `docs/V2_STATUS.md`
- Test: all existing unit and Playwright suites; generated screenshots remain outside tracked source

**Interfaces:**
- Consumes: all previous task slices and the approved design spec.
- Produces: a verified production build, screenshot audit, documented evidence, and a clean branch ready to push.

- [ ] **Step 1: Build the production preview**

  Run:

  ```powershell
  npm run build
  ```

  Expected: Vite/PWA build exits `0`; the existing large-chunk warning may remain documented as a non-failing warning.

- [ ] **Step 2: Capture the visual audit with Playwright**

  Start the production preview or use the repository’s E2E web server, then capture Home, Dashboard, Notes, Tasks, Calendar, Links, Calculator, Settings, folders, search, Control Center, edit pickers, and embed fallback at desktop and mobile widths. Repeat light, dark, high-transparency, and reduced-effects states. Record viewport overflow and console/page errors in the audit output.

- [ ] **Step 3: Run the complete verification commands**

  ```powershell
  npm run typecheck
  npm run lint
  npm run test
  npm run test:e2e
  git diff --check
  ```

  Expected: 0 failures, no horizontal overflow, no console/page errors, and the existing intentional platform skips only.

- [ ] **Step 4: Update the ledger**

  Add the final changed surfaces, screenshot states, exact command results, the unavailable optional `agent-browser` fallback if still applicable, and the explicit note that `liquidGL-main` was not integrated because V1 prohibits WebGL/refraction.

- [ ] **Step 5: Commit the verification record**

  ```powershell
  git add docs/V2_STATUS.md
  git commit -m "docs: record macos ios visual verification"
  ```

- [ ] **Step 6: Push the finished branch**

  Confirm the remote and branch, then run:

  ```powershell
  git remote -v
  git push -u origin build/v1-one-shot
  ```

  Expected: the current branch is pushed without force-updating or deleting any remote data.

## Plan self-review

- **Spec coverage:** shared tokens (Task 1), desktop shell (Task 2), mobile shell (Tasks 2 and 5), Home/widgets/folders (Task 3), mini-apps/embeds (Task 4), reduced-effects and safe areas (Tasks 1–5), visual and functional verification (Task 5), and asset/WebGL constraints (Global Constraints and Task 5) are all covered.
- **Placeholder scan:** no `TBD`, `TODO`, `FIXME`, or undefined future action is used; every task names concrete files, selectors/recipes, commands, and expected outcomes.
- **Type consistency:** the plan consumes existing CSS custom properties and DOM contracts; it does not introduce new TypeScript interfaces, registry entries, database tables, or repository methods.
- **Scope check:** the process on port `5198` is an external cleanup result rather than an application change; the plan does not invent a replacement server or modify process management.
