import { db } from '@/data/db/db'
import type { BuiltinAppId, DockItem } from '@/types/domain'
import { uid } from '@/lib/id'

export async function listDock(): Promise<DockItem[]> {
  const items = await db.dockItems.toArray()
  return [...items].sort((a, b) => a.order - b.order)
}

export async function addAppToDock(appId: BuiltinAppId): Promise<DockItem | null> {
  const existing = await db.dockItems.where('appId').equals(appId).toArray()
  if (existing.some((d) => d.shortcutId === null)) return existing.find((d) => d.shortcutId === null) ?? null
  const order = (await listDock()).length
  const item: DockItem = {
    id: uid('dock'),
    order,
    appId,
    shortcutId: null,
  }
  await db.dockItems.put(item)
  return item
}

export async function addShortcutToDock(shortcutId: string): Promise<DockItem> {
  const existing = await db.dockItems.where('shortcutId').equals(shortcutId).toArray()
  if (existing.length) return existing[0]
  const order = (await listDock()).length
  const item: DockItem = { id: uid('dock'), order, appId: 'dashboard', shortcutId }
  await db.dockItems.put(item)
  return item
}

export async function removeDockItem(id: string): Promise<void> {
  await db.dockItems.delete(id)
}

export async function isAppDocked(appId: BuiltinAppId): Promise<boolean> {
  const items = await db.dockItems.where('appId').equals(appId).toArray()
  return items.some((d) => d.shortcutId === null)
}

/** Reorder the whole dock to `orderedIds`. */
export async function setDockOrder(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.dockItems, async () => {
    await Promise.all(orderedIds.map((id, i) => db.dockItems.update(id, { order: i })))
  })
}

/** Reset dock to app defaults (kept for a settings affordance). */
export async function resetDockToDefault(): Promise<void> {
  const apps: BuiltinAppId[] = [
    'dashboard',
    'notes',
    'tasks',
    'calendar',
    'bookmarks',
    'settings',
  ]
  await db.dockItems.clear()
  await Promise.all(
    apps.map((appId, i) => db.dockItems.put({ id: uid('dock'), order: i, appId, shortcutId: null })),
  )
}
