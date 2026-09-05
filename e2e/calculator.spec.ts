import { expect, test } from '@playwright/test'
import { boot, enterEdit, exitEdit, openApp } from './helpers'

/**
 * Calculator feature — Basic / Dates / Currency mini-app + Home widget.
 *
 * The mini-app runs identically in a desktop window and a mobile sheet (the
 * shell hands it the same content surface), and the Home widget offers quick
 * sums that open the full app. Currency rates are offline and user-editable,
 * so edits must survive a reload (local-first persistence).
 */

test('calc.1 widget solves a quick sum and opens the full calculator', async ({
  page,
  isMobile,
}) => {
  await boot(page)
  await enterEdit(page)

  // Add the Calculator widget; it lands on the active Home page.
  const picker = page.getByRole('dialog', { name: 'Add widget' })
  await page.getByRole('button', { name: 'Widget', exact: true }).click()
  await expect(picker).toBeVisible()
  await picker.getByRole('button', { name: /^Calculator / }).click()
  await expect(picker).toHaveCount(0)
  await exitEdit(page)

  // Home tiles carry no wrapper role outside Edit Mode, so scope to the widget
  // itself — its keypad is live in view mode.
  const widget = page.getByTestId('calculator-widget')
  await expect(widget).toBeVisible()
  const display = widget.getByTestId('calc-display')

  await widget.getByRole('button', { name: '5', exact: true }).click()
  await widget.getByRole('button', { name: 'Add', exact: true }).click()
  await widget.getByRole('button', { name: '4', exact: true }).click()
  await widget.getByRole('button', { name: 'Equals', exact: true }).click()
  await expect(display).toHaveText('9')

  // The footer opens the full app (desktop window / mobile sheet). Scope to the
  // widget — the dock's Calculator launcher shares the same accessible name.
  await widget.getByRole('button', { name: 'Open Calculator', exact: true }).click()
  await expect(page.getByTestId('calculator-mini-app')).toBeVisible()
  if (!isMobile) {
    await expect(page.getByRole('dialog', { name: 'Calculator window' })).toBeVisible()
  }
})

test('calc.2 basic arithmetic, error and clear in the app', async ({ page }) => {
  await boot(page)
  await openApp(page, 'Calculator')
  const app = page.getByTestId('calculator-mini-app')
  await expect(app).toBeVisible()
  const display = app.getByTestId('calc-display')

  // 20 − 5 = 15.
  await app.getByRole('button', { name: '2', exact: true }).click()
  await app.getByRole('button', { name: '0', exact: true }).click()
  await app.getByRole('button', { name: 'Subtract', exact: true }).click()
  await app.getByRole('button', { name: '5', exact: true }).click()
  await app.getByRole('button', { name: 'Equals', exact: true }).click()
  await expect(display).toHaveText('15')

  // All clear returns to 0.
  await app.getByRole('button', { name: 'All clear', exact: true }).click()
  await expect(display).toHaveText('0')

  // 8 ÷ 0 reports Error; a digit starts over.
  await app.getByRole('button', { name: '8', exact: true }).click()
  await app.getByRole('button', { name: 'Divide', exact: true }).click()
  await app.getByRole('button', { name: '0', exact: true }).click()
  await app.getByRole('button', { name: 'Equals', exact: true }).click()
  await expect(display).toHaveText('Error')
  await app.getByRole('button', { name: '3', exact: true }).click()
  await expect(display).toHaveText('3')
})

test('calc.3 age breakdown between two picked dates', async ({ page }) => {
  await boot(page)
  await openApp(page, 'Calculator')
  const app = page.getByTestId('calculator-mini-app')
  await app.getByRole('button', { name: 'Dates', exact: true }).click()

  await app.getByLabel('Birth date').fill('2023-01-31')
  await app.getByLabel('Age on date').fill('2023-04-30')

  // Jan 31 → Apr 30 (2023) is exactly 3 whole months, 0 days.
  await expect(app.getByTestId('age-breakdown')).toContainText('3 months, 0 days')
  // The next birthday is 1 next January.
  await expect(app.getByText(/turns 1 in/)).toBeVisible()
})

test('calc.4 currency converts, and an edited rate survives reload', async ({
  page,
}) => {
  await boot(page)
  await openApp(page, 'Calculator')
  const app = page.getByTestId('calculator-mini-app')
  await app.getByRole('button', { name: 'Currency', exact: true }).click()

  // Baseline default pair: 100 USD → 92 EUR.
  const from = app.getByRole('combobox', { name: 'From currency' })
  await expect(from).toBeVisible()
  await app.getByLabel('Amount').fill('100')
  const output = app.getByTestId('currency-output')
  await expect(output).toContainText('92')
  await expect(app.getByTestId('cross-rate')).toContainText('1 USD = 0.92 EUR')

  // Edit EUR to parity (1 EUR per USD) and save — the row is persisted.
  await app.getByRole('button', { name: 'Edit rates', exact: true }).click()
  const eur = app.getByLabel('EUR rate per USD')
  await eur.fill('1')
  await app.getByRole('button', { name: 'Save rates', exact: true }).click()
  await expect(app.getByRole('button', { name: /Close rate editor/ })).toBeHidden()
  await expect(app.getByText('manual', { exact: true })).toBeVisible()

  // Reload persistence: the manual table (and its chip) is still there.
  await page.reload()
  await openApp(page, 'Calculator')
  const after = page.getByTestId('calculator-mini-app')
  await after.getByRole('button', { name: 'Currency', exact: true }).click()
  await expect(after.getByRole('combobox', { name: 'From currency' })).toBeVisible()
  await expect(after.getByText('manual', { exact: true })).toBeVisible()
  await after.getByLabel('Amount').fill('100')
  await expect(after.getByTestId('currency-output')).toContainText('100')

  // Reset restores the shipped baseline.
  await after.getByRole('button', { name: 'Edit rates', exact: true }).click()
  await after.getByRole('button', { name: 'Reset rates', exact: true }).click()
  await expect(after.getByRole('button', { name: 'Close rate editor' })).toBeVisible()
  await after.getByRole('button', { name: 'Close rate editor', exact: true }).click()
  await after.getByLabel('Amount').fill('100')
  await expect(after.getByTestId('currency-output')).toContainText('92')
})
