import { expect, test, type Page } from '@playwright/test'
import { addShortcut, boot, goHome, openApp, openOmnibox, originOf, tile } from './helpers'

/** Search-result URL prefixes per engine (mirrors src/lib/search.ts). */
const ENGINE = {
  google: { host: 'www.google.com', url: 'https://www.google.com/search?q=' },
  bing: { host: 'www.bing.com', url: 'https://www.bing.com/search?q=' },
  duckduckgo: { host: 'duckduckgo.com', url: 'https://duckduckgo.com/?q=' },
} as const

const QUERY = 'alpha beta'
const QUERY_ENC = 'alpha%20beta'

/**
 * Spec flows 4 & 5 — URL shortcuts open their destination; omnibox queries
 * route to the correct engine URL for Google (default), Bing and DuckDuckGo.
 * Navigation targets are intercepted and stubbed so the tests never depend on
 * an external site.
 */

test('4. a URL shortcut opens its destination in the same tab', async ({ page }) => {
  await boot(page)
  const dest = `${originOf(page)}/url-destination`
  await addShortcut(page, 'Target', dest)
  await tile(page, 'Target').click()
  await page.waitForURL('**/url-destination')
  // The SPA fallback reboots the app shell on the destination URL.
  await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible()
})

test('5a. omnibox query uses the default Google engine', async ({ page }) => {
  await boot(page)
  await runSearch(page, 'Google', 'www.google.com', ENGINE.google.url + QUERY_ENC)
})

test('5b. omnibox query routes to Bing after switching the default engine', async ({ page }) => {
  await boot(page)
  await setEngine(page, 'Bing')
  await runSearch(page, 'Bing', 'www.bing.com', ENGINE.bing.url + QUERY_ENC)
})

test('5c. omnibox query routes to DuckDuckGo after switching the default engine', async ({
  page,
}) => {
  await boot(page)
  await setEngine(page, 'DuckDuckGo')
  await runSearch(page, 'DuckDuckGo', 'duckduckgo.com', ENGINE.duckduckgo.url + QUERY_ENC)
})

/** Set the Settings default search engine, then return Home. */
async function setEngine(page: Page, label: string): Promise<void> {
  await openApp(page, 'Settings')
  const group = page.getByRole('radiogroup', { name: 'Default search engine' })
  await group.getByRole('radio', { name: label }).click()
  await expect(group.getByRole('radio', { name: label })).toHaveAttribute('aria-checked', 'true')
  await goHome(page)
}

/**
 * Submit QUERY through the omnibox and assert the exact navigation URL.
 * Settings load asynchronously into the overlay (one render defaults the engine
 * before the live query resolves), so wait for the hint to name `engineLabel`
 * before submitting — this is also the visible signal that the switch took.
 */
async function runSearch(
  page: Page,
  engineLabel: string,
  host: string,
  expectedUrl: string,
): Promise<void> {
  // Stub the engine response so the assertion needs no external network.
  await page.route(
    (url) => url.hostname === host,
    (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>e2e stub</title>' }),
  )

  const dialog = await openOmnibox(page)
  await expect(dialog.locator('p')).toContainText(`${engineLabel} search`)
  const box = dialog.getByLabel('Search the web or open a URL')
  await box.fill(QUERY)
  await box.press('Enter')

  await page.waitForURL(expectedUrl)
  expect(page.url()).toBe(expectedUrl)
}
