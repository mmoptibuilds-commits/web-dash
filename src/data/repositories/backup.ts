import { db } from '@/data/db/db'
import type { Table } from 'dexie'
import type {
  AppSettings,
  DockItem,
  Folder,
  HistoryEntry,
  HomePage,
  LayoutItem,
  Note,
  Shortcut,
  TaskItem,
  WidgetInstance,
} from '@/types/domain'

/**
 * JSON backup / restore for the NORMAL app tables.
 *
 * The `wallpapers` table is intentionally excluded from backups: its rows
 * carry large media Blobs (image / animated / video, up to 50 MB) which would
 * bloat a JSON export and are not JSON-serialisable without base64. A restored
 * backup may therefore reference user wallpapers whose media no longer exists;
 * the picker falls back to the default builtin when that happens. This keeps
 * exports lean — see PRODUCT_SPEC §Settings.
 */

export const BACKUP_SCHEMA_VERSION = 1
export const BACKUP_KIND = 'hearth-backup'

export interface BackupEnvelope {
  schemaVersion: number
  kind: string
  exportedAt: number
  data: Record<string, unknown[]>
}

interface BackupTableHandle {
  name: string
  read: () => Promise<unknown[]>
  clear: () => Promise<void>
  put: (rows: unknown[]) => Promise<unknown>
}

const TABLES: BackupTableHandle[] = [
  {
    name: 'settings',
    read: () => db.settings.toArray(),
    clear: () => db.settings.clear(),
    put: (r) => db.settings.bulkPut(r as AppSettings[]),
  },
  {
    name: 'homePages',
    read: () => db.homePages.toArray(),
    clear: () => db.homePages.clear(),
    put: (r) => db.homePages.bulkPut(r as HomePage[]),
  },
  {
    name: 'layoutItems',
    read: () => db.layoutItems.toArray(),
    clear: () => db.layoutItems.clear(),
    put: (r) => db.layoutItems.bulkPut(r as LayoutItem[]),
  },
  {
    name: 'shortcuts',
    read: () => db.shortcuts.toArray(),
    clear: () => db.shortcuts.clear(),
    put: (r) => db.shortcuts.bulkPut(r as Shortcut[]),
  },
  {
    name: 'folders',
    read: () => db.folders.toArray(),
    clear: () => db.folders.clear(),
    put: (r) => db.folders.bulkPut(r as Folder[]),
  },
  {
    name: 'widgetInstances',
    read: () => db.widgetInstances.toArray(),
    clear: () => db.widgetInstances.clear(),
    put: (r) => db.widgetInstances.bulkPut(r as WidgetInstance[]),
  },
  {
    name: 'notes',
    read: () => db.notes.toArray(),
    clear: () => db.notes.clear(),
    put: (r) => db.notes.bulkPut(r as Note[]),
  },
  {
    name: 'tasks',
    read: () => db.tasks.toArray(),
    clear: () => db.tasks.clear(),
    put: (r) => db.tasks.bulkPut(r as TaskItem[]),
  },
  {
    name: 'history',
    read: () => db.history.toArray(),
    clear: () => db.history.clear(),
    put: (r) => db.history.bulkPut(r as HistoryEntry[]),
  },
  {
    name: 'dockItems',
    read: () => db.dockItems.toArray(),
    clear: () => db.dockItems.clear(),
    put: (r) => db.dockItems.bulkPut(r as DockItem[]),
  },
]

/** Dexie store references used to scope the import transaction. */
const ALL_STORES = [
  db.settings,
  db.homePages,
  db.layoutItems,
  db.shortcuts,
  db.folders,
  db.widgetInstances,
  db.notes,
  db.tasks,
  db.history,
  db.dockItems,
] as unknown as readonly Table[]

const KNOWN_TABLES = new Set<string>(TABLES.map((t) => t.name))

/**
 * Serialise the current normal app data as a versioned JSON backup.
 * Throws with a readable message if the read fails (IndexedDB unavailable,
 * quota, etc.) — the caller surfaces that.
 */
export async function exportBackupJson(): Promise<string> {
  const data: Record<string, unknown[]> = {}
  for (const t of TABLES) {
    data[t.name] = await t.read()
  }
  const envelope: BackupEnvelope = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    kind: BACKUP_KIND,
    exportedAt: Date.now(),
    data,
  }
  return JSON.stringify(envelope, null, 2)
}

function readableError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return String(err)
}

/**
 * Validate a backup JSON string and, on success, transactionally replace the
 * normal tables with the imported rows. Never touches existing data on any
 * validation failure. Absent tables are tolerated (skipped, not cleared).
 */
export async function importBackupJson(
  text: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'Not a valid JSON file.' }
  }

  const envelope = parsed as Record<string, unknown> | null
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    return { ok: false, reason: 'Not a Hearth backup file.' }
  }
  if (envelope.kind !== BACKUP_KIND) {
    return { ok: false, reason: 'Not a Hearth backup file.' }
  }
  if (envelope.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: `Unsupported backup version: ${String(envelope.schemaVersion)}.`,
    }
  }
  const data = envelope.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, reason: 'Backup contains no data.' }
  }

  const rowData = data as Record<string, unknown>
  for (const tableName of Object.keys(rowData)) {
    if (!KNOWN_TABLES.has(tableName)) {
      return { ok: false, reason: `Backup contains an unrecognised table: “${tableName}”.` }
    }
    if (!Array.isArray(rowData[tableName])) {
      return { ok: false, reason: `Backup table “${tableName}” is malformed.` }
    }
  }

  try {
    await db.transaction('rw', ALL_STORES, async () => {
      for (const t of TABLES) {
        const rows = rowData[t.name] as unknown[] | undefined
        if (rows === undefined) continue // table absent → tolerate by skipping
        await t.clear()
        if (rows.length > 0) await t.put(rows)
      }
    })
  } catch (err) {
    return { ok: false, reason: `Import failed: ${readableError(err)}` }
  }

  return { ok: true }
}
