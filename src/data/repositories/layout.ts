import { db } from '@/data/db/db'
import type { LayoutItem } from '@/types/domain'
import { uid } from '@/lib/id'

export type LayoutPayloadKind = 'shortcut' | 'folder' | 'widget'

export async function listItemsForPage(pageId: string): Promise<LayoutItem[]> {
  const items = await db.layoutItems.where('pageId').equals(pageId).toArray()
  return [...items].sort((a, b) => a.order - b.order)
}

async function nextOrder(pageId: string): Promise<number> {
  const items = await db.layoutItems.where('pageId').equals(pageId).toArray()
  return items.reduce((m, i) => Math.max(m, i.order), -1) + 1
}

export async function addItemToPage(
  pageId: string,
  kind: LayoutPayloadKind,
  refId: string,
  insertAt?: number,
): Promise<LayoutItem> {
  const items = await listItemsForPage(pageId)
  const order = insertAt ?? (await nextOrder(pageId))
  const item: LayoutItem = {
    id: uid('li'),
    pageId,
    kind,
    refId,
    order,
  }
  if (insertAt !== undefined) {
    // Shift subsequent items down to keep `order` dense & ordered.
    const idx = Math.max(0, Math.min(items.length, insertAt))
    const sorted = [...items].sort((a, b) => a.order - b.order)
    const toShift = sorted.slice(idx)
    await Promise.all(
      toShift.map((it, offset) => db.layoutItems.update(it.id, { order: idx + offset + 1 })),
    )
  }
  await db.layoutItems.put(item)
  return item
}

export async function removeItemFromPage(itemId: string): Promise<void> {
  const item = await db.layoutItems.get(itemId)
  await db.layoutItems.delete(itemId)
  if (item) {
    // Dense re-order the remainder for stable grid math.
    const rest = await listItemsForPage(item.pageId)
    await Promise.all(rest.map((it, i) => db.layoutItems.update(it.id, { order: i })))
  }
}

/** Set the exact ordered sequence of items on a page. */
export async function reorderPageItems(pageId: string, orderedItemIds: string[]): Promise<void> {
  await db.transaction('rw', db.layoutItems, async () => {
    await Promise.all(
      orderedItemIds.map((id, i) => db.layoutItems.update(id, { order: i })),
    )
    // Any items on the page not present in the list keep their place at the end.
    const pageItems = await listItemsForPage(pageId)
    const seen = new Set(orderedItemIds)
    const missing = pageItems.filter((it) => !seen.has(it.id))
    await Promise.all(
      missing.map((it, i) => db.layoutItems.update(it.id, { order: orderedItemIds.length + i })),
    )
  })
}

export async function moveItemAcrossPages(
  itemId: string,
  targetPageId: string,
): Promise<void> {
  const item = await db.layoutItems.get(itemId)
  if (!item) return
  const otherItems = await listItemsForPage(targetPageId)
  await db.layoutItems.update(itemId, {
    pageId: targetPageId,
    order: otherItems.reduce((m, i) => Math.max(m, i.order), -1) + 1,
  })
}
