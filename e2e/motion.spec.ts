import { expect, test, type Locator, type Page } from '@playwright/test'
import { boot, enterEdit, exitEdit, goHome, openApp, openSettings } from './helpers'

/**
 * #33 — MOTION (reduced-motion / reduced-effects).
 *
 * Proves (1) OS-level prefers-reduced-motion collapses animation timing app-wide
 * (tokens.css @media block + global.css sweep), (2) the in-app "Reduced effects"
 * switch collapses timing AND solidifies glass (tokens.css [data-effects='reduced']
 * blocks + the html[data-effects='reduced'] * !important sweep), is reversible,
 * and (3) no gratuitous infinite/ambient animation runs at rest in the default
 * full-motion state — the single deliberate infinite animation (the Notes
 * autosave pulse, notes.module.css .savingDot) is the only one, and honours OS
 * reduce.
 *
 * The measured surface is the Modal card: Modal.tsx renders it with role="dialog"
 * and className `${styles.card} anim-pop`, and motion.css .anim-pop is
 * `animation: pop-in var(--dur-fast) var(--ease-out) both` (120 ms default), so
 * the dialog element itself is the animating, backdrop-filtered glass surface.
 */

/** Trimmed computed value of a CSS custom property on <html>. */
function cssVar(page: Page, name: string): Promise<string> {
  return page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)
}

/** Milliseconds represented by a CSS <time> string ('.12s' → 120, '1ms' → 1).
 *  Chromium serializes computed <time> custom properties in seconds, so token
 *  durations must be compared numerically, never as raw strings. */
function ms(time: string): number {
  const n = Number.parseFloat(time)
  return time.endsWith('ms') ? n : n * 1000
}

/** Computed motion + glass of the open Add-shortcut card (the Modal .card). */
interface DialogSurface {
  name: string
  duration: string
  iterations: string
  filter: string
}

function addDialogSurface(page: Page): Promise<DialogSurface> {
  // role=dialog IS the Modal .card (Modal.tsx: role="dialog" + `anim-pop`).
  return page.getByRole('dialog', { name: 'Add shortcut' }).evaluate<DialogSurface>((el) => {
    const cs = getComputedStyle(el)
    return {
      name: cs.animationName,
      duration: cs.animationDuration,
      iterations: cs.animationIterationCount,
      // Modal.module.css .card: backdrop-filter blur(var(--blur-md)) saturate(...)
      filter: cs.backdropFilter || cs.getPropertyValue('-webkit-backdrop-filter'),
    }
  })
}

/** Open the Edit Mode → Shortcut modal (home.spec flow 3 'Shortcut' → 'Add shortcut'). */
async function openAddDialog(page: Page): Promise<void> {
  await enterEdit(page)
  // Home Edit toolbar shortcut button: exact label 'Shortcut' (home.spec 3).
  await page.getByRole('button', { name: 'Shortcut', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Add shortcut' })).toBeVisible()
}

/** Number of elements running an infinite (iteration-count ≠ 1) CSS animation. */
function countInfinite(page: Page): Promise<number> {
  return page.evaluate<number>(() => {
    let n = 0
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const cs = getComputedStyle(el)
      if (cs.animationName !== 'none' && cs.animationIterationCount !== '1') n += 1
    }
    return n
  })
}

interface SavingSample {
  /** The Notes autosave pulse dot (span[aria-hidden] in the Note editor), if up. */
  dot: { duration: string; iterations: string } | null
  /** Whole-document count of infinite-running animations at that instant. */
  infiniteCount: number
}

/**
 * Scan the live document for the Notes saving dot (notes.module.css .savingDot,
 * NotesMiniApp.tsx: <span className={styles.savingDot} aria-hidden />) and count
 * any infinite animation. The dot only exists while `saving` is true (the ~500 ms
 * debounce window after an edit), so callers type a character to trigger it.
 */
function scanSaving(page: Page): Promise<SavingSample> {
  return page.evaluate<SavingSample>(() => {
    const editor = document.querySelector('[role="region"][aria-label="Note editor"]')
    let dot: { duration: string; iterations: string } | null = null
    let infiniteCount = 0
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const cs = getComputedStyle(el)
      if (cs.animationName === 'none') continue
      if (cs.animationIterationCount !== '1') infiniteCount += 1
      if (
        !dot &&
        editor?.contains(el) &&
        el.tagName === 'SPAN' &&
        el.getAttribute('aria-hidden') === 'true'
      ) {
        dot = { duration: cs.animationDuration, iterations: cs.animationIterationCount }
      }
    }
    return { dot, infiniteCount }
  })
}

