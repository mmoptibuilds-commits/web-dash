import { expect, test, type Page } from '@playwright/test'
import {
  addShortcut,
  boot,
  dockApp,
  enterEdit,
  exitEdit,
  openSettings,
} from './helpers'

async function inlineVar(page: Page, name: string): Promise<string> {
  return page.evaluate((property) => document.documentElement.style.getPropertyValue(property).trim(), name)
}

test('C1: the status bar stays in-viewport and its controls work at phone and desktop widths', async ({
  page,
}) => {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 })
    await boot(page)
    const bar = page.locator('header[data-mode]')
    await expect(bar).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Dashboard' })).toBeVisible()

    const inViewport = await bar.locator('button').evaluateAll((buttons) =>
      buttons.every((button) => {
        const box = button.getBoundingClientRect()
        return box.left >= 0 && box.right <= window.innerWidth && box.top >= 0 && box.bottom <= window.innerHeight
      }),
    )
    expect(inViewport).toBe(true)

    await page.getByRole('radio', { name: 'Dashboard' }).click()
    await expect(page.getByRole('radio', { name: 'Dashboard' })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('radio', { name: 'Home' }).click()
    await expect(page.getByRole('radio', { name: 'Home' })).toHaveAttribute('aria-checked', 'true')

    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Done', exact: true }).click()

    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeHidden()

    await page.getByRole('button', { name: 'Control Center', exact: true }).click()
    const controlCenter = page.getByRole('dialog', { name: 'Control Center' })
    await expect(controlCenter).toBeVisible()
    await controlCenter.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(controlCenter).toBeHidden()

    if (width === 1440) await expect(page.getByTestId('menu-clock')).toBeVisible()
  }

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})

test('C2: transparency has a strong live alpha range and survives reload', async ({ page }) => {
  await boot(page)
  await openSettings(page)
  const slider = page.getByRole('slider', { name: 'Transparency' })
  const base = Number(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--glass-a-1')))

  await slider.press('Home')
  await expect(slider).toHaveValue('0')
  const solid = Number(await inlineVar(page, '--glass-a-1'))
  expect(solid).toBeGreaterThan(base)
  expect(solid).toBeGreaterThan(0.85)

  await slider.press('End')
  await expect(slider).toHaveValue('1')
  const clear = Number(await inlineVar(page, '--glass-a-1'))
  expect(clear).toBeLessThan(base)
  expect(solid - clear).toBeGreaterThan(0.5)

  await expect
    .poll(async () => Number(await inlineVar(page, '--glass-a-1')))
    .toBe(clear)
  await page.reload()
  await expect
    .poll(async () => Number(await inlineVar(page, '--glass-a-1')))
    .toBe(clear)
  expect(Number(await inlineVar(page, '--glass-a-1'))).toBe(clear)
  await openSettings(page)
  await expect(page.getByRole('slider', { name: 'Transparency' })).toHaveValue('1')

  await page.getByRole('switch', { name: 'Reduced effects' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-effects', 'reduced')
  await expect.poll(() => inlineVar(page, '--glass-a-1')).toBe('')
})

test('C3: shortcut fallbacks and dock apps share the squircle icon recipe', async ({ page }) => {
  await page.route('https://www.google.com/s2/favicons**', (route) => route.abort())
  await boot(page)
  await addShortcut(page, 'Fallback icon', 'https://fallback.example')

  const surfaces = page.locator('[data-testid="shortcut-glyph-surface"], [data-testid="shortcut-monogram"], [data-testid="dock-app-glyph"]')
  await expect(page.getByTestId('shortcut-monogram').last()).toBeVisible()
  expect(await surfaces.count()).toBeGreaterThan(0)
  const iconStyles = await surfaces.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element)
      return { radius: style.borderRadius, shadow: style.boxShadow }
    }),
  )
  expect(iconStyles.every(({ radius, shadow }) => radius !== '0px' && shadow !== 'none')).toBe(true)
  await expect(dockApp(page, 'Notes')).toHaveAttribute('aria-label', 'Open Notes')
})

test('C4: embed controls reflow and the dock can launch another app', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await boot(page)
  await enterEdit(page)
  await page.getByRole('button', { name: 'Widget', exact: true }).click()
  const picker = page.getByRole('dialog', { name: 'Add widget' })
  await picker.getByRole('button', { name: /^Embed/ }).click()
  await expect(picker).toBeHidden()
  await exitEdit(page)

  const input = page.getByLabel('Web address to embed')
  await input.fill('https://example.com')
  await page.getByRole('button', { name: 'Embed', exact: true }).click()

  const frame = page.locator('iframe[title^="Embedded site"]')
  await expect(frame).toBeVisible()
  const toolbar = page.getByTestId('embed-toolbar')
  await expect(toolbar).toBeVisible()
  await expect(toolbar.getByRole('button', { name: 'Change' })).toBeHidden()
  expect(await toolbar.evaluate((element) => getComputedStyle(element).flexWrap)).toBe('wrap')
  const openLink = toolbar.getByRole('link', { name: /Open/ })
  await expect(openLink).toHaveAttribute('target', '_blank')
  await expect(openLink).toHaveAttribute('href', 'https://example.com/')

  await enterEdit(page)
  await toolbar.getByRole('button', { name: 'Change' }).click()
  await expect(page.getByLabel('Web address to embed')).toHaveValue('https://example.com')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()

  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(toolbar).toBeVisible()
  expect(await toolbar.evaluate((element) => getComputedStyle(element).flexWrap)).toBe('nowrap')

  await exitEdit(page)
  await dockApp(page, 'Notes').click()
  await expect(page.getByRole('dialog', { name: /Notes (window|sheet)/ })).toBeVisible()
  await dockApp(page, 'Calendar').click()
  await expect(page.getByRole('dialog', { name: /Calendar (window|sheet)/ })).toBeVisible()
})
