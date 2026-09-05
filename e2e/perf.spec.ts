import { expect, test, type Page } from '@playwright/test'
import { boot, goDashboard, openApp, openSettings } from './helpers'

/**
 * #33 — performance: a lean production bundle and a clean runtime.
 *
 * Both tests are purely programmatic (no axe, no animation timing, no pixel
 * geometry). The first reads Resource Timing for the /assets/ scripts and
 * stylesheets the `vite preview` build actually ships and holds them to a
 * budget that guards regressions. The second wires console/page-error listeners
 * before boot and drives a representative desktop round trip (Home → Notes
 * window → Settings window → Home → Dashboard), asserting zero console errors,
 * zero page errors and no ResizeObserver-loop warnings. Both run on the desktop
 * project only.
 */

/** A same-origin /assets/ script or stylesheet seen by Resource Timing. */
interface AssetEntry {
  name: string
  js: boolean
  bytes: number
}

/** Deduped /assets/ scripts + stylesheets, with their decoded body size. */
async function loadedAssets(page: Page): Promise<AssetEntry[]> {
  return page.evaluate(() => {
    const seen = new Set<string>()
    const out: { name: string; js: boolean; bytes: number }[] = []
    for (const raw of performance.getEntriesByType('resource')) {
      const entry = raw as PerformanceResourceTiming
      const { name } = entry
      if (!name.includes('/assets/')) continue
      const js = /\.js(?:[?#]|$)/.test(name)
      const css = /\.css(?:[?#]|$)/.test(name)
      if (!js && !css) continue
      // decodedBodySize is uncompressed, so budgets are stable regardless of the
      // preview server's compression; dedupe so a repeat request isn't counted
      // twice.
      if (seen.has(name)) continue
      seen.add(name)
      out.push({ name, js, bytes: entry.decodedBodySize })
    }
    return out
  })
}

test('perf: the production bundle stays within budget', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Asset budget is measured once on the desktop project')

  await boot(page)
  const assets = await loadedAssets(page)

  const jsAssets = assets.filter((a) => a.js)
  const cssAssets = assets.filter((a) => !a.js)
  const largestJs = jsAssets.reduce((max, a) => Math.max(max, a.bytes), 0)
  const totalJs = jsAssets.reduce((sum, a) => sum + a.bytes, 0)
  const totalCss = cssAssets.reduce((sum, a) => sum + a.bytes, 0)

  // Sanity: boot really loaded the JS entry + stylesheet (avoids a vacuous pass
  // if Resource Timing ever came back empty).
  expect(jsAssets.length, `expected ≥ 1 JS asset, saw ${jsAssets.length}`).toBeGreaterThan(0)
  expect(cssAssets.length, `expected ≥ 1 stylesheet, saw ${cssAssets.length}`).toBeGreaterThan(0)

  // Current build: main index-*.js ≈ 482 kB decoded, one ~97 kB stylesheet, plus
  // two tiny chunks (v2Freeform ~0.7 kB, workbox-window ~5.7 kB). The budgets sit
  // comfortably above that, so they guard regressions rather than chase
  // microseconds.
  expect(
    largestJs,
    `largest single JS asset is ${largestJs}B; must stay under the 560 kB budget`,
  ).toBeLessThan(560_000)
  expect(totalCss, `all stylesheets total ${totalCss}B; must stay under 120 kB`).toBeLessThan(
    120_000,
  )
  expect(
    jsAssets.length,
    `${jsAssets.length} distinct JS assets loaded; must stay ≤ 8`,
  ).toBeLessThanOrEqual(8)
  expect(totalJs, `all JS assets total ${totalJs}B; must stay under 620 kB`).toBeLessThan(620_000)
})

test('perf: a scripted interactive journey logs no console or page errors', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Clean-runtime journey is driven once on the desktop project')

  // Listen before the first navigation so early-boot errors are caught too.
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const resizeWarnings: string[] = []
  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error') {
      consoleErrors.push(text)
    } else if (msg.type() === 'warning' && text.includes('ResizeObserver loop')) {
      resizeWarnings.push(text)
    }
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  // Representative round trip. Windows sit above the stage, so each is closed
  // before the next surface is asserted (an open window hides the Dashboard
  // overview). Brand/radio chrome stays reachable while windows are open.
  await boot(page) // Home
  await openApp(page, 'Notes')
  await expect(page.getByRole('dialog', { name: 'Notes window' })).toBeVisible()
  await page.getByRole('button', { name: 'Close Notes', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Notes window' })).toHaveCount(0)

  await openSettings(page) // Settings window (dock launcher)
  await page.getByRole('button', { name: 'Close Settings', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Settings window' })).toHaveCount(0)

  await goDashboard(page) // desktop: radio 'Dashboard'
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  // Let late async work and observers flush before judging the runtime clean.
  await page.waitForTimeout(400)

  expect(
    consoleErrors,
    consoleErrors.join('\n') || 'the journey logged no console errors',
  ).toEqual([])
  expect(pageErrors, pageErrors.join('\n') || 'the journey raised no page errors').toEqual([])
  expect(
    resizeWarnings,
    resizeWarnings.join('\n') || 'no ResizeObserver loop warnings were logged',
  ).toEqual([])
})
