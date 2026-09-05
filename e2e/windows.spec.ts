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
