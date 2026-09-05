import { db } from '@/data/db/db'
import type { LayoutItem } from '@/types/domain'
import { uid } from '@/lib/id'
import { findFreeSpot, freeBoxForKind, itemBox } from '@/data/layout/geometry'

export type LayoutPayloadKind = 'shortcut' | 'folder' | 'widget'

export async function listItemsForPage(pageId: string): Promise<LayoutItem[]> {
  const items = await db.layoutItems.where('pageId').equals(pageId).toArray()
  return [...items].sort((a, b) => a.order - b.order)
}

async function nextOrder(pageId: string): Promise<number> {
  const items = await db.layoutItems.where('pageId').equals(pageId).toArray()
  return items.reduce((m, i) => Math.max(m, i.order), -1) + 1
}

/**
 * Add an item to a page. Besides appending to the ordered grid (`order`,
 * which the compact <1024px layout flows on), it stamps the item's freeform
 * box so the desktop canvas has real geometry: a canonical box for the payload
 * (widget size drives widget width/height) placed at the first free canonical
 * slot, stacked above every current tile. The two layout models therefore
 * never corrupt each other — grid order and freeform box are independent.
 */
export async function addItemToPage(
  pageId: string,
  kind: LayoutPayloadKind,
  refId: string,
  insertAt?: number,
): Promise<LayoutItem> {
  const items = await listItemsForPage(pageId)
  const order = insertAt ?? (await nextOrder(pageId))
  const size = kind === 'widget' ? (await db.widgetInstances.get(refId))?.size : undefined
  const def = freeBoxForKind(kind, size)
  const existing = items
    .map((it) => itemBox(it))
    .filter((b) => b.w > 0 && b.h > 0)
  const pos = findFreeSpot(existing, def.w, def.h)
  const z = items.reduce((m, it) => Math.max(m, it.z ?? -1), -1) + 1
  const item: LayoutItem = {
    id: uid('li'),
    pageId,
    kind,
    refId,
    order,
    x: pos.x,
    y: pos.y,
    w: def.w,
    h: def.h,
    z,
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

/** Set part of an item's freeform box (x/y/w/h/z). The editor calls this on
 *  drag/resize/keyboard end; it never touches `order`, so desktop edits cannot
 *  disturb the compact grid. */
export async function setItemBox(
  itemId: string,
  patch: Partial<Pick<LayoutItem, 'x' | 'y' | 'w' | 'h' | 'z'>>,
): Promise<void> {
  await db.layoutItems.update(itemId, patch)
}

/** Set the exact ordered sequence of items on a page (compact grid reorder). */
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
