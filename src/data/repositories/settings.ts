import { db } from '@/data/db/db'
import { defaultSettings, SETTINGS_ID } from '@/data/defaults'
import type { AppSettings } from '@/types/domain'

/** Read settings, creating defaults on first access. */
export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (!existing) {
    const fresh = defaultSettings()
    await db.settings.put(fresh)
    return fresh
  }
  // Merge over the defaults so a settings row written by an older build (which
  // predates a newer optional field such as `glass`) still resolves it. Spread
  // order keeps the stored row's id/timestamps and any real value, letting the
  // default fill only what the row lacks.
  return { ...defaultSettings(), ...existing }
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
