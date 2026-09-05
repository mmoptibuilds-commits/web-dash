import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/db/db'
import {
  BACKUP_KIND,
  BACKUP_SCHEMA_VERSION,
  exportBackupJson,
  importBackupJson,
} from '@/data/repositories/backup'
import { getSettings, updateSettings } from '@/data/repositories/settings'
import { SETTINGS_ID } from '@/data/defaults'
import { ensureBootData, wipeAllData } from '@/data/seed'

const NORMAL_TABLES = [
  'settings',
  'homePages',
  'layoutItems',
  'shortcuts',
  'folders',
  'widgetInstances',
  'notes',
  'tasks',
  'history',
  'dockItems',
] as const

async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
}

async function addRowsAcrossTables(): Promise<void> {
  await updateSettings({ theme: 'dark', iconSize: 'large' })
  await db.notes.put({
    id: 'note-1',
    title: 'Buy milk',
    body: '2%',
    pinned: false,
    createdAt: 1,
    updatedAt: 1,
  })
  await db.tasks.put({
    id: 'task-1',
    text: 'Write backup tests',
    done: false,
    createdAt: 1,
    doneAt: null,
    updatedAt: 1,
  })
  await db.history.put({
    id: 'query:hearth',
    kind: 'query',
    text: 'hearth',
    url: null,
    count: 2,
    lastUsedAt: 1,
  })
}

describe('backup repository', () => {
  beforeEach(async () => {
    await resetDatabase()
    await ensureBootData()
  })

  it('exports every normal table and excludes wallpaper blobs', async () => {
    await addRowsAcrossTables()
    const json = await exportBackupJson()
    const envelope = JSON.parse(json) as {
      schemaVersion: number
      kind: string
      exportedAt: number
      data: Record<string, Array<{ id: string; theme?: string }>>
    }

    expect(envelope.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(envelope.kind).toBe(BACKUP_KIND)
    expect(typeof envelope.exportedAt).toBe('number')
    expect(envelope.data.wallpapers).toBeUndefined()

    for (const name of NORMAL_TABLES) {
      expect(Array.isArray(envelope.data[name]), `table ${name} is an array`).toBe(true)
    }
    expect(envelope.data.notes.some((n) => n.id === 'note-1')).toBe(true)
    expect(envelope.data.settings.find((s) => s.id === SETTINGS_ID)?.theme).toBe('dark')
  })

  it('round-trips a full export→import over a wiped database', async () => {
    await addRowsAcrossTables()
    const json = await exportBackupJson()

    const countsBefore: Record<string, number> = {}
    for (const name of NORMAL_TABLES) {
      const table = db[name]
      countsBefore[name] = await table.count()
    }

    await wipeAllData() // diverge: only default settings remain

    const res = await importBackupJson(json)
    expect(res).toEqual({ ok: true })

    const settings = await getSettings()
    expect(settings.theme).toBe('dark')
    expect(settings.iconSize).toBe('large')
    expect(await db.notes.get('note-1')).toMatchObject({ title: 'Buy milk' })
    expect(await db.tasks.get('task-1')).toMatchObject({ text: 'Write backup tests' })
    expect(await db.history.get('query:hearth')).toMatchObject({ kind: 'query', count: 2 })

    for (const name of NORMAL_TABLES) {
      const table = db[name]
      expect(await table.count(), `table ${name} count restored`).toBe(countsBefore[name])
    }
  })

  it('rejects a tampered schema version and leaves existing rows intact', async () => {
    await addRowsAcrossTables()
    const tampered = JSON.stringify({
      schemaVersion: 99,
      kind: BACKUP_KIND,
      exportedAt: 1,
      data: { notes: await db.notes.toArray() },
    })

    const res = await importBackupJson(tampered)
    if (res.ok) throw new Error('expected import to fail')
    expect(res.reason).toContain('Unsupported backup version')

    expect(await db.notes.get('note-1')).toBeDefined()
    expect(await db.tasks.get('task-1')).toBeDefined()
    expect((await getSettings()).theme).toBe('dark')
  })

  it('rejects a wrong kind and non-JSON text without touching data', async () => {
    await addRowsAcrossTables()
    const notesBefore = await db.notes.count()

    const wrongKind = await importBackupJson(
      JSON.stringify({ schemaVersion: 1, kind: 'something-else', data: {} }),
    )
    if (wrongKind.ok) throw new Error('expected wrong-kind import to fail')
    expect(wrongKind.reason).toContain('Not a Hearth backup')

    const notJson = await importBackupJson('this is not json')
    if (notJson.ok) throw new Error('expected non-JSON import to fail')
    expect(notJson.reason).toContain('JSON')

    expect(await db.notes.count()).toBe(notesBefore)
    expect(await db.notes.get('note-1')).toBeDefined()
  })

  it('rejects unknown tables and malformed table payloads', async () => {
    await addRowsAcrossTables()

    const unknownTable = await importBackupJson(
      JSON.stringify({ schemaVersion: 1, kind: BACKUP_KIND, data: { wallpapers: [] } }),
    )
    if (unknownTable.ok) throw new Error('expected unknown-table import to fail')
    expect(unknownTable.reason).toContain('wallpapers')

    const malformed = await importBackupJson(
      JSON.stringify({ schemaVersion: 1, kind: BACKUP_KIND, data: { notes: 'not-an-array' } }),
    )
    if (malformed.ok) throw new Error('expected malformed import to fail')
    expect(malformed.reason).toContain('malformed')

    expect(await db.notes.get('note-1')).toBeDefined()
  })

  it('tolerates a valid backup that omits some tables', async () => {
    await addRowsAcrossTables()
    const json = await exportBackupJson()
    const envelope = JSON.parse(json) as { data: Record<string, unknown[]> }

    const partial = JSON.stringify({
      schemaVersion: BACKUP_SCHEMA_VERSION,
      kind: BACKUP_KIND,
      exportedAt: 1,
      data: { notes: envelope.data.notes, settings: envelope.data.settings },
    })
    const res = await importBackupJson(partial)
    expect(res).toEqual({ ok: true })

    // Present tables are replaced…
    expect(await db.notes.get('note-1')).toBeDefined()
    // …while omitted tables are skipped, not cleared.
    expect(await db.tasks.get('task-1')).toBeDefined()
    expect(await db.history.get('query:hearth')).toBeDefined()
  })
})
