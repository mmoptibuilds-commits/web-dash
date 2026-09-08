import { expect, test, type Locator, type Page } from '@playwright/test'
import { boot, enterEdit, exitEdit, goDashboard, goHome } from './helpers'

/**
 * #33 — A11y / keyboard / focus / semantics (programmatic, axe-free).
 *
 *  1. Every keyboard Tab lands on a control whose computed styles show a real,
 *     visible focus treatment (the global `:focus-visible` outline or an
 *     authored `--focus-ring` replacement).
 *  2. A modal dialog traps Tab + Shift+Tab inside its card and hands focus back
 *     to the opener on Escape (Modal.tsx + lib/focus.ts WAI-ARIA dialog).
 *  3. A semantic scan over Home and Dashboard surfaces finds no unnamed
 *     interactive control, no focusable node under `aria-hidden`, no duplicate
 *     ids, and the modals the flow opens carry aria-modal + a resolved name.
 *  4. Regression: Escape returns focus to the opener even when the dialog's
 *     first control carries native autoFocus (Add-shortcut Name field). React
 *     applies autoFocus during commit, BEFORE the passive effect reads
 *     document.activeElement, so Modal.tsx captures the opener during the render
 *     that opens the dialog; restoring to the dialog's own input would no-op
 *     once it disconnects and strand focus on <body> (WCAG 2.4.3).
 *
 * All four run on the desktop project only (window-modal + full keyboard
 * contract); mobile sheets/menus are covered by mobile-sheet.spec.ts.
 */

/**
 * TEST 1 — the visible-focus recipe. A control keyboard-focused via Tab must
 * show a real focus treatment: the global `:focus-visible` outline
 * (src/styles/global.css:93 `outline: 2px solid var(--accent)`) that most
 * controls — `.btn`, `.icon-btn`, radios, page title, page dots — inherit, or
 * an authored replacement ring: dock `.tile:focus-visible` (dock.module.css:61)
 * swaps the outline for `box-shadow: var(--focus-ring)` (tokens.css:84, a pure
 * `0 0 0 3px` spread). Text fields drop the outline for a caret + border/ring
 * (`.field:focus`, global.css:254) and are exempted as "visible via caret".
 */
test('33a. every keyboard Tab lands on a visibly focused control', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Keyboard focus sweep runs once on the desktop project')
  await boot(page)

  // Neutral start: nothing focused. (An "empty" mouse click would risk landing
  // on a launcher tile and navigating away, so blur programmatically instead.)
  await page.evaluate(() => {
    const ae = document.activeElement as HTMLElement | null
    if (ae && ae !== document.body && typeof ae.blur === 'function') ae.blur()
  })

  const TAB_PRESSES = 24
  const distinct = new Set<string>()
  const ringFailures: string[] = []

  for (let i = 0; i < TAB_PRESSES; i++) {
    await page.keyboard.press('Tab')
    const probe = await page.evaluate<FocusProbe>(() => {
      const el = document.activeElement
      if (
        !(el instanceof HTMLElement) ||
        el === document.body ||
        el === document.documentElement
      ) {
        return { done: true, skipped: false, path: '', ring: true, kind: '' }
      }
      // Interactive controls a keyboard user can land on.
      const interactive = el.matches(
        'button, a[href], input, textarea, select, [role="button"], [role="radio"],' +
          ' [role="switch"], [tabindex]:not([tabindex="-1"])',
      )
      if (!interactive) return { done: false, skipped: true, path: '', ring: true, kind: '' }

      // Unique DOM-path fingerprint so repeats (Tab wrapping) aren't recounted.
      const path = (() => {
        const parts: string[] = []
        let node: Element | null = el
        while (node && node.parentElement) {
          const parent = node.parentElement
          parts.unshift(
            `${node.tagName.toLowerCase()}[${Array.prototype.indexOf.call(parent.children, node) + 1}]`,
          )
          node = parent
        }
        return parts.join('/')
      })()

      // Text fields show a caret and an authored ring; treat as visible focus.
      const nonText = /^(checkbox|radio|button|submit|reset|file|range|color|hidden|image)$/
      const isTextEntry =
        el instanceof HTMLTextAreaElement ||
        el.isContentEditable ||
        (el instanceof HTMLInputElement && !nonText.test(el.type))
      if (isTextEntry) return { done: false, skipped: false, path, ring: true, kind: 'text' }

      const cs = getComputedStyle(el)
      const outlineRing =
        (cs.outlineStyle === 'solid' || cs.outlineStyle === 'auto') &&
        parseFloat(cs.outlineWidth) >= 2 &&
        cs.outlineColor !== 'transparent' &&
        cs.outlineColor !== 'rgba(0, 0, 0, 0)'
      // Replacement ring token: a pure spread shadow (0 offset / 0 blur / 2-3px
      // spread) is never present on a resting control in this design system.
      const ringShadow = /\b0px 0px 0px [23]px\b/.test(cs.boxShadow)
      return { done: false, skipped: false, path, ring: outlineRing || ringShadow, kind: 'focus' }
    })

    if (probe.done) break
    if (probe.skipped) continue
    distinct.add(probe.path)
    if (!probe.ring) ringFailures.push(`${probe.path} (kind=${probe.kind})`)
  }

  expect(
    distinct.size,
    'the Tab sweep must reach several distinct interactive controls',
  ).toBeGreaterThanOrEqual(3)
  expect(
    ringFailures,
    'every keyboard-focused control must show a visible ring:\n' + ringFailures.join('\n'),
  ).toEqual([])
})

