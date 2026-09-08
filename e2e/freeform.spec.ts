import { expect, test, type Page } from '@playwright/test'
import { boot, enterEdit, exitEdit, tile } from './helpers'

/**
 * V2 freeform canvas (desktop >= 1024px): genuine x/y/w/h/z placement with no
 * neighbour reflow. Covers pointer drag-resize, the S/M/L preset chips (which
 * must resize BOTH the freeform box AND the widget instance size), and
 * keyboard nudge — each with a reload-persistence check.
 *
 * Runs on the desktop project only; the compact ordered grid is exercised
 * elsewhere (home.spec mobile reorder).
 */

test('freeform: drag-resize a tile from its handle and keep the size after reload', async ({
  page,
}) => {
  test.skip(!(await isDesktop(page)), 'Freeform resize is a desktop interaction')
  await boot(page)
  await enterEdit(page)

  const search = page.getByRole('group', { name: 'Search tile' })
  await search.getByRole('button', { name: 'Size Small' }).click()
  await expect(search).toHaveCSS('width', '170px')
  const before = await search.boundingBox()
  if (!before) throw new Error('Missing tile geometry')

  // Pointer-only chrome: the drag handle is aria-hidden (keyboard users resize
  // a focused tile with Alt+Arrows), so it is targeted by test id, not role.
  const handle = search.getByTestId('resize-handle')
  const hb = await handle.boundingBox()
  if (!hb) throw new Error('Missing resize handle')

  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
  await page.mouse.down()
  await page.mouse.move(hb.x + hb.width / 2 + 56, hb.y + hb.height / 2 + 56, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(400)

  const after = await search.boundingBox()
  if (!after) throw new Error('Missing tile geometry after resize')
  expect(after.width).toBeGreaterThan(before.width + 20)
  expect(after.height).toBeGreaterThan(before.height + 20)

  // Persisted freeform geometry survives a reload.
  await exitEdit(page)
  await page.reload()
  await expect(tile(page, 'Google')).toBeVisible()
  await enterEdit(page)
  const persisted = await page.getByRole('group', { name: 'Search tile' }).boundingBox()
  if (!persisted) throw new Error('Missing tile geometry after reload')
  expect(persisted.width).toBeGreaterThan(before.width + 20)
  expect(persisted.height).toBeGreaterThan(before.height + 20)
})

test('freeform: the size preset chips resize a widget and persist', async ({ page }) => {
  test.skip(!(await isDesktop(page)), 'Size presets are exercised on desktop')
  await boot(page)
  await enterEdit(page)

  const search = page.getByRole('group', { name: 'Search tile' })
  const before = await search.boundingBox()
  if (!before) throw new Error('Missing search widget tile')
  expect(before.width).toBeGreaterThan(0)

  // Shrinking is valid in the seeded layout without pushing through any
  // neighbouring tile; occupied growth is deliberately collision-protected.
  await search.getByRole('button', { name: 'Size Small' }).click()
  await page.waitForTimeout(400)

  const after = await search.boundingBox()
  if (!after) throw new Error('Missing search widget tile after preset')
  expect(after.width).toBeLessThan(before.width - 150)
  expect(after.width).toBeLessThan(200)

  await exitEdit(page)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible()
  await enterEdit(page)
  const persisted = await page.getByRole('group', { name: 'Search tile' }).boundingBox()
  if (!persisted) throw new Error('Missing search widget tile after reload')
  expect(persisted.width).toBeLessThan(200)
})

test('freeform: arrow keys nudge a focused tile and persist', async ({ page }) => {
  test.skip(!(await isDesktop(page)), 'Keyboard nudge is exercised on desktop')
  await boot(page)
  await enterEdit(page)

  const clock = page.getByRole('group', { name: 'Clock tile' })
  const before = await clock.boundingBox()
  if (!before) throw new Error('Missing clock widget tile')

  await clock.evaluate((el) => (el as HTMLElement).focus())
  await page.keyboard.press('Shift+ArrowRight')
  await page.waitForTimeout(300)

  const after = await clock.boundingBox()
  if (!after) throw new Error('Missing clock widget tile after nudge')
  // Shift nudges by one 8px grid step.
  expect(after.x).toBeCloseTo(before.x + 8, 0)
  expect(after.y).toBeCloseTo(before.y, 0)

  // A precise 1px arrow press moves a tile off-grid too.
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  const fine = await clock.boundingBox()
  if (!fine) throw new Error('Missing clock widget tile after fine nudge')
  expect(fine.x).toBeCloseTo(after.x + 1, 0)

  await exitEdit(page)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible()
  await enterEdit(page)
  const persisted = await page.getByRole('group', { name: 'Clock tile' }).boundingBox()
  if (!persisted) throw new Error('Missing clock widget tile after reload')
  // Both the Shift nudge and the fine 1px nudge persist to real geometry.
  expect(persisted.x).toBeCloseTo(fine.x, 0)
})

async function isDesktop(page: Page): Promise<boolean> {
  const vp = page.viewportSize()
  return vp ? vp.width >= 1024 : false
}
