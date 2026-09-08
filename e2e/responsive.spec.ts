import { expect, test, type Locator, type Page } from '@playwright/test'
import { boot, enterEdit } from './helpers'

/**
 * Phase 5 — responsive integrity. Runs the app shell at a sweep of viewport
 * widths in one session and asserts, at each width: the document never gains a
 * horizontal scrollbar, the persistent chrome (menu bar + dock) stays inside
 * the viewport, Home navigation controls are reachable, and window-apps render
 * in the platform-correct surface (full-screen sheet <1024px, floating window
 * ≥1024px).
 *
 * Runs on the desktop project only (it resizes a single page through all
 * widths); the mobile project already covers the phone layout functionally.
 */

const SWEEP = [360, 390, 768, 1024, 1280, 1440]

test('shell stays within the viewport and never overflows at any width', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Width sweep is covered once on the desktop project')

  for (const width of SWEEP) {
    await page.setViewportSize({ width, height: 900 })
    await boot(page)

    // No horizontal page scroll — nothing pokes past the right edge.
    await assertNoHorizontalOverflow(page, `home @${width}`)

    // Persistent chrome sits inside the viewport.
    for (const label of ['mmoptibuilds home', 'Search', 'Control Center', 'Open Apps']) {
      await expectFullyInside(page.getByRole('button', { name: label, exact: true }).first(), width)
    }
    const dockTiles = page.getByRole('navigation', { name: 'Dock' }).getByRole('button')
    const count = await dockTiles.count()
    for (let i = 0; i < count; i++) {
      await expectFullyInside(dockTiles.nth(i), width)
    }

    // Home page navigation row is present and its title reachable.
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()

    // A window-app opens in the surface its width dictates.
    await page.getByRole('button', { name: 'Open Notes', exact: true }).click()
    if (width >= 1024) {
      await expect(page.getByRole('dialog', { name: 'Notes window' })).toBeVisible()
    } else {
      await expect(page.getByRole('dialog', { name: 'Notes sheet' })).toBeVisible()
    }
    await assertNoHorizontalOverflow(page, `notes @${width}`)
    // Close the surface the same way the platform expects.
    if (width >= 1024) {
      await page.getByRole('button', { name: 'Close Notes' }).click()
    } else {
      await page.getByRole('button', { name: 'Back to Home' }).click()
    }
    await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible()

    // Dashboard overview renders without overflow.
    await page.getByRole('button', { name: 'Open Apps', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Apps and links' })).toBeVisible()
    await assertNoHorizontalOverflow(page, `launchpad @${width}`)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible()
  }
})

/** The document must never require horizontal scrolling. */
async function assertNoHorizontalOverflow(page: Page, where: string): Promise<void> {
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }))
  expect(m.sw, `${where}: scrollWidth ${m.sw} should not exceed client ${m.cw}`).toBeLessThanOrEqual(
    m.cw + 1,
  )
}

/** The element's bounding box must lie fully within the viewport width. */
async function expectFullyInside(locator: Locator, width: number) {
  const box = await locator.boundingBox()
  expect(box, 'element should have a box').not.toBeNull()
  if (!box) return
  expect(box.x, 'left edge inside viewport').toBeGreaterThanOrEqual(-1)
  expect(box.x + box.width, 'right edge inside viewport').toBeLessThanOrEqual(width + 1)
}

/* ------------------------------------------------------------------ */
/* V2 #32 — widget container-query density + a wider overflow sweep.   */
/* The sweep above runs the shell over the seeded Home; these extend it */
/* to a data-rich Home (more widget kinds) and pin the container-query  */
/* guarantee (a widget adapts to its TILE width, not the window). Both  */
/* run on the desktop project; <1024px renders the compact grid.        */
/* ------------------------------------------------------------------ */

const WIDESWEEP = [320, 390, 430, 768, 1024, 1200, 1440]

/** True defect scan over the Home page content: an overflow-x hidden/clip
 *  element inside a `[data-page-id]` section whose in-flow block children
 *  extend past its clip edge (a tile row/grid that got cut). Text-ellipsis
 *  truncation and fixed full-viewport layers never match. */
async function homeContentCuts(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const hits: string[] = []
    for (const el of document.querySelectorAll('body *')) {
      if (el.clientWidth <= 0 || !el.closest('[data-page-id]')) continue
      const cs = getComputedStyle(el)
      if (cs.overflowX !== 'hidden' && cs.overflowX !== 'clip') continue
      if (cs.position === 'fixed') continue
      const r = el.getBoundingClientRect()
      if (r.width >= vw * 0.98) continue
      if (r.width <= 0) continue
      if (el.scrollWidth <= el.clientWidth + 2) continue
      const clipRight = r.right
      for (const c of el.children) {
        const cr = c.getBoundingClientRect()
        if (cr.width <= 0 || getComputedStyle(c).position === 'absolute') continue
        if (cr.right > clipRight + 1) {
          hits.push(
            `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 18)}` +
              `(client ${el.clientWidth}/sw ${el.scrollWidth}) → child right ${Math.round(cr.right)} > clip ${Math.round(clipRight)}`,
          )
          break
        }
      }
    }
    return hits
  })
}