interface FocusProbe {
  done: boolean
  skipped: boolean
  path: string
  ring: boolean
  kind: string
}

/**
 * TEST 2 — the WAI-ARIA dialog contract (Modal.tsx + src/lib/focus.ts):
 * focusLayer moves focus into the card on open, trapTab wraps Tab/Shift+Tab
 * inside it, Escape closes, and restoreFocus returns to the opener. The
 * "Add widget" picker (WidgetPickerDialog, HomeDialogs.tsx) has no native
 * autoFocus, so its first focusable is the modal header's Close button and the
 * opener anchor is captured cleanly — the full cycle is asserted end to end.
 */
test('33b. modal dialog traps focus and returns it to the opener on dismiss', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Window-modal focus contract runs on the desktop project')
  await boot(page)
  await goHome(page)
  await enterEdit(page)

  // HomeMode.tsx:1015 edit bar — <button className="btn btn-ghost">Widget</button>
  const opener = page.getByRole('button', { name: 'Widget', exact: true })
  await opener.focus()
  await expect(opener, 'opener is keyboard-focused before activation').toBeFocused()
  await page.keyboard.press('Enter')

  // HomeDialogs.tsx:350 <Modal … title="Add widget"> → role dialog, named by the
  // Modal header h2 (Modal.tsx:64-67).
  const dialog = page.getByRole('dialog', { name: 'Add widget' })
  await expect(dialog).toBeVisible()

  // (a) focus moves into the dialog card (focusLayer → first focusable: the
  //     Modal.tsx:72 header button aria-label="Close dialog").
  await expect
    .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)), {
      timeout: 5_000,
    })
    .toBe(true)

  // (b) repeated Tabs never escape the card (trapTab, focus.ts:41).
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    expect(
      await insideDialog(dialog),
      `Tab #${i + 1} must keep focus inside the dialog`,
    ).toBe(true)
  }

  // (c) Shift+Tab from the first focusable wraps to the last, still inside.
  await dialog.getByRole('button', { name: 'Close dialog' }).focus()
  await expect(
    dialog.getByRole('button', { name: 'Close dialog' }),
    'first dialog control is focused before Shift+Tab',
  ).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  expect(await insideDialog(dialog), 'Shift+Tab stays inside the dialog').toBe(true)

  // (d) Escape closes the dialog (Modal.tsx:24) and restoreFocus returns to the
  //     opener that was focused before open (focus.ts:63).
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener, 'Escape returns focus to the dialog opener').toBeFocused()
})

/** Whether the current focus lives inside `dialog` (the modal card). */
async function insideDialog(dialog: Locator): Promise<boolean> {
  return dialog.evaluate((el) => el.contains(document.activeElement))
}

