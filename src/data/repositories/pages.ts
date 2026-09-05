import { db } from '@/data/db/db'
import type { HomePage } from '@/types/domain'
import { now } from '@/types/domain'
import { uid } from '@/lib/id'

export async function listPages(): Promise<HomePage[]> {
  const pages = await db.homePages.toArray()
  return [...pages].sort((a, b) => a.index - b.index)
}

export async function getPage(id: string): Promise<HomePage | undefined> {
  return db.homePages.get(id)
}

export async function createPage(name = 'Page'): Promise<HomePage> {
  const pages = await listPages()
  const maxIndex = pages.reduce((m, p) => Math.max(m, p.index), -1)
  const t = now()
  const page: HomePage = {
    id: uid('page'),
    index: maxIndex + 1,
    name: name.trim().slice(0, 30) || 'Page',
    createdAt: t,
    updatedAt: t,
  }
  await db.homePages.put(page)
  return page
}

export async function renamePage(id: string, name: string): Promise<void> {
  await db.homePages.update(id, { name: name.trim().slice(0, 30) || 'Page', updatedAt: now() })
}

/** Delete a page and its layout items. Never leaves the app page-less. */
export async function deletePage(id: string): Promise<void> {
  const remaining = await db.homePages.count()
  if (remaining <= 1) {
    // Keep at least one page: clear instead.
    const items = await db.layoutItems.where('pageId').equals(id).toArray()
    await db.layoutItems.bulkDelete(items.map((i) => i.id))
    return
  }
  await db.transaction('rw', db.homePages, db.layoutItems, async () => {
    const items = await db.layoutItems.where('pageId').equals(id).toArray()
    await db.layoutItems.bulkDelete(items.map((i) => i.id))
    await db.homePages.delete(id)
  })
  // Re-normalize indexes after removal.
  const pages = await listPages()
  await Promise.all(pages.map((p, i) => db.homePages.update(p.id, { index: i })))
}

/** Move a page to `toIndex` among the current ordered page list. */
export async function movePage(id: string, toIndex: number): Promise<void> {
  const pages = await listPages()
  const from = pages.findIndex((p) => p.id === id)
  if (from < 0) return
  const clamped = Math.max(0, Math.min(pages.length - 1, toIndex))
  if (from === clamped) return
  const [page] = pages.splice(from, 1)
  pages.splice(clamped, 0, page)
  await Promise.all(pages.map((p, i) => db.homePages.update(p.id, { index: i, updatedAt: now() })))
}
