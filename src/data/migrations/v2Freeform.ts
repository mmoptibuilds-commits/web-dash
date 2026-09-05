import type { Transaction } from 'dexie'
import type { LayoutItem, WidgetInstance } from '@/types/domain'
import { planFreeformGeometry } from '@/data/layout/geometry'

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
 * writes the geometry fields V1 rows lack. The per-page packing is the shared
 * `planFreeformGeometry` (geometry.ts) so restore/backfill of pre-freeform
 * backups converges on the same canonical layout.
 */
export async function upgradeToFreeform(tx: Transaction): Promise<void> {
  const items = await tx.table<LayoutItem, string>('layoutItems').toArray()
  if (items.length === 0) return

  const widgets = await tx.table<WidgetInstance, string>('widgetInstances').toArray()
  const sizeById = new Map(widgets.map((w) => [w.id, w.size]))

  const plan = planFreeformGeometry(
    items.map((it) => ({
      id: it.id,
      pageId: it.pageId,
      order: it.order,
      kind: it.kind,
      refId: it.refId,
    })),
    (refId) => sizeById.get(refId),
  )

  const table = tx.table<LayoutItem, string>('layoutItems')
  await Promise.all(
    [...plan].map(([id, p]) =>
      table.update(id, { x: p.box.x, y: p.box.y, w: p.box.w, h: p.box.h, z: p.z }),
    ),
  )
}
