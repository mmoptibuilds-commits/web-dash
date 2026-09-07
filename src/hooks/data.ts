import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/data/db/db'
import { getSettings } from '@/data/repositories/settings'
import { listPages } from '@/data/repositories/pages'
import { listNotes, searchNotes } from '@/data/repositories/notes'
import { listTasks } from '@/data/repositories/tasks'
import { listShortcuts } from '@/data/repositories/shortcuts'
import { listFolders } from '@/data/repositories/folders'
import { listDock } from '@/data/repositories/dock'
import { listWallpapers } from '@/data/repositories/wallpapers'
import { listItemsForPage } from '@/data/repositories/layout'
import { getCurrencyRates } from '@/data/repositories/currencyRates'
import { listWindowStates } from '@/data/repositories/windowStates'
import type { AppSettings, AppWindowState, CurrencyRates, HomePage, Note, TaskItem } from '@/types/domain'

/** Reactive settings (read after ensureBootData has run). */
export function useSettings(): AppSettings | undefined {
  return useLiveQuery(() => getSettings(), [])
}

/** All home pages ordered by index. */
export function useHomePages(): HomePage[] | undefined {
  return useLiveQuery(() => listPages(), [])
}

/** Reactive notes sorted pinned-first, updated-desc. */
export function useNotes(): Note[] | undefined {
  return useLiveQuery(() => listNotes(), [])
}

/** Reactive notes filtered by a search term. */
export function useNotesSearch(query: string): Note[] | undefined {
  return useLiveQuery(() => searchNotes(query), [query])
}

export function useTasks(): TaskItem[] | undefined {
  return useLiveQuery(() => listTasks(), [])
}

export function useShortcuts() {
  return useLiveQuery(() => listShortcuts(), [])
}

export function useFolders() {
  return useLiveQuery(() => listFolders(), [])
}

export function useDock() {
  return useLiveQuery(() => listDock(), [])
}

export function useWallpapers() {
  return useLiveQuery(() => listWallpapers(), [])
}

/** Ordered layout items for one home page. */
export function usePageItems(pageId: string) {
  return useLiveQuery(() => listItemsForPage(pageId), [pageId])
}

/** Reactive Calculator currency rates (single offline row, self-seeding). */
export function useCurrencyRates(): CurrencyRates | undefined {
  return useLiveQuery(() => getCurrencyRates(), [])
}

/** Reactive window records used by the shell's durable-state adapter. */
export function useWindowStates(): AppWindowState[] | undefined {
  return useLiveQuery(() => listWindowStates(), [])
}

/** Raw lookup of arbitrary rows (used by item renderers). */
export function useWidgetInstancesOf(ids: string[]) {
  return useLiveQuery(() => db.widgetInstances.bulkGet(ids), [ids.join(',')])
}
