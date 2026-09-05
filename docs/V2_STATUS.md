# V2 STATUS — Hearth overhaul ledger

Working ledger for the V2 "macOS/iOS-quality dashboard" overhaul. One section
per completed workstream, most recent first. The authoritative plan is the
task list; this file records what changed, evidence, and open follow-ups.

Branch: `build/v1-one-shot` (V2 continues on top of the V1 one-shot build).

## 0 — Baseline + reported Add bug (done)

### Baseline (recorded before any V2 change)
- 13 viewports × 2 states captured pre-fix in `.shots/v2-baseline/` and
  post-fix in `.shots/v2-after/` (`1920/1440/1366/1280/1024/834/768/430/393/
  390/375/360/320` × Home + Edit-Mode Add-to-dock). Sweep also asserts no
  horizontal overflow and no console/page errors: **overflowX=0 everywhere,
  0 console errors** on both runs.
- Captured with `e2e/baseline.spec.ts` (`BASELINE_OUT` selects the dir). It is
  a capture tool, not an assertion suite.

### Reported bug — reproduced & root-caused
**Symptom:** "Entering Edit Mode, pressing Add — UI appears but nothing inside
is clickable, and clicking dismisses the screen."
**Reproduction (Playwright, pre-fix):** every other Add surface (Shortcut /
Folder / Widget pickers) works; the Edit-Mode **dock "Add to dock"** popover is
broken on desktop *and* mobile. `document.elementsFromPoint()` at the centre of
a candidate row returned the **Home `.page` section**, not the row; computed
`pointer-events` of `.addPop` and its rows was **`none`**.
**Root cause:** `src/components/shell/dock.module.css` sets `.dock {
pointer-events: none }` so the wide fixed strip never blocks the page, and only
`.bar` re-enables `pointer-events: auto`. The `.addPop` popover floats above
the page too but never opted back in, so it and its rows inherited `none`:
painted but inert. Every click fell through to the page beneath and the
document outside-close handler then dismissed the popover.
**Fix:** `pointer-events: auto` on `.addPop` (with a comment explaining the
opt-in pattern).
**Regression test:** `e2e/dock-edit.spec.ts` — enters Edit Mode, opens
Add-to-dock, clicks a candidate row, asserts the item is pinned, the popover
closed itself, Edit Mode is intact, and the pin survives reload. Fails pre-fix
(row click can never land), passes post-fix on desktop + mobile.

### Follow-ups opened
- **A11y (a11y sweep):** in Edit Mode dnd-kit spreads `role="button"` +
  listeners onto each dock tile's *wrapper div*, whose accessible name
  duplicates the real launcher `<button>`'s label — redundant interactive
  element per tile for assistive tech.
- **Pattern sweep (bug sweep):** audit other `pointer-events:none` containers
  (backdrop, windows, home, bookmarks, settings, builtins) for popovers that
  render inside them without re-enabling pointer events — same bug class.