/**
 * Regression for the Modal.tsx restore-timing defect (#33): a dialog whose first
 * control carries native autoFocus (the Add-shortcut Name field, HomeDialogs.tsx:157)
 * claims focus during React's commit — BEFORE a passive effect could read the real
 * opener — so Modal.tsx captures document.activeElement during the render that
 * opens the dialog. Without that capture, Escape would try to restore to the
 * dialog's own now-disconnected input and strand focus on <body> (WCAG 2.4.3).
 * Verified discriminating: with the render-time capture this passes, and against
 * the passive-effect capture it fails (focus stranded), because React's dynamic
 * autoFocus is applied at commit, ahead of the passive effect.
 */
test('33d. focus returns to the opener even when the dialog autofocuses a field', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Focus-restore contract runs on the desktop project')
  await boot(page)
  await enterEdit(page)

  // HomeMode edit toolbar shortcut button, activated by keyboard.
  const opener = page.getByRole('button', { name: 'Shortcut', exact: true })
  await opener.focus()
  await expect(opener, 'opener is keyboard-focused before activation').toBeFocused()
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'Add shortcut' }) // HomeDialogs.tsx:145 title
  await expect(dialog).toBeVisible()

  // The autofocused Name input is the initial focus target inside the dialog.
  await expect(dialog.getByLabel('Name'), 'autofocus lands on the Name field').toBeFocused()

  // Escape closes the dialog and restoreFocus returns to the Shortcut trigger —
  // NOT the dialog's now-disconnected Name input.
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(
    opener,
    'Escape returns focus to the opener after an autofocus dialog',
  ).toBeFocused()
})

/**
 * TEST 3 — semantic scan. On a seeded surface (Home boot, Dashboard overview)
 * and inside the opened modal, collect: interactive controls with no resolved
 * accessible name (approximated as aria-label → aria-labelledby → visible text
 * → title → placeholder, mirroring the ARIA naming steps), `aria-hidden="true"`
 * subtrees that still expose a focusable descendant, and duplicated element
 * ids. Assert each collection is empty.
 */
test('33c. no unnamed control, no focusable under aria-hidden, no dup ids', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Semantic scan runs once on the desktop project')
  await boot(page)

  const home = await semanticScan(page, null)
  assertClean(home, 'Home (boot)')

  // The modal we open must itself be a true modal: role dialog + aria-modal +
  // a name resolved from aria-labelledby (Modal.tsx:59-61).
  await enterEdit(page)
  await page.getByRole('button', { name: 'Widget', exact: true }).click() // HomeMode edit bar
  const dialog = page.getByRole('dialog', { name: 'Add widget' }) // HomeDialogs.tsx:350 title
  await expect(dialog).toBeVisible()
  await expect(dialog, 'Modal carries aria-modal="true"').toHaveAttribute('aria-modal', 'true')
  const labelledBy = await dialog.getAttribute('aria-labelledby')
  expect(labelledBy, 'dialog exposes an aria-labelledby id').toBeTruthy()
  if (labelledBy) {
    const titleText = await dialog.evaluate((el, id) => {
      const target = el.ownerDocument.getElementById(id)
      return target ? (target.textContent ?? '').trim() : ''
    }, labelledBy)
    expect(titleText, 'aria-labelledby resolves to the dialog title').toBe('Add widget')
  }
  const inside = await semanticScan(page, '[role="dialog"][aria-modal="true"]')
  assertClean(inside, 'dialog "Add widget"')

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await exitEdit(page)

  await goDashboard(page)
  await expect(page.getByRole('dialog', { name: 'Apps and links' })).toBeVisible()
  const dashboard = await semanticScan(page, null)
  assertClean(dashboard, 'Launchpad')
})

interface ScanResult {
  unnamed: string[]
  hiddenFocus: string[]
  dupIds: string[]
}

/**
 * Runs entirely in the page: `rootSel` of null scans the whole document, an
 * aria-modal dialog selector scans just that dialog's subtree.
 */
async function semanticScan(page: Page, rootSel: string | null): Promise<ScanResult> {
  return page.evaluate<ScanResult, string | null>(scanDom, rootSel)
}