/**
 * Make the Note editor dirty until the saving dot is mounted, then capture a
 * SavingSample while it is up. Each keystroke re-arms the ~500 ms autosave
 * debounce, so the dot stays mounted across the retries.
 */
async function sampleWhileSaving(page: Page, editor: Locator): Promise<SavingSample> {
  const body = editor.getByLabel('Note body')
  for (let i = 0; i < 10; i += 1) {
    await body.press('x')
    for (let j = 0; j < 8; j += 1) {
      const s = await scanSaving(page)
      if (s.dot) return s
      await page.waitForTimeout(25)
    }
  }
  throw new Error('The Notes saving pulse dot never appeared after typing in the editor')
}

test('33.1 OS prefers-reduced-motion collapses animation timing app-wide', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Timing is measured on the desktop viewport')

  // (a) Default full motion: the fast token is live and the pop-in runs for real.
  await boot(page)
  expect(ms(await cssVar(page, '--dur-fast')), 'default --dur-fast is ~120ms').toBeGreaterThan(80) // tokens.css :root
  await openAddDialog(page)
  const full = await addDialogSurface(page)
  expect(full.name, 'the modal card plays the pop-in keyframes').toBe('pop-in') // motion.css: pop-in
  expect(ms(full.duration), 'anim-pop runs on the real --dur-fast timing').toBeGreaterThanOrEqual(80)
  await page.keyboard.press('Escape') // Modal closes on Escape (Modal.tsx)
  await expect(page.getByRole('dialog', { name: 'Add shortcut' })).toHaveCount(0)

  // (b) Fresh page under OS reduced motion: the token collapses to ~1ms and the
  // same modal is time-squashed (global.css reduce sweep → 0.001ms).
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await boot(page)
  expect(ms(await cssVar(page, '--dur-fast')), 'OS reduce zeroes --dur-fast to ~1ms').toBeLessThan(6) // tokens.css 302-309
  await openAddDialog(page)
  const reduced = await addDialogSurface(page)
  expect(reduced.name, 'the animation still resolves under reduce (name kept)').toBe('pop-in')
  expect(ms(reduced.duration), 'OS reduce collapses the pop-in to ~0ms').toBeLessThanOrEqual(6)
})

