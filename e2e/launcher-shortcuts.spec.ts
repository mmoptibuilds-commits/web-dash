import { expect, test } from '@playwright/test'
import { boot } from './helpers'

test('Apps creates, edits and deletes links in the shared shortcut repository', async ({ page, isMobile }) => {
  await boot(page)
  await page.getByRole('button', { name: 'Open Apps', exact: true }).click()
  const launcher = page.getByRole('dialog', { name: 'Apps and links' })

  await launcher.getByRole('button', { name: 'Add shortcut' }).click()
  const add = page.getByRole('dialog', { name: 'Add shortcut' })
  await add.getByLabel('Name').fill('Launchpad Link')
  await add.getByLabel('Web address').fill('example.com')
  await add.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(launcher.getByRole('button', { name: 'Open Launchpad Link' })).toBeVisible()

  await launcher.getByRole('button', { name: 'Edit Launchpad Link' }).click()
  const edit = page.getByRole('dialog', { name: 'Edit Launchpad Link' })
  await edit.getByLabel('Name').fill('Shared Link')
  await edit.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(launcher.getByRole('button', { name: 'Open Shared Link' })).toBeVisible()

  // The Links app reads the same Dexie table; no launcher-specific record is copied.
  await launcher.getByRole('button', { name: 'Open Links', exact: true }).click()
  await expect(page.getByText('Shared Link', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: isMobile ? 'Back to Home' : 'Close Links', exact: true }).click()

  await page.getByRole('button', { name: 'Open Apps', exact: true }).click()
  const reopened = page.getByRole('dialog', { name: 'Apps and links' })
  await reopened.getByRole('button', { name: 'Delete Shared Link' }).click()
  await page.getByRole('dialog', { name: 'Delete shortcut?' }).getByRole('button', { name: 'Delete' }).click()
  await expect(reopened.getByRole('button', { name: 'Open Shared Link' })).toHaveCount(0)

  const rows = await page.evaluate(async () => {
    const request = indexedDB.open('hearth')
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const tx = db.transaction('shortcuts', 'readonly')
    const all = tx.objectStore('shortcuts').getAll()
    return new Promise<Array<{ label: string }>>((resolve, reject) => {
      all.onsuccess = () => resolve(all.result)
      all.onerror = () => reject(all.error)
    })
  })
  expect(rows.filter((row) => row.label === 'Shared Link')).toHaveLength(0)
})
