import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/db/db'
import { getSettings, updateSettings } from '@/data/repositories/settings'
import { defaultSettings, SETTINGS_ID } from '@/data/defaults'

async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
}

describe('settings persistence', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('returns defaults on first access', async () => {
    const settings = await getSettings()
    expect(settings.id).toBe(SETTINGS_ID)
    expect(settings.theme).toBe('auto')
    expect(settings.defaultSearchEngine).toBe('google')
    expect(settings.iconSize).toBe('regular')
    expect(settings.showLabels).toBe(true)
    expect(settings.reducedEffects).toBe(false)
    expect(settings.wallpaper).toEqual({ kind: 'builtin', id: 'ember' })
  })

  it('persists a settings patch', async () => {
    await updateSettings({
      theme: 'dark',
      defaultSearchEngine: 'duckduckgo',
      iconSize: 'large',
      showLabels: false,
      reducedEffects: true,
    })
    const persisted = await getSettings()
    expect(persisted.theme).toBe('dark')
    expect(persisted.defaultSearchEngine).toBe('duckduckgo')
    expect(persisted.iconSize).toBe('large')
    expect(persisted.showLabels).toBe(false)
    expect(persisted.reducedEffects).toBe(true)
  })

  it('partial updates preserve the other fields', async () => {
    await updateSettings({ theme: 'dark' })
    await updateSettings({ iconSize: 'small', showLabels: false })
    const settings = await getSettings()
    expect(settings.theme).toBe('dark')
    expect(settings.iconSize).toBe('small')
    expect(settings.showLabels).toBe(false)
    expect(settings.defaultSearchEngine).toBe('google')
    expect(settings.dashboardPanels).toEqual(defaultSettings().dashboardPanels)
  })

  it('updates the updatedAt timestamp', async () => {
    await updateSettings({ theme: 'light' })
    const settings = await getSettings()
    expect(settings.updatedAt).toBeGreaterThan(0)
    expect(settings.createdAt).toBeGreaterThan(0)
    const row = await db.settings.get(SETTINGS_ID)
    expect(row?.theme).toBe('light')
  })
})