test('33.2 in-app Reduced effects collapses timing, solidifies glass, and is reversible', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Window chrome + glass are read on the desktop viewport')

  await boot(page)
  const a1Default = await cssVar(page, '--glass-a-1')

  // Turn "Reduced effects" ON from Settings (glass.spec 29b flow).
  await openSettings(page)
  // Settings Appearance switch, label verified by glass.spec: 'Reduced effects'.
  await page.getByRole('switch', { name: 'Reduced effects' }).click()
  await expect(page.locator('html'), 'reduced effects is flagged on <html>').toHaveAttribute(
    'data-effects',
    'reduced',
  )
  await expect(page.locator('html'), 'glass is switched off while reduced').toHaveAttribute(
    'data-glass',
    'off',
  )
  // Reduced Effects replaces translucency with a solid surface: fills go fully
  // opaque (--glass-a-* pinned to 1, tokens.css 316-319) rather than merely
  // near-solid, and blur is removed at the surface via backdrop-filter:none
  // (the universal sweep) instead of zeroing the --blur-* tokens — a blur(0px)
  // fill would still sample the backdrop and apply its saturate().
  expect(Number.parseFloat(await cssVar(page, '--glass-a-1')), 'fill 1 is pinned solid').toBe(1) // tokens.css 316
  expect(Number.parseFloat(await cssVar(page, '--glass-a-2')), 'fill 2 is pinned solid').toBe(1) // tokens.css 317
  expect(ms(await cssVar(page, '--dur-fast')), 'duration token collapses to ~1ms').toBeLessThan(6) // tokens.css 328-331

  // Real glass surface solidifies: the Add-shortcut modal card.
  await page.getByRole('button', { name: 'Close Settings' }).click() // WindowsHost close: `Close ${app.name}`
  await expect(page.getByRole('dialog', { name: 'Settings window' })).toHaveCount(0) // WindowsHost: `${app.name} window`
  await goHome(page)
  await openAddDialog(page)
  const surface = await addDialogSurface(page)
  expect(surface.name, 'the surface still resolves its pop animation').toBe('pop-in')
  expect(ms(surface.duration), 'surface animation is squashed by the !important sweep').toBeLessThanOrEqual(6) // tokens.css 331-337
  expect(surface.iterations, 'surface iteration-count is forced to one').toBe('1')
  // The surface's backdrop blur is gone: either the sweep hard-removes it
  // (backdrop-filter: none) or the zeroed --blur-* tokens collapse it to an
  // inert blur(0px) saturate(1) at the source (both are reduced-effects
  // guarantees; the minifier may drop the unprefixed sweep).
  const filter = surface.filter
  expect(
    filter === 'none' || filter.includes('blur(0px)'),
    `backdrop blur removed, got ${filter}`,
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Add shortcut' })).toHaveCount(0)
  await exitEdit(page)

  // Turn it back OFF: the html flag clears and glass/motion tokens return.
  await openSettings(page)
  await page.getByRole('switch', { name: 'Reduced effects' }).click()
  await expect(page.locator('html'), 'reduced flag is cleared').not.toHaveAttribute(
    'data-effects',
    'reduced',
  )
  await expect(page.locator('html'), 'effects return to full').toHaveAttribute('data-effects', 'full')
  expect(await cssVar(page, '--blur-md'), 'blur token returns to its positive default').toBe('24px') // tokens.css :root
  expect(ms(await cssVar(page, '--dur-fast')), 'duration token returns to ~120ms').toBeGreaterThan(80)
  expect(await cssVar(page, '--glass-a-1'), 'glass fill alpha returns to its default').toBe(a1Default)
})

test('33.3 the only infinite animation is the Notes saving pulse, and OS reduce stops it', async ({
  page,
  isMobile,
}) => {
  await boot(page)
  await page.waitForTimeout(700)

  // At rest in the default full-motion state nothing loops forever (both
  // projects: every seeded surface — Home dock/grid, chrome — must be quiet).
  expect(await countInfinite(page), 'no element runs an infinite animation at rest').toBe(0)

  // The autosave pulse is sampled in the desktop Notes window (the mobile sheet
  // renders the same editor, but the sheet surface is covered by its own spec).
  test.skip(isMobile, 'Notes autosave pulse is sampled on the desktop window')

  // While an autosave is pending, the deliberate pulse dot is the single
  // infinite animation and runs on the real --dur-slow timing.
  await openApp(page, 'Notes')
  await page.getByRole('button', { name: 'New note', exact: true }).click() // NotesMiniApp list head aria-label 'New note'
  const editor = page.getByRole('region', { name: 'Note editor' })
  await expect(editor).toBeVisible()
  const full = await sampleWhileSaving(page, editor)
  expect(full.infiniteCount, 'the pulse is the only infinite animation while saving').toBe(1)
  expect(full.dot!.iterations, 'the pulse loops forever in full motion').toBe('infinite')
  expect(ms(full.dot!.duration), 'the pulse runs on the real --dur-slow timing').toBeGreaterThanOrEqual(300) // 320ms default

  // Let the autosave flush, apply OS reduced motion, then save again: the same
  // indicator is squashed to a single frozen instant (global.css reduce sweep).
  await expect(editor).not.toContainText('Saving…', { timeout: 6_000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reduced = await sampleWhileSaving(page, editor)
  expect(reduced.infiniteCount, 'nothing else loops while it is squashed').toBe(0)
  expect(reduced.dot!.iterations, 'the pulse is forced to a single iteration').toBe('1')
  expect(ms(reduced.dot!.duration), 'the pulse is time-squashed to ~0ms').toBeLessThanOrEqual(6)
})