test('32a. a data-rich Home never overflows or cuts content at any width', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Width sweep is covered once on the desktop project')

  await boot(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await enterEdit(page)

  // Add Notes + Calendar so every widget surface exists (empty states still
  // exercise the panels' layout geometry at every width).
  const picker = page.getByRole('dialog', { name: 'Add widget' })
  for (const name of ['Notes', 'Calendar']) {
    await page.getByRole('button', { name: 'Widget', exact: true }).click()
    await expect(picker).toBeVisible()
    await picker.getByRole('button', { name: new RegExp(`^${name} `) }).click()
    await expect(picker).toHaveCount(0)
  }
  await page.getByRole('button', { name: 'Done editing Home', exact: true }).click()

  const problems: string[] = []
  for (const w of WIDESWEEP) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.waitForTimeout(240)
    const winOver = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    if (winOver > 0) problems.push(`w=${w} window overflow ${winOver}px`)
    for (const hit of await homeContentCuts(page)) problems.push(`w=${w} ${hit}`)
  }
  expect(problems, problems.join('\n')).toEqual([])
})

test('32b. widget density follows its tile width, not the window (container query)', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Container-query density is exercised on the desktop project')

  await boot(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await enterEdit(page)

  // Add the Calendar widget; it lands at its Medium canonical box (≈360px wide).
  await page.getByRole('button', { name: 'Widget', exact: true }).click()
  const picker = page.getByRole('dialog', { name: 'Add widget' })
  await picker.getByRole('button', { name: /^Calendar / }).click()
  await expect(picker).toHaveCount(0)

  const tile = page.getByRole('group', { name: 'Calendar tile' })
  const weekdays = tile.getByTestId('calendar-weekdays')
  await expect(tile).toBeVisible()

  // Medium tile is > 240px wide → the weekday header row is shown.
  const med = await tile.boundingBox()
  if (!med) throw new Error('missing calendar tile')
  expect(med.width).toBeGreaterThan(240)
  await expect(weekdays).toBeVisible()

  // Drag the resize handle down to the tile's minimum width (< 240px). The
  // window stays 1440px wide, so only a container query could hide the row.
  // Pointer-only chrome: the drag handle is aria-hidden (keyboard resize is
  // Alt+Arrows on the focused tile), so it is targeted by test id, not role.
  const handle = tile.getByTestId('resize-handle')
  const hb = await handle.boundingBox()
  if (!hb) throw new Error('missing calendar resize handle')
  await page.mouse.move(hb.x + 4, hb.y + 4)
  await page.mouse.down()
  await page.mouse.move(med.x + 30, med.y + med.height, { steps: 16 })
  await page.mouse.up()
  await page.waitForTimeout(350)
  const slim = await tile.boundingBox()
  if (!slim) throw new Error('missing calendar tile after resize')
  expect(slim.width).toBeLessThan(240)
  await expect(weekdays).toBeHidden()

  // The Large preset (> 240px) brings the header row back.
  await tile.getByRole('button', { name: 'Size Large' }).click()
  await page.waitForTimeout(350)
  const big = await tile.boundingBox()
  if (!big) throw new Error('missing calendar tile after preset')
  expect(big.width).toBeGreaterThan(600)
  await expect(weekdays).toBeVisible()
})

test('32c. compact-grid tiles drive container queries on the phone too', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Compact-grid density is exercised on the mobile project')

  await boot(page)
  await enterEdit(page)

  // Add the Calendar widget (Medium, 2 of the 4 phone columns ≈ 169px < 240).
  await page.getByRole('button', { name: 'Widget', exact: true }).click()
  const picker = page.getByRole('dialog', { name: 'Add widget' })
  await picker.getByRole('button', { name: /^Calendar / }).click()
  await expect(picker).toHaveCount(0)

  // The tile is the 4th div ancestor of the weekday row: panel → host → cell.
  const cell = page.getByTestId('calendar-weekdays').locator('xpath=ancestor::div[3]')
  await expect(cell).toBeVisible()
  const med = await cell.boundingBox()
  if (!med) throw new Error('missing calendar tile on phone')
  expect(med.width).toBeLessThan(240)
  await expect(page.getByTestId('calendar-weekdays')).toBeHidden()

  const hiddenA11y = await page.getByTestId('calendar-weekdays').evaluate((el) => ({
    ariaHidden: el.getAttribute('aria-hidden'),
    display: getComputedStyle(el).display,
    focusableNode: [el, ...Array.from(el.querySelectorAll<HTMLElement>('*'))].some(
      (node) => node instanceof HTMLElement && node.tabIndex >= 0 && !node.hasAttribute('disabled'),
    ),
  }))
  expect(hiddenA11y).toEqual({
    ariaHidden: 'true',
    display: 'none',
    focusableNode: false,
  })

  // Size Large spans the full 4-column row (> 240px) → the header row returns.
  await cell.getByRole('button', { name: 'Size Large' }).click()
  await page.waitForTimeout(350)
  await page.waitForTimeout(350)
  const big = await cell.boundingBox()
  if (!big) throw new Error('missing calendar tile after preset on phone')
  expect(big.width).toBeGreaterThan(300)
  await expect(page.getByTestId('calendar-weekdays')).toBeVisible()
})
