import type { Transaction } from 'dexie'
import type { LayoutItem, WidgetInstance } from '@/types/domain'
import { assignDefaultGeometry, freeBoxForKind } from '@/data/layout/geometry'

/**
 * DB version 1 → 2: freeform canvas geometry backfill.
 *
 * Version 1 rows carry only `order`. Version 2 adds optional x/y/w/h/z used by
 * the desktop freeform canvas (see src/types/domain.ts + geometry.ts). This
 * upgrade replays every item on every page through the same deterministic
 * first-fit packer the live add path uses, so existing V1 data lands on the
 * same canonical rhythm as fresh seeds. Compact/ordered-grid behaviour is
 * untouched — `order` is preserved verbatim.
 *
 * Idempotent by construction: it runs once inside the schema upgrade and only
 * writes the geometry fields V1 rows lack.
 */
export async function upgradeToFreeform(tx: Transaction): Promise<void> {
  const items = await tx.table<LayoutItem, string>('layoutItems').toArray()
  if (items.length === 0) return

  const widgets = await tx.table<WidgetInstance, string>('widgetInstances').toArray()
  const sizeById = new Map(widgets.map((w) => [w.id, w.size]))

  const byPage = new Map<string, LayoutItem[]>()
  for (const it of items) {
    const list = byPage.get(it.pageId)
    if (list) list.push(it)
    else byPage.set(it.pageId, [it])
  }

  const table = tx.table<LayoutItem, string>('layoutItems')
  for (const pageItems of byPage.values()) {
    const sorted = [...pageItems].sort((a, b) => a.order - b.order)
    const canonical = sorted.map((it) => {
      const box = freeBoxForKind(it.kind, it.kind === 'widget' ? sizeById.get(it.refId) : undefined)
      return { id: it.id, order: it.order, w: box.w, h: box.h }
    })
    const placed = assignDefaultGeometry(canonical)
    await Promise.all(
      sorted.map((it, z) => {
        const pos = placed.get(it.id)
        if (!pos) return Promise.resolve()
        const box = freeBoxForKind(
          it.kind,
          it.kind === 'widget' ? sizeById.get(it.refId) : undefined,
        )
        return table.update(it.id, { x: pos.x, y: pos.y, w: box.w, h: box.h, z })
      }),
    )
  }
}
