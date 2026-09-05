import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { addShortcut, boot, goHome, openSettings } from './helpers'

/**
 * Spec flows 12, 13 & 16 — Settings persistence (wallpaper, theme, icon size,
 * labels) across reloads, plus JSON backup export/import (desktop).
 */

test('12. changing the wallpaper persists across a reload', async ({ page }) => {
  await boot(page)
  await openSettings(page)

  const builtins = page.getByRole('radiogroup', { name: 'Built-in wallpapers' })
  await builtins.getByRole('radio', { name: 'Dusk wallpaper' }).click()
  await expect(builtins.getByRole('radio', { name: 'Dusk wallpaper' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(builtins.getByRole('radio', { name: 'Ember wallpaper' })).toHaveAttribute(
    'aria-checked',
    'false',
  )

  await page.reload()
  await openSettings(page)
  const after = page.getByRole('radiogroup', { name: 'Built-in wallpapers' })
  await expect(after.getByRole('radio', { name: 'Dusk wallpaper' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
})

test('13. appearance + home settings persist across a reload', async ({ page }) => {
  await boot(page)
  await openSettings(page)

  // Theme → Light.
  const theme = page.getByRole('radiogroup', { name: 'Theme' })
  await theme.getByRole('radio', { name: 'Light' }).click()
  await expect(theme.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true')

  // Home → Large icons, labels hidden.
  const icons = page.getByRole('radiogroup', { name: 'Icon size' })
  await icons.getByRole('radio', { name: 'Large' }).click()
  const labels = page.getByRole('switch', { name: 'Show labels' })
  await labels.click()
  await expect(labels).toHaveAttribute('aria-checked', 'false')

  // Theme applied live.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  await openSettings(page)
  const theme2 = page.getByRole('radiogroup', { name: 'Theme' })
  await expect(theme2.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true')
  const icons2 = page.getByRole('radiogroup', { name: 'Icon size' })
  await expect(icons2.getByRole('radio', { name: 'Large' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: 'Show labels' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
})

test('16. export a JSON backup and import it back (desktop)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Import/export is covered on the desktop project')
  await boot(page)
  await openSettings(page)
  await switchAdvanced(page)

  // Export → download a Hearth backup JSON.
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^hearth-backup-.*\.json$/)
  const backupPath = await download.path()
  if (!backupPath) throw new Error('Download produced no file')
  const json = JSON.parse(readFileSync(backupPath, 'utf8'))
  expect(json).toBeTruthy()

  // Change data after the backup was taken.
  await goHome(page)
  await addShortcut(page, 'Temp Link', 'https://example.com/temp')

  // Import the earlier backup → the app reverts to its backup-time state.
  await openSettings(page)
  await switchAdvanced(page)
  await page.getByRole('button', { name: 'Import JSON…' }).click()
  await page.locator('input[type="file"]').setInputFiles(backupPath)
  const confirm = page.getByRole('alertdialog', { name: 'Confirm import' })
  await confirm.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByRole('button', { name: 'Reload now' }).click()

  await expect(page.getByRole('button', { name: 'Open Google' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Open Temp Link' })).toHaveCount(0)
})

/** Flip the Settings segmented control to Advanced. */
async function switchAdvanced(page: Page): Promise<void> {
  await page
    .getByRole('radiogroup', { name: 'Settings level' })
    .getByRole('radio', { name: 'Advanced' })
    .click()
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible()
}
