import { expect, test } from '@playwright/test'
import { boot, goDashboard, openApp } from './helpers'

/**
 * #30 — desktop floating windows + dock coherence.
 *
 * Windows are macOS-style: traffic-light chrome (close / minimize / maximize),
 * front-most focus ordering, and minimizing drops the window off the stage
 * while the dock keeps its running indicator — clicking the dock tile restores
 * it. Window chrome only exists on the desktop project (mobile renders sheets).
 */

test('a window minimizes to the dock and restores from its tile', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Windows (and minimize) only exist on the desktop project')

  await boot(page)
  await goDashboard(page)
  await openApp(page, 'Notes')
  const win = page.getByRole('dialog', { name: 'Notes window' })
  await expect(win).toBeVisible()

  // Minimize hides the window; its dock tile stays (running) and restores it.
  await page.getByRole('button', { name: 'Minimize Notes' }).click()
  await expect(win).toBeHidden()
  await expect(page.getByRole('dialog', { name: 'Notes window' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Open Notes', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Notes window' })).toBeVisible()
})

test('only the front-most window shows full chrome; closed windows leave the dock clear', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Window chrome exists only on the desktop project')

  await boot(page)
  await goDashboard(page)

  await openApp(page, 'Notes')
  await openApp(page, 'Calendar')
  const notes = page.getByRole('dialog', { name: 'Notes window' })
  const calendar = page.getByRole('dialog', { name: 'Calendar window' })
  await expect(calendar).toBeVisible()
  await expect(notes).toBeVisible()

  // Calendar opened last and is front-most (its chrome is undimmed).
  await expect(calendar).toHaveAttribute('data-front', 'true')
  await expect(notes).toHaveAttribute('data-front', 'false')

  // Close the front window → Notes returns to front; Calendar's dock dot goes out.
  await page.getByRole('button', { name: 'Close Calendar' }).click()
  await expect(calendar).toHaveCount(0)
  await expect(notes).toHaveAttribute('data-front', 'true')
})

test('window layout menu snaps to a half and restores floating geometry', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Window snapping exists only on the desktop project')
  await boot(page)
  await openApp(page, 'Notes')
  const win = page.getByRole('dialog', { name: 'Notes window' })
  const floating = await win.boundingBox()
  if (!floating) throw new Error('Missing floating Notes bounds')

  await page.getByRole('button', { name: 'Arrange Notes window' }).click()
  await page.getByRole('menuitem', { name: 'Left half' }).click()
  const snapped = await win.boundingBox()
  if (!snapped) throw new Error('Missing snapped Notes bounds')
  expect(snapped.x).toBeLessThan(12)
  expect(snapped.width).toBeGreaterThan(680)

  await page.getByRole('button', { name: 'Arrange Notes window' }).click()
  await page.getByRole('menuitem', { name: 'Restore floating' }).click()
  const restored = await win.boundingBox()
  if (!restored) throw new Error('Missing restored Notes bounds')
  expect(restored.x).toBeCloseTo(floating.x, 0)
  expect(restored.width).toBeCloseTo(floating.width, 0)
})

test('dragging to an edge previews the snap zone before applying it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Window snapping exists only on the desktop project')
  await boot(page)
  await openApp(page, 'Notes')
  const win = page.getByRole('dialog', { name: 'Notes window' })
  const titlebar = win.locator('header').first()
  const box = await titlebar.boundingBox()
  if (!box) throw new Error('Missing Notes titlebar bounds')

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(2, 450, { steps: 12 })
  await expect(page.locator('[data-snap-preview="left"]')).toBeVisible()
  await page.mouse.up()
  await expect(page.locator('[data-snap-preview]')).toHaveCount(0)

  const snapped = await win.boundingBox()
  if (!snapped) throw new Error('Missing snapped Notes bounds')
  expect(snapped.x).toBeLessThanOrEqual(9)
  expect(snapped.width).toBeGreaterThan(680)
})

test('all half, corner and maximize layouts remain inside the desktop safe area', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Window snapping exists only on the desktop project')
  await boot(page)
  await openApp(page, 'Settings')
  const win = page.getByRole('dialog', { name: 'Settings window' })
  const layouts = ['Left half', 'Right half', 'Top left', 'Top right', 'Bottom left', 'Bottom right', 'Maximize']

  for (const layout of layouts) {
    await page.getByRole('button', { name: 'Arrange Settings window' }).click()
    await page.getByRole('menuitem', { name: layout, exact: true }).click()
    const box = await win.boundingBox()
    if (!box) throw new Error(`Missing Settings bounds after ${layout}`)
    expect(box.x, `${layout} left safe inset`).toBeGreaterThanOrEqual(7)
    expect(box.y, `${layout} menu-bar safe inset`).toBeGreaterThanOrEqual(39)
    expect(box.x + box.width, `${layout} right safe inset`).toBeLessThanOrEqual(1433)
    expect(box.y + box.height, `${layout} Dock safe inset`).toBeLessThanOrEqual(799)
  }

  await page.waitForTimeout(220)
  await page.reload()
  const persisted = await page.evaluate(async () => {
    const request = indexedDB.open('hearth')
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const tx = db.transaction('windowStates', 'readonly')
    const get = tx.objectStore('windowStates').get('settings')
    return new Promise<{ snapMode?: string }>((resolve, reject) => {
      get.onsuccess = () => resolve(get.result)
      get.onerror = () => reject(get.error)
    })
  })
  expect(persisted.snapMode).toBe('maximize')
})

test('a snapped window recomputes its bounds when the desktop viewport changes', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Window snapping exists only on the desktop project')
  await boot(page)
  await openApp(page, 'Notes')
  const win = page.getByRole('dialog', { name: 'Notes window' })
  await page.getByRole('button', { name: 'Arrange Notes window' }).click()
  await page.getByRole('menuitem', { name: 'Right half' }).click()

  await page.setViewportSize({ width: 1120, height: 760 })
  const box = await win.boundingBox()
  if (!box) throw new Error('Missing resized snapped Notes bounds')
  expect(box.x).toBeGreaterThanOrEqual(559)
  expect(box.x + box.width).toBeLessThanOrEqual(1113)
  expect(box.y).toBeGreaterThanOrEqual(39)
  expect(box.y + box.height).toBeLessThanOrEqual(659)
})
