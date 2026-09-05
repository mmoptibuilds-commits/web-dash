import { db } from '@/data/db/db'
import type { WidgetInstance, WidgetSettings, WidgetSizeId } from '@/types/domain'
import { now } from '@/types/domain'
import { uid } from '@/lib/id'

export async function createWidgetInstance(
  type: string,
  size: WidgetSizeId = 'medium',
  settings: WidgetSettings = {},
): Promise<WidgetInstance> {
  const t = now()
  const instance: WidgetInstance = {
    id: uid('widget'),
    type,
    size,
    settings,
    createdAt: t,
    updatedAt: t,
  }
  await db.widgetInstances.put(instance)
  return instance
}

export async function updateWidgetInstance(
  id: string,
  changes: Partial<Pick<WidgetInstance, 'size' | 'settings'>>,
): Promise<void> {
  await db.widgetInstances.update(id, { ...changes, updatedAt: now() })
}

/** Remove a widget instance and any layout items that referenced it. */
export async function deleteWidgetInstanceCascade(id: string): Promise<void> {
  await db.transaction('rw', db.widgetInstances, db.layoutItems, async () => {
    const items = await db.layoutItems.where('refId').equals(id).toArray()
    await db.layoutItems.bulkDelete(items.map((i) => i.id))
    await db.widgetInstances.delete(id)
  })
}
