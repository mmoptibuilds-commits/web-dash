import { expect, test, type Locator, type Page } from '@playwright/test'
import { boot, openApp } from './helpers'

/** The three mini-apps exercise real CRUD against IndexedDB. */
const APP_TESTID = { notes: 'notes-mini-app', tasks: 'tasks-mini-app' } as const

/**
 * Spec flows 9, 10 & 11 — Notes and Tasks with reload persistence, and
 * Calendar month navigation. All run identically in a desktop window and a
 * mobile sheet (the shell hands each app the same content surface).
 */

test('9. notes: create, edit and delete a note; content survives reload', async ({ page }) => {
  await boot(page)

  // Create.
  await openApp(page, 'Notes')
  const app = page.getByTestId(APP_TESTID.notes)
  await expect(app).toBeVisible()
  await app.getByLabel('New note').click()
  const editor = page.getByRole('region', { name: 'Note editor' })
  await editor.getByLabel('Note title').fill('Shopping list')
  await editor.getByLabel('Note body').fill('Milk, eggs, bread')
  await waitAutosaved(page)

  // Reload persistence: the note is still listed and opens with its content.
  await page.reload()
  await openApp(page, 'Notes')
  const reopened = page.getByTestId(APP_TESTID.notes)
  await reopened.getByText('Shopping list').click()
  const editor2 = page.getByRole('region', { name: 'Note editor' })
  await expect(editor2.getByLabel('Note title')).toHaveValue('Shopping list')
  await expect(editor2.getByLabel('Note body')).toHaveValue('Milk, eggs, bread')

  // Edit + persist again.
  await editor2.getByLabel('Note body').fill('Milk, eggs, bread, butter')
  await waitAutosaved(page)
  await page.reload()
  await openApp(page, 'Notes')
  await page.getByTestId(APP_TESTID.notes).getByText('Shopping list').click()
  await expect(
    page.getByRole('region', { name: 'Note editor' }).getByLabel('Note body'),
  ).toHaveValue('Milk, eggs, bread, butter')

  // Delete (arm, then confirm) and verify it is gone after reload.
  await page.getByLabel('Delete note').click()
  await page.getByRole('region', { name: 'Note editor' }).getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByTestId(APP_TESTID.notes).getByText('Shopping list')).toHaveCount(0)
  await page.reload()
  await openApp(page, 'Notes')
  await expect(page.getByTestId(APP_TESTID.notes).getByText('Shopping list')).toHaveCount(0)
})

test('10. tasks: add, complete and delete a task; state survives reload', async ({ page }) => {
  await boot(page)

  // Add.
  await openApp(page, 'Tasks')
  const app = page.getByTestId(APP_TESTID.tasks)
  await expect(app).toBeVisible()
  await app.getByLabel('New task text').fill('Buy milk')
  await app.getByRole('button', { name: 'Add task' }).click()
  const openCheck = app.getByRole('checkbox', { name: /Mark “Buy milk” as done/ })
  await expect(openCheck).toBeVisible()
  await expect(app.getByText('1 open · 0 done')).toBeVisible()

  // Complete (the visible toggle is the <label> wrapping the hidden checkbox).
  await openCheck.locator('xpath=..').click()
  const doneCheck = app.getByRole('checkbox', { name: /Mark “Buy milk” as not done/ })
  await expect(doneCheck).toBeChecked()
  // With no open tasks left, the summary flips to the all-completed message.
  await expect(app.getByText('All done')).toBeVisible()

  // Reload persistence.
  await page.reload()
  await openApp(page, 'Tasks')
  const persisted = page
    .getByTestId(APP_TESTID.tasks)
    .getByRole('checkbox', { name: /Mark “Buy milk” as not done/ })
  await expect(persisted).toBeChecked()
  await expect(page.getByTestId(APP_TESTID.tasks).getByText('All done')).toBeVisible()

  // Delete and verify after reload.
  await page
    .getByTestId(APP_TESTID.tasks)
    .getByRole('button', { name: /Delete task “Buy milk”/ })
    .click()
  await expect(page.getByTestId(APP_TESTID.tasks).getByText('Buy milk')).toHaveCount(0)
  await page.reload()
  await openApp(page, 'Tasks')
  await expect(page.getByTestId(APP_TESTID.tasks).getByText('Buy milk')).toHaveCount(0)
})

test('11. calendar: navigate between months and back to today', async ({ page }) => {
  await boot(page)
  await openApp(page, 'Calendar')

  const grid = page.getByRole('grid', { name: /calendar$/ })
  await expect(grid).toBeVisible()
  const nowTitle = await grid.getAttribute('aria-label')
  expect(nowTitle).toBeTruthy()

  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(grid).not.toHaveAttribute('aria-label', nowTitle!)

  await page.getByRole('button', { name: 'Previous month' }).click()
  await expect(grid).toHaveAttribute('aria-label', nowTitle!)

  // Two months forward, then "Today" jumps back to the current month.
  await page.getByRole('button', { name: 'Next month' }).click()
  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(grid).not.toHaveAttribute('aria-label', nowTitle!)
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(grid).toHaveAttribute('aria-label', nowTitle!)
})

/** Wait until the note editor's debounced autosave has flushed. */
async function waitAutosaved(page: Page): Promise<void> {
  const editor: Locator = page.getByRole('region', { name: 'Note editor' })
  // A change flags "Saving…" first, then the debounce (500 ms) flushes it.
  await expect(editor).toContainText('Saving…', { timeout: 3_000 })
  await expect(editor).not.toContainText('Saving…', { timeout: 6_000 })
}
