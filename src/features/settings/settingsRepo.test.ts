import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/db/db'
import { getSettings, updateSettings } from '@/data/repositories/settings'
import { SETTINGS_ID } from '@/data/defaults'

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
    expect(settings.glass).toBe('standard')
    expect(settings.glassTranslucency).toBe(0.5)
    expect(settings.wallpaper).toEqual({ kind: 'builtin', id: 'lagoon' })
  })

  it('backfills a missing field on a legacy settings row', async () => {
    // A settings row written before `glass` existed has no such field. Cast via
    // unknown: AppSettings now requires glass, but the whole point is it is absent.
    await db.settings.put({
      id: SETTINGS_ID,
      theme: 'dark',
      reducedEffects: false,
      defaultSearchEngine: 'google',
      iconSize: 'regular',
      showLabels: true,
      wallpaper: { kind: 'builtin', id: 'ember' },
      createdAt: 1,
      updatedAt: 1,
    } as unknown as import('@/types/domain').AppSettings)
    const settings = await getSettings()
    expect(settings.theme).toBe('dark')
    expect(settings.glass).toBe('standard')
    expect(settings.glassTranslucency).toBe(0.5)
    expect(settings.createdAt).toBe(1)
  })

  it('persists a glass preset', async () => {
    await updateSettings({ glass: 'vibrant' })
    const settings = await getSettings()
    expect(settings.glass).toBe('vibrant')
  })

  it('persists a transparency level and keeps it across later patches', async () => {
    await updateSettings({ glassTranslucency: 0.85 })
    expect((await getSettings()).glassTranslucency).toBe(0.85)
    await updateSettings({ theme: 'light' })
    const settings = await getSettings()
    expect(settings.theme).toBe('light')
    expect(settings.glassTranslucency).toBe(0.85)
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
