import { expect, test, type Locator, type Page } from '@playwright/test'
import { boot, goDashboard, openApp } from './helpers'

/**
 * #31 — the phone Dashboard mini-app sheet is an iOS-style bottom sheet: a
 * grab handle on top, and four equivalent ways to dismiss it — tap the handle,
 * Back, Escape, or pull the handle down past the threshold. A short pull
 * springs the sheet back. Desktop renders windows instead, so all of this is
 * mobile-project only.
 */

/** Open the Notes sheet from the dock (Dashboard mode is already active). */
async function openNotes(page: Page): Promise<{ sheet: Locator; handle: Locator }> {
  await openApp(page, 'Notes')
  const sheet = page.getByRole('dialog', { name: 'Notes sheet' })
  const handle = page.getByRole('button', { name: 'Close Notes sheet' })
  await expect(sheet).toBeVisible()
  await expect(handle).toBeVisible()
  return { sheet, handle }
}

/** Home content that appears once every sheet is closed. */
function overview(page: Page): Locator {
  return page.getByRole('button', { name: 'Open Google', exact: true })
}

/** Drag the sheet's grab handle vertically by `dy` px using trusted-pointer
 *  dispatch, then release. `dy > 0` pulls downward (toward dismissal). */
async function dragHandle(handle: Locator, dy: number, steps = 8): Promise<void> {
  const box = (await handle.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await handle.evaluate(
    (el, { x, y, dy, steps }) => {
      const fire = (type: string, cy: number, buttons: number) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 1,
            pointerType: 'touch',
            isPrimary: true,
            button: 0,
            buttons,
            clientX: x,
            clientY: cy,
            view: window,
          }),
        )
      fire('pointerdown', y, 1)
      for (let i = 1; i <= steps; i++) fire('pointermove', y + (dy * i) / steps, 1)
      fire('pointerup', y + dy, 0)
    },
    { x, y, dy, steps },
  )
}

test('31a. the sheet grab handle and Back both close the sheet to the overview', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Sheets exist only on the mobile project')

  await boot(page)
  await goDashboard(page)

  // Tap the grab handle → the sheet closes and the Dashboard overview returns.
  const tapped = await openNotes(page)
  // Establish keyboard modality before focusing programmatically; Chromium
  // otherwise treats locator.focus() as a pointer-style focus and suppresses
  // the :focus-visible replacement ring.
  await page.keyboard.press('Tab')
  await tapped.handle.focus()
  await expect(tapped.handle).toBeFocused()
  await expect(tapped.handle).toHaveAttribute('aria-label', 'Close Notes sheet')
  await expect(tapped.sheet).toHaveCSS('overscroll-behavior-y', 'contain')
  const focusTreatment = await tapped.handle.locator('span').evaluate((pill) => ({
    boxShadow: getComputedStyle(pill).boxShadow,
    visible: getComputedStyle(pill).backgroundColor !== 'rgba(0, 0, 0, 0)',
  }))
  expect(focusTreatment.boxShadow).toMatch(/0px 0px 0px 3px/)
  expect(focusTreatment.visible).toBe(true)
  await tapped.handle.click()
  await expect(tapped.sheet).toHaveCount(0)
  await expect(overview(page)).toBeVisible()

  // Re-open and use the Back control instead.
  const backed = await openNotes(page)
  await page.getByRole('button', { name: 'Back to Home' }).click()
  await expect(backed.sheet).toHaveCount(0)
  await expect(overview(page)).toBeVisible()
})

test('31b. Escape closes the sheet; a short pull springs back, a full pull dismisses', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Sheets exist only on the mobile project')

  await boot(page)
  await goDashboard(page)

  // Escape (focus the handle first — autofocus lands on a later frame).
  const first = await openNotes(page)
  await first.handle.focus()
  await page.keyboard.press('Escape')
  await expect(first.sheet).toHaveCount(0)
  await expect(overview(page)).toBeVisible()

  // A short pull must not close it — the sheet springs back.
  const springy = await openNotes(page)
  await dragHandle(springy.handle, 44)
  await expect(springy.sheet).toBeVisible()
  await expect(overview(page)).toHaveCount(0)

  // Close for real (tap), then a full pull past the threshold dismisses it.
  await springy.handle.click()
  await expect(springy.sheet).toHaveCount(0)
  const pulled = await openNotes(page)
  await dragHandle(pulled.handle, 180)
  await expect(pulled.sheet).toHaveCount(0)
  await expect(overview(page)).toBeVisible()
})
