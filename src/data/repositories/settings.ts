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
