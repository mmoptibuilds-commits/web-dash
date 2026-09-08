import { expect, test, type Locator, type Page } from '@playwright/test'
import { boot, enterEdit, exitEdit } from './helpers'

/**
 * Dock Edit-Mode "Add to dock" popover.
 *
 * Regression for the V2 bug report: "Enter Edit Mode, press Add — the popover
 * appears but nothing inside is clickable and clicking dismisses it." Root
 * cause: `.dock` is `pointer-events: none` (so the full-width fixed strip never
 * blocks the page); `.bar` re-enables itself, but `.addPop` did not, so every
 * row inherited `none` — clicks fell through to the page beneath and the
 * outside-close handler dismissed the popover. Fixed by `pointer-events: auto`
 * on `.addPop`.
 */
function dock(page: Page): Locator {
  return page.locator('nav[aria-label="Dock"]')
}

/** Dock app launchers that open something. CSS-scoped to the real <button>
 *  elements (in Edit Mode dnd-kit also gives each tile's wrapper div a
 *  role=button whose accessible name duplicates the launcher's). */
function launchers(page: Page): Locator {
  return dock(page).locator('button[aria-label^="Open "]')
}

test('dock: add a pinned app via Edit Mode "Add to dock" and keep it after reload', async ({
  page,
}) => {
  await boot(page)

  const before = await launchers(page).count()

  // Edit Mode reveals the dock's Add chip (it is Home-only by design).
  await enterEdit(page)
  await page.getByRole('button', { name: 'Add to dock', exact: true }).click()
  const popover = page.getByRole('dialog', { name: 'Add to dock' })
  await expect(popover).toBeVisible()

  // A real click on a candidate row must land on the row (it used to fall
  // through to the Home page behind and the popover would dismiss doing nothing).
  const row = popover.getByRole('button').first()
  const candidate = (await row.innerText()).split('\n')[0].trim()
  await row.click()
  await expect(popover).toBeHidden()

  // The chosen app is pinned to the dock.
  await expect(dock(page).getByRole('button', { name: `Open ${candidate}`, exact: true })).toBeVisible()
  expect(await launchers(page).count()).toBe(before + 1)

  // Still in Edit Mode (the click didn't dismiss the screen).
  await expect(page.getByRole('button', { name: 'Done editing Home', exact: true })).toBeVisible()
  await exitEdit(page)

  // Persistence: the pinned app survives a reload.
  await page.reload()
  await expect(dock(page).getByRole('button', { name: `Open ${candidate}`, exact: true })).toBeVisible()
  expect(await launchers(page).count()).toBe(before + 1)
})
