import Dexie, { type EntityTable } from 'dexie'
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
  Wallpaper,
  WidgetInstance,
} from '@/types/domain'

/**
 * Hearth Dexie database.
 *
 * Tables map 1:1 to domain entities in src/types/domain.ts. New schema
 * versions are added below; each bump must ship an idempotent `upgrade`.
 * Persistent data lives ONLY here (no second copy in Zustand/localStorage).
 */

/** Current schema version. Bump + add an upgrade block for any change. */
export const DB_VERSION = 1

class HearthDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  homePages!: EntityTable<HomePage, 'id'>
  layoutItems!: EntityTable<LayoutItem, 'id'>
  shortcuts!: EntityTable<Shortcut, 'id'>
  folders!: EntityTable<Folder, 'id'>
  widgetInstances!: EntityTable<WidgetInstance, 'id'>
  notes!: EntityTable<Note, 'id'>
  tasks!: EntityTable<TaskItem, 'id'>
  history!: EntityTable<HistoryEntry, 'id'>
  wallpapers!: EntityTable<Wallpaper, 'id'>
  dockItems!: EntityTable<DockItem, 'id'>

  constructor() {
    super('hearth')
    this.version(1).stores({
      settings: 'id',
      homePages: 'id,index',
      // refId supports the cascade deletes (folder/widget/shortcut removal).
      layoutItems: 'id,pageId,order,refId',
      shortcuts: 'id',
      folders: 'id',
      widgetInstances: 'id,type',
      notes: 'id,updatedAt',
      tasks: 'id,updatedAt,done',
      history: 'id,kind,lastUsedAt',
      wallpapers: 'id,kind',
      dockItems: 'id,order,appId,shortcutId',
    })

    // Fail loudly (surfaced by callers as a recoverable message) rather than
    // leaving the app half-initialized.
    this.on('populate', () => {
      /* First open is seeded by ensureBootData(), not here, so tests can
         start from an empty DB. */
    })
  }
}

export const db = new HearthDatabase()

export type HearthTableName =
  | 'settings'
  | 'homePages'
  | 'layoutItems'
  | 'shortcuts'
  | 'folders'
  | 'widgetInstances'
  | 'notes'
  | 'tasks'
  | 'history'
  | 'wallpapers'
  | 'dockItems'
