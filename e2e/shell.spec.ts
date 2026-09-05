import { expect, test } from '@playwright/test'
import {
  STARTER_FOLDER,
  STARTER_TILES,
  boot,
  dockApp,
  goDashboard,
  goHome,
} from './helpers'

/**
 * Spec flow 1 & 2 — first launch shows the starter layout; Home ↔ Dashboard
 * switching works in both directions. Runs on desktop (windows) and mobile
 * (sheets); the starter layout assertions are identical on both.
 */

test('1. first launch seeds and shows the starter layout', async ({ page }) => {
  await boot(page)

  // Page header shows the seeded "Home" page.
  await expect(pageTitle(page)).toHaveText('Home')

  // Starter tiles: five web shortcuts + the Dev folder.
  for (const label of STARTER_TILES) {
    await expect(page.getByRole('button', { name: `Open ${label}` })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: `Open folder ${STARTER_FOLDER}` })).toBeVisible()

  // Built-in starter widgets: an address/search bar and a clock.
  await expect(page.getByRole('search', { name: 'Web search' })).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()

  // Default dock shows the built-in window apps.
  for (const app of ['Notes', 'Tasks', 'Calendar', 'Links', 'Settings']) {
    await expect(dockApp(page, app)).toBeVisible()
  }

  // One page only: no "next" page to go to.
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
})

test('2. switch between Home and Dashboard in both directions', async ({ page }) => {
  await boot(page)

  // Home → Dashboard: the overview surface appears (menu-bar tab on desktop,
  // dock launcher on mobile).
  await goDashboard(page)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  // Window apps are offered on the overview surface.
  for (const app of ['Notes', 'Tasks', 'Calendar', 'Links', 'Settings']) {
    await expect(page.getByRole('button', { name: new RegExp(app) }).first()).toBeVisible()
  }

  // Dashboard → Home returns to the launcher.
  await goHome(page)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeHidden()
  await expect(pageTitle(page)).toHaveText('Home')
})

/** The Home page-title control (unique: sits between prev/next chevrons). */
function pageTitle(page: import('@playwright/test').Page) {
  return page
    .getByRole('button', { name: 'Next page' })
    .locator('xpath=preceding-sibling::*[1]')
}
