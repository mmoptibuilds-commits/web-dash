import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Shared E2E helpers. Each test runs in a fresh browser context (fresh
 * IndexedDB), so the first `boot()` seeds the starter experience described in
 * src/data/seed.ts: page "Home", search + clock widgets, Google/YouTube/GitHub/
 * Gmail/Wikipedia shortcut tiles, a "Dev" folder, and the default dock.
 */

/** Starter tile labels present after first-run seeding. */
export const STARTER_TILES = [
  'Google',
  'YouTube',
  'GitHub',
  'Gmail',
  'Wikipedia',
] as const
export const STARTER_FOLDER = 'Dev'

/** Wait for a clean first-run boot: app shell rendered + data seeded. */
export async function boot(page: Page, path = '/'): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  // The seeded launcher tile is the universal first screen on desktop & mobile;
  // its presence means the shell rendered and boot data is ready.
  await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible({ timeout: 20_000 })
}

/** Origin of the running app (http://localhost:PORT). */
export function originOf(page: Page): string {
  return new URL(page.url()).origin
}

/** Shortcut tile on a Home page: aria-label `Open <label>`. */
export function tile(page: Page, label: string): Locator {
  return page.getByRole('button', { name: `Open ${label}`, exact: true })
}

/** Folder tile on a Home page: aria-label `Open folder <name>`. */
export function folderTile(page: Page, name: string): Locator {
  return page.getByRole('button', { name: `Open folder ${name}`, exact: true })
}

/** The wrapper cell for a Home tile (parent of the tile button). */
export function cellOf(tileLocator: Locator): Locator {
  return tileLocator.locator('xpath=..')
}

/** Dock app launcher: aria-label `Open <app>`. */
export function dockApp(page: Page, app: string): Locator {
  return page.getByRole('button', { name: `Open ${app}`, exact: true })
}

/** Enter Home Edit Mode via the menu bar. */
export async function enterEdit(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible()
}

/** Leave Home Edit Mode. */
export async function exitEdit(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible()
}

/** Add a shortcut to the active Home page via Edit Mode → Shortcut dialog. */
export async function addShortcut(
  page: Page,
  label: string,
  url: string,
): Promise<void> {
  await enterEdit(page)
  await page.getByRole('button', { name: 'Shortcut', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Add shortcut' })
  await dialog.getByLabel('Name').fill(label)
  await dialog.getByLabel('Web address').fill(url)
  await dialog.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(tile(page, label)).toBeVisible()
  await exitEdit(page)
}

/** Open a dock app (desktop → window; mobile → sheet). */
export async function openApp(page: Page, app: string): Promise<void> {
  await dockApp(page, app).click()
}

/** True on desktop widths, where the menu bar shows the Home/Dashboard tabs. */
function isDesktopView(page: Page): boolean {
  const vp = page.viewportSize()
  return vp ? vp.width >= 1024 : false
}

/**
 * Switch to Dashboard mode via the platform's affordance: the menu-bar tab on
 * desktop; the dock's "Dashboard" launcher on mobile (the tabs are hidden under
 * 639px). Home is reached from anywhere with `goHome`.
 */
export async function goDashboard(page: Page): Promise<void> {
  if (isDesktopView(page)) {
    await page.getByRole('tab', { name: 'Dashboard' }).click()
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  } else {
    await page.getByRole('button', { name: 'Open Dashboard', exact: true }).click()
  }
}

/** Return Home from anywhere (the brand control is present on every surface). */
export async function goHome(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Hearth home' }).click()
}

/** The Home page title button (opens the Pages manager). */
export function pageTitleButton(page: Page): Locator {
  return page
    .getByRole('button', { name: 'Next page' })
    .locator('xpath=preceding-sibling::*[1]')
}

/** Current page name shown in the Home header. */
export function currentPageName(page: Page): Promise<string> {
  return pageTitleButton(page).innerText()
}

/** Open the global omnibox (menu-bar search icon; ⌘K is a hidden fallback). */
export async function openOmnibox(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Search' })
  await expect(dialog).toBeVisible()
  return dialog
}

/** Open the Settings mini-app in Simple mode (default). */
export async function openSettings(page: Page): Promise<void> {
  await openApp(page, 'Settings')
  await expect(page.getByRole('radiogroup', { name: 'Settings level' })).toBeVisible()
}
