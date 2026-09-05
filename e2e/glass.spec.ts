import { expect, test } from '@playwright/test'
import { boot, openSettings } from './helpers'

/**
 * #29 — Appearance → Glass presets.
 *
 * Picking a preset applies it to the live shell (html[data-glass]), restyles
 * the shared material tokens so the change is visible through every chrome
 * surface, and persists across a reload. Reduced Effects overrides the preset
 * with a solid surface (data-glass="off"), then returning restores it.
 */

/** Trimmed computed value of a custom property on <html>. */
async function cssVar(page: import('@playwright/test').Page, name: string): Promise<string> {
  return page.evaluate((n) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(n)
    return v.trim()
  }, name)
}

test('29a. choosing a glass preset applies it live and persists', async ({ page }) => {
  await boot(page)
  await openSettings(page)

  const glass = page.getByRole('radiogroup', { name: 'Glass' })
  await expect(glass.getByRole('radio', { name: 'Standard' })).toHaveAttribute(
    'aria-checked',
    'true',
  )

  await glass.getByRole('radio', { name: 'Vibrant' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-glass', 'vibrant')
  await expect(glass.getByRole('radio', { name: 'Vibrant' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(await cssVar(page, '--glass-sat')).toBe('2')
  expect(await cssVar(page, '--blur-md')).toBe('30px')

  await glass.getByRole('radio', { name: 'Subtle' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-glass', 'subtle')
  expect(await cssVar(page, '--glass-sat')).toBe('1.2')
  expect(await cssVar(page, '--blur-md')).toBe('16px')

  // Reload: the preset is re-applied before first paint and stays checked.
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-glass', 'subtle')
  await openSettings(page)
  const after = page.getByRole('radiogroup', { name: 'Glass' })
  await expect(after.getByRole('radio', { name: 'Subtle' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
})

test('29b. Reduced Effects turns glass off, then back on returns the preset', async ({
  page,
}) => {
  await boot(page)
  await openSettings(page)

  const glass = page.getByRole('radiogroup', { name: 'Glass' })
  await glass.getByRole('radio', { name: 'Vibrant' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-glass', 'vibrant')

  const reduced = page.getByRole('switch', { name: 'Reduced effects' })
  await reduced.click()
  await expect(page.locator('html')).toHaveAttribute('data-effects', 'reduced')
  await expect(page.locator('html')).toHaveAttribute('data-glass', 'off')
  // No material override while off: --glass-sat is back to the (unset) default.
  expect(await cssVar(page, '--glass-sat')).toBe('')

  // The stored choice survives — turning reduced off returns to Vibrant.
  await reduced.click()
  await expect(page.locator('html')).toHaveAttribute('data-effects', 'full')
  await expect(page.locator('html')).toHaveAttribute('data-glass', 'vibrant')
  expect(await cssVar(page, '--glass-sat')).toBe('2')
})
