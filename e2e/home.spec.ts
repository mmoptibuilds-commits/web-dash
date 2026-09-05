import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  boot,
  cellOf,
  enterEdit,
  exitEdit,
  folderTile,
  pageTitleButton,
  tile,
} from './helpers'

/** The confirmation dialog body used by Edit Mode removals. */
function removeDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Remove from page' })
}

/**
 * Spec flows 3, 6, 7 & 8 on Home: shortcut add/edit/remove, page
 * create/navigate/rename, item reorder in Edit Mode, and folder open/close +
 * contained shortcut.
 */

test('3. add, edit and remove a shortcut on Home', async ({ page }) => {
  await boot(page)

  // Add.
  await enterEdit(page)
  await page.getByRole('button', { name: 'Shortcut', exact: true }).click()
  const add = page.getByRole('dialog', { name: 'Add shortcut' })
  await add.getByLabel('Name').fill('Hearth Docs')
  await add.getByLabel('Web address').fill('https://example.com/docs')
  await add.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(tile(page, 'Hearth Docs')).toBeVisible()

  // Edit (still in Edit Mode — clicking the tile opens the edit form).
  await tile(page, 'Hearth Docs').click()
  const edit = page.getByRole('dialog', { name: 'Edit shortcut' })
  await expect(edit.getByLabel('Name')).toHaveValue('Hearth Docs')
  await expect(edit.getByLabel('Web address')).toHaveValue('https://example.com/docs')
  await edit.getByLabel('Name').fill('Hearth Manual')
  await edit.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(tile(page, 'Hearth Manual')).toBeVisible()
  await expect(tile(page, 'Hearth Docs')).toHaveCount(0)

  // Remove (confirm dialog).
  await cellOf(tile(page, 'Hearth Manual')).getByRole('button', { name: 'Remove from page' }).click()
  await removeDialog(page).getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(removeDialog(page)).toBeHidden()
  await expect(tile(page, 'Hearth Manual')).toHaveCount(0)
  await exitEdit(page)

  // Starter tiles are untouched.
  await expect(tile(page, 'Google')).toBeVisible()
})

test('6. create a second Home page, rename it and navigate between pages', async ({ page }) => {
  await boot(page)

  // Open the Pages manager from the page title, add a page.
  await pageTitleButton(page).click()
  const pagesDialog = page.getByRole('dialog', { name: 'Pages' })
  await pagesDialog.getByRole('button', { name: 'Add page' }).click()

  // The new page is active, named "Page" by default.
  await expect(pageTitleButton(page)).toHaveText('Page')
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()

  // Rename it to "Work" via the manager (2nd name input).
  await pageTitleButton(page).click()
  const nameInputs = page.getByRole('dialog', { name: 'Pages' }).getByLabel('Page name')
  await nameInputs.nth(1).fill('Work')
  await nameInputs.nth(1).press('Enter')
  await page.getByRole('button', { name: 'Close dialog' }).click()

  // Navigate back to page 1 (Home) and forward to the renamed page via dots.
  await page.getByRole('button', { name: 'Page 1: Home' }).click()
  await expect(pageTitleButton(page)).toHaveText('Home')
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled()

  await page.getByRole('button', { name: 'Page 2: Work' }).click()
  await expect(pageTitleButton(page)).toHaveText('Work')

  // The new page starts empty.
  await expect(page.getByText('This page is empty.')).toBeVisible()
})

test('7. reposition a tile on the desktop freeform canvas and keep it after reload', async ({
  page,
}) => {
  test.skip(!(await isDesktop(page)), 'Freeform drag is exercised on the desktop viewport')
  await boot(page)
  await enterEdit(page)

  const src = tile(page, 'Google')
  const dst = tile(page, 'Gmail')
  const sB = await src.boundingBox()
  const dB = await dst.boundingBox()
  if (!sB || !dB) throw new Error('Missing tile geometry')

  // Drag src's centre onto dst's centre → identical boxes (full overlap), with
  // src raised to the front. Freeform means no neighbour reflows to make room.
  await page.mouse.move(sB.x + sB.width / 2, sB.y + sB.height / 2)
  await page.mouse.down()
  await page.mouse.move(dB.x + dB.width / 2, dB.y + dB.height / 2, { steps: 24 })
  await page.mouse.up()
  await page.waitForTimeout(400)

  const after = await src.boundingBox()
  if (!after) throw new Error('Missing tile geometry after drag')
  expect(after.x).toBeCloseTo(dB.x, 0)
  expect(after.y).toBeCloseTo(dB.y, 0)
  // Google now stacks above Gmail (bring-to-front on drag engage).
  expect(await zIndex(cellOf(src))).toBeGreaterThan(await zIndex(cellOf(dst)))

  // Geometry persists across reload — the freeform position is real data.
  await page.reload()
  await expect(src).toBeVisible()
  const persisted = await src.boundingBox()
  if (!persisted) throw new Error('Missing tile geometry after reload')
  expect(persisted.x).toBeCloseTo(dB.x, 0)
  expect(persisted.y).toBeCloseTo(dB.y, 0)
  expect(await zIndex(cellOf(src))).toBeGreaterThan(await zIndex(cellOf(dst)))

  // Per-breakpoint independence: on the compact grid the same items keep their
  // grid flow (no corruption from the desktop overlap), and shrinking back to
  // desktop restores the dragged geometry untouched.
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(src).toBeVisible()
  await expect(dst).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(src).toBeVisible()
  const back = await src.boundingBox()
  if (!back) throw new Error('Missing tile geometry back on desktop')
  expect(back.x).toBeCloseTo(dB.x, 0)
  expect(back.y).toBeCloseTo(dB.y, 0)
})

