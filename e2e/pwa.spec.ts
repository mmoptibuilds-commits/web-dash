import { expect, test, type Page } from '@playwright/test'
import { boot } from './helpers'

/**
 * Spec flows 14 & 15 — the whole E2E suite already runs against the production
 * build (`vite preview`); these two assert the PWA contract directly: a valid
 * web manifest + active service worker, and an offline reload that serves the
 * cached app shell with local data intact.
 */

test('14. production build serves a valid PWA manifest with an active worker', async ({ page }) => {
  await boot(page)

  const res = await page.request.get('/manifest.webmanifest')
  expect(res.status()).toBe(200)
  const manifest = await res.json()
  expect(manifest.name).toContain('Hearth')
  expect(manifest.short_name).toBe('Hearth')
  expect(manifest.display).toBe('standalone')
  expect(typeof manifest.start_url).toBe('string')
  expect(Array.isArray(manifest.icons)).toBe(true)
  expect(manifest.icons.length).toBeGreaterThan(0)

  await expectActiveWorker(page)
})

test('15. reloading while offline serves the cached app shell with local data', async ({
  page,
  context,
}) => {
  await boot(page)
  await expectActiveWorker(page)

  // Reload once online so the active worker controls the page.
  await page.reload()
  await expectControlled(page)
  await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible()
  await expectPrecachedShellAsset(page)

  // Cut the network: the precached shell and IndexedDB data still load.
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible({ timeout: 20_000 })
})

async function expectActiveWorker(page: Page): Promise<void> {
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.ready
    return Boolean(reg.active && reg.active.state === 'activated')
  })
}

/** The page must be under the worker's control before an offline reload can
 *  be served from the precache — without this the check below races the SW's
 *  first client handoff and flakes under full-suite load. */
async function expectControlled(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    if (!('serviceWorker' in navigator)) return false
    return navigator.serviceWorker.ready.then(
      (reg) => Boolean(reg.active && reg.active.state === 'activated' && navigator.serviceWorker.controller),
    )
  })
}

/** The active worker must have a concrete precached asset before the network
 * is disabled. Checking CacheStorage catches a false positive where the page
 * is merely controlled but the offline shell was never installed. */
async function expectPrecachedShellAsset(page: Page): Promise<void> {
  const result = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator) || !('caches' in window)) {
      return { ok: false, reason: 'service workers or CacheStorage unavailable' }
    }

    const registration = await navigator.serviceWorker.ready
    const script = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
      .map((el) => new URL(el.src, window.location.href))
      .find((url) => url.origin === window.location.origin && url.pathname.startsWith('/assets/'))

    if (!registration.active || registration.active.state !== 'activated') {
      return { ok: false, reason: 'registration is not activated' }
    }
    if (!navigator.serviceWorker.controller) {
      return { ok: false, reason: 'page has no service-worker controller' }
    }
    if (!script) {
      return { ok: false, reason: 'no same-origin Vite asset script found' }
    }

    const cached = await caches.match(script.href)
    const fetched = await fetch(script.href, { cache: 'no-store' })
    return {
      ok: Boolean(cached?.ok && fetched.ok),
      asset: script.pathname,
      cachedStatus: cached?.status ?? 0,
      fetchedStatus: fetched.status,
    }
  })

  expect(result.ok, JSON.stringify(result)).toBe(true)
}
