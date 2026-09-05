import { db } from '@/data/db/db'
import { defaultSettings, SETTINGS_ID } from '@/data/defaults'
import type { AppSettings } from '@/types/domain'

/** Read settings, creating defaults on first access. */
export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (existing) return existing
  const fresh = defaultSettings()
  await db.settings.put(fresh)
  return fresh
}

/** Merge a partial patch into persisted settings. */
export async function updateSettings(
  patch: Partial<Omit<AppSettings, 'id' | 'createdAt'>>,
): Promise<AppSettings> {
  const current = await getSettings()
  const next: AppSettings = {
    ...current,
    ...patch,
    id: SETTINGS_ID,
    updatedAt: Date.now(),
  }
  await db.settings.put(next)
  return next
}

export async function hasSettingsRow(): Promise<boolean> {
  return (await db.settings.count()) > 0
}

/** True when any durable app data already exists (used before seeding). */
export async function hasAnyData(): Promise<boolean> {
  const t = await db.transaction(
    'r',
    [db.settings, db.homePages, db.shortcuts, db.notes, db.tasks, db.dockItems],
    async () => {
      const counts = await Promise.all([
        db.settings.count(),
        db.homePages.count(),
        db.shortcuts.count(),
        db.notes.count(),
        db.tasks.count(),
        db.dockItems.count(),
      ])
      return counts.some((c) => c > 0)
    },
  )
  return t
}