test('reorder an item on the compact grid and keep the order after reload', async ({ page }) => {
  test.skip(await isDesktop(page), 'Drag-band reorder is exercised on the mobile grid')
  await boot(page)

  // Pick whichever of the two tiles sits lower so the drag always moves upward.
  const wiki = tile(page, 'Wikipedia')
  const google = tile(page, 'Google')
  const wikiB = await wiki.boundingBox()
  const googleB = await google.boundingBox()
  if (!wikiB || !googleB) throw new Error('Missing tile geometry')
  const low = wikiB.y > googleB.y ? wiki : google
  const high = low === wiki ? google : wiki
  const lowBefore = await low.boundingBox()
  if (!lowBefore) throw new Error('Missing tile geometry')

  await enterEdit(page)
  const handle = cellOf(low).getByRole('button', { name: 'Drag to rearrange' })
  const highBox = await high.boundingBox()
  const start = await handle.boundingBox()
  if (!highBox || !start) throw new Error('Missing tile geometry')

  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(highBox.x + highBox.width / 2, highBox.y + highBox.height / 2, {
    steps: 18,
  })
  await page.mouse.up()
  await page.waitForTimeout(500)
  await exitEdit(page)

  const lowAfter = await low.boundingBox()
  if (!lowAfter) throw new Error('Missing tile geometry after drag')
  expect(lowAfter.y).toBeLessThan(lowBefore.y - 5)

  // The new order is persisted (data), so a reload keeps the item on its row.
  await page.reload()
  await expect(low).toBeVisible()
  const persisted = await low.boundingBox()
  if (!persisted) throw new Error('Missing tile geometry after reload')
  expect(persisted.y).toBeLessThan(lowBefore.y - 5)
})

test('8. open/close a folder and open a contained shortcut from a folder', async ({ page }) => {
  await boot(page)

  // Starter "Dev" folder opens to its members and closes again.
  await folderTile(page, 'Dev').click()
  const dev = page.getByRole('dialog', { name: 'Folder Dev' })
  await expect(dev).toBeVisible()
  await expect(dev.getByText('2 links')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open MDN' })).toBeVisible()
  await dev.getByRole('button', { name: 'Back to pages' }).click()
  await expect(dev).toBeHidden()

  // Create a folder + a same-origin link inside it, then open the link.
  const dest = `${new URL(page.url()).origin}/folder-destination`
  await enterEdit(page)
  await page.getByRole('button', { name: 'Folder', exact: true }).click()
  const newFolder = page.getByRole('dialog', { name: 'New folder' })
  await newFolder.getByPlaceholder('Folder name').fill('Work')
  await newFolder.getByRole('button', { name: 'Create' }).click()

  const folderView = page.getByRole('dialog', { name: 'Folder Work' })
  await expect(folderView).toBeVisible()
  await folderView.getByRole('button', { name: 'Add link' }).click()
  const addLink = page.getByRole('dialog', { name: 'Add shortcut' })
  await addLink.getByLabel('Name').fill('Sprint board')
  await addLink.getByLabel('Web address').fill(dest)
  await addLink.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(tile(page, 'Sprint board')).toBeVisible()

  // Opening the folder-contained link navigates to its destination.
  await tile(page, 'Sprint board').click()
  await page.waitForURL('**/folder-destination')
})

async function isDesktop(page: Page): Promise<boolean> {
  const vp = page.viewportSize()
  return vp ? vp.width >= 1024 : false
}

/** Computed stacking order of a tile wrapper (the freeform canvas z value). */
async function zIndex(locator: Locator): Promise<number> {
  const v = await locator.evaluate((el) => Number(getComputedStyle(el as HTMLElement).zIndex))
  return v
}