function assertClean(result: ScanResult, where: string): void {
  expect(
    result.unnamed,
    `${where}: unnamed interactive controls:\n${result.unnamed.join('\n')}`,
  ).toEqual([])
  expect(
    result.hiddenFocus,
    `${where}: focusable nodes under aria-hidden:\n${result.hiddenFocus.join('\n')}`,
  ).toEqual([])
  expect(result.dupIds, `${where}: duplicate element ids:\n${result.dupIds.join('\n')}`).toEqual([])
}

/** Page-side scan body (no closure references — safe to serialize). */
function scanDom(rootSel: string | null): ScanResult {
  const root: Document | Element =
    rootSel === null ? document : (document.querySelector(rootSel) ?? document)

  // Interactive controls + what a Tab can land on (lib/focus.ts:8 FOCUSABLE).
  const INTERACTIVE =
    'button, a[href], input, textarea, select, [role="button"],' +
    ' [tabindex]:not([tabindex="-1"])'

  const shown = (el: Element): boolean =>
    (el as HTMLElement).getClientRects().length > 0
  const text = (el: Element): string =>
    (el.textContent || '').replace(/\s+/g, ' ').trim()
  const describe = (el: Element): string => {
    const id = el.getAttribute('id')
    const label = el.getAttribute('aria-label')
    return (
      `${el.tagName.toLowerCase()}` +
      `${id ? `#${id}` : ''}` +
      `${label ? ` aria-label="${label.slice(0, 40)}"` : ''}` +
      ` text="${text(el).slice(0, 40)}"`
    )
  }

  // Resolved-name approximation: aria-label → aria-labelledby target text →
  // visible text → title → placeholder (ARIA accname fallback order).
  const accName = (el: Element): string => {
    const ariaLabel = el.getAttribute('aria-label')
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim()
    const labelledBy = el.getAttribute('aria-labelledby')
    if (labelledBy) {
      const byName = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .filter((node): node is Element => Boolean(node))
        .map(text)
        .join(' ')
        .trim()
      if (byName) return byName
    }
    const visible = text(el)
    if (visible) return visible
    const title = el.getAttribute('title')
    if (title && title.trim()) return title.trim()
    const placeholder = el.getAttribute('placeholder')
    if (placeholder && placeholder.trim()) return placeholder.trim()
    const alt = el.getAttribute('alt')
    if (alt && alt.trim()) return alt.trim()
    return ''
  }

  // (i) Unnamed interactive controls that are actually present for the user.
  const unnamed: string[] = []
  for (const el of Array.from(root.querySelectorAll(INTERACTIVE))) {
    if (el.closest('[aria-hidden="true"]')) continue // hidden from AT on purpose
    if (!shown(el)) continue
    if ((el as HTMLInputElement).disabled) continue
    if (!accName(el)) unnamed.push(describe(el))
  }

  // (ii) aria-hidden="true" subtrees (top-most only) exposing focusable nodes.
  const hiddenFocus: string[] = []
  for (const el of Array.from(root.querySelectorAll('[aria-hidden="true"]'))) {
    let parent = el.parentElement
    let nested = false
    while (parent) {
      if (parent.hasAttribute && parent.hasAttribute('aria-hidden')) {
        nested = true
        break
      }
      parent = parent.parentElement
    }
    if (nested) continue
    const hidden = Array.from(el.querySelectorAll(INTERACTIVE)).filter(shown)
    if (hidden.length > 0) {
      hiddenFocus.push(
        `${describe(el)} hides ${hidden.length} focusable (${hidden
          .slice(0, 3)
          .map((h) => describe(h))
          .join(' | ')})`,
      )
    }
  }

  // (iii) Duplicate element ids.
  const counts = new Map<string, number>()
  const dupIds: string[] = []
  for (const el of Array.from(root.querySelectorAll('[id]'))) {
    const id = el.getAttribute('id')
    if (!id) continue
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  for (const [id, count] of counts) if (count > 1) dupIds.push(`${id} (${count}x)`)

  return { unnamed, hiddenFocus, dupIds }
}
