import { expect, test, type Locator, type Page } from '@playwright/test'
import { boot } from './helpers'

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
    for (const label of ['Hearth home', 'Search', 'Control Center', 'Open Dashboard']) {
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
      await page.getByRole('button', { name: 'Back to dashboard' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Dashboard overview renders without overflow.
    await page.getByRole('button', { name: 'Hearth home' }).click()
    await page.getByRole('button', { name: 'Open Dashboard', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await assertNoHorizontalOverflow(page, `dashboard @${width}`)
    await page.getByRole('button', { name: 'Hearth home' }).click()
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
