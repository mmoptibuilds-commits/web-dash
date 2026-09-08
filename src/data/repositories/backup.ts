import { db } from '@/data/db/db'
import { isSafeUrl } from '@/lib/url'
import { planFreeformGeometry } from '@/data/layout/geometry'
import type { Table } from 'dexie'
import type {
  AppSettings,
  AppWindowState,
  CurrencyRates,
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
  {
    name: 'currencyRates',
    read: () => db.currencyRates.toArray(),
    clear: () => db.currencyRates.clear(),
    put: (r) => db.currencyRates.bulkPut(r as CurrencyRates[]),
  },
  {
    name: 'windowStates',
    read: () => db.windowStates.toArray(),
    clear: () => db.windowStates.clear(),
    put: (r) => db.windowStates.bulkPut(r as AppWindowState[]),
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
  db.currencyRates,
  db.windowStates,
] as unknown as readonly Table[]

const KNOWN_TABLES = new Set<string>(TABLES.map((t) => t.name))

/* ------------------------------------------------------------------ */
/* Row validation — restore must not trust row contents                */
/*                                                                    */
/* The write paths all validate before storing (URLs via isSafeUrl,   */
/* sizes/enums from the domain contract). A crafted backup bypasses   */
/* those write paths, so every row is re-checked here before any      */
/* table is cleared. A single bad row rejects the whole import, and   */
/* the enclosing transaction has not started, so existing data is     */
/* never touched on failure.                                          */
/* ------------------------------------------------------------------ */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isFin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr)
const isNumOrNull = (v: unknown): boolean => v === null || isFin(v)
/** True for an absolute http(s) URL — the only thing any stored `url` may be. */
const isSafeWebUrl = (v: unknown): v is string => isStr(v) && isSafeUrl(v)
const inValues =
  (values: Set<string>) =>
  (v: unknown): v is string =>
    isStr(v) && values.has(v)

const THEME_VALUES = new Set(['auto', 'light', 'dark'])
const GLASS_VALUES = new Set(['subtle', 'standard', 'vibrant'])
const SEARCH_ENGINE_VALUES = new Set(['google', 'bing', 'duckduckgo'])
const ICON_SIZE_VALUES = new Set(['small', 'regular', 'large'])
const LAYOUT_KIND_VALUES = new Set(['shortcut', 'folder', 'widget'])
const WIDGET_SIZE_VALUES = new Set(['small', 'medium', 'large'])
const WINDOW_SNAP_VALUES = new Set(['left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'maximize'])
const HISTORY_KIND_VALUES = new Set(['query', 'launch'])
const SHORTCUT_ICON_TYPE_VALUES = new Set(['auto', 'emoji', 'upload'])
/** Mirrors the frozen BuiltinAppId union in types/domain.ts. */
const BUILTIN_APP_ID_VALUES = new Set([
  'home',
  'dashboard',
  'notes',
  'tasks',
  'calendar',
  'bookmarks',
  'calculator',
  'settings',
])
const DATA_IMAGE_URL_RE = /^data:image\//

/** One validator per normal table. Returns a field description or null. */
const ROW_VALIDATORS: Record<string, (row: unknown) => string | null> = {
  settings: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (row.id !== 'main') return 'id must be "main"'
    if (!inValues(THEME_VALUES)(row.theme)) return 'theme is not auto/light/dark'
    if (!isBool(row.reducedEffects)) return 'reducedEffects is not a boolean'
    if (row.appearanceProfile !== undefined && !inValues(new Set(['auto', 'desktop', 'mobile']))(row.appearanceProfile))
      return 'appearanceProfile is not auto/desktop/mobile'
    if (row.glass !== undefined && !inValues(GLASS_VALUES)(row.glass))
      return 'glass is not subtle/standard/vibrant' // optional: older backups lack it
    if (row.liquidGlassMode !== undefined && !inValues(new Set(['off', 'performance', 'balanced', 'high', 'custom']))(row.liquidGlassMode))
      return 'liquidGlassMode is invalid'
    if (row.liquidGlassBlur !== undefined && !(isFin(row.liquidGlassBlur) && row.liquidGlassBlur >= 0 && row.liquidGlassBlur <= 10))
      return 'liquidGlassBlur is not a number in 0..10'
    if (row.liquidGlassRefraction !== undefined && !(isFin(row.liquidGlassRefraction) && row.liquidGlassRefraction >= 0 && row.liquidGlassRefraction <= 1))
      return 'liquidGlassRefraction is not a number in 0..1'
    if (row.liquidGlassChromatic !== undefined && !(isFin(row.liquidGlassChromatic) && row.liquidGlassChromatic >= 0 && row.liquidGlassChromatic <= 0.12))
      return 'liquidGlassChromatic is not a number in 0..0.12'
    // Optional: older backups lack glassTranslucency; when present it must be a
    // number in [0,1] (0 solid … 1 most see-through).
    if (
      row.glassTranslucency !== undefined &&
      !(isFin(row.glassTranslucency) && row.glassTranslucency >= 0 && row.glassTranslucency <= 1)
    )
      return 'glassTranslucency is not a number in 0..1'
    if (!inValues(SEARCH_ENGINE_VALUES)(row.defaultSearchEngine))
      return 'defaultSearchEngine is not google/bing/duckduckgo'
    if (!inValues(ICON_SIZE_VALUES)(row.iconSize)) return 'iconSize is not small/regular/large'
    if (row.wallpaperDimming !== undefined && !(isFin(row.wallpaperDimming) && row.wallpaperDimming >= 0 && row.wallpaperDimming <= 0.8))
      return 'wallpaperDimming is not a number in 0..0.8'
    if (row.iconFamily !== undefined && !inValues(new Set(['system', 'monochrome', 'tinted']))(row.iconFamily))
      return 'iconFamily is invalid'
    if (row.iconShape !== undefined && !inValues(new Set(['squircle', 'rounded', 'circle', 'plain']))(row.iconShape))
      return 'iconShape is invalid'
    if (row.iconTreatment !== undefined && !inValues(new Set(['flat', 'material', 'contrast']))(row.iconTreatment))
      return 'iconTreatment is invalid'
    if (row.dockStyle !== undefined && !inValues(new Set(['glass', 'shelf']))(row.dockStyle))
      return 'dockStyle is invalid'
    if (row.dockSize !== undefined && !inValues(ICON_SIZE_VALUES)(row.dockSize)) return 'dockSize is invalid'
    for (const key of ['dockMagnification', 'showDockIndicators', 'restoreWindowsOnReload', 'embedFullscreen', 'embedToolbar', 'reducedTransparency', 'highContrast'] as const)
      if (row[key] !== undefined && !isBool(row[key])) return `${key} is not a boolean`
    if (row.homeDensity !== undefined && !inValues(new Set(['comfortable', 'balanced', 'compact']))(row.homeDensity))
      return 'homeDensity is invalid'
    for (const key of ['canvasMaxWidth', 'gridSnap', 'defaultWindowWidth', 'defaultWindowHeight'] as const)
      if (row[key] !== undefined && !(isFin(row[key]) && row[key] > 0)) return `${key} is not a positive number`
    if (!isBool(row.showLabels)) return 'showLabels is not a boolean'
    const wp = row.wallpaper
    if (!isObj(wp)) return 'wallpaper is not an object'
    if (wp.kind !== 'builtin' && wp.kind !== 'user') return 'wallpaper.kind is not builtin/user'
    if (wp.kind === 'builtin' && !isStr(wp.id)) return 'wallpaper.id is not a string'
    if (wp.kind === 'user' && !isStr(wp.wallpaperId)) return 'wallpaper.wallpaperId is not a string'
    return null
  },
  homePages: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id) || !isStr(row.name)) return 'id/name must be strings'
    if (!isFin(row.index)) return 'index is not a number'
    return null
  },
  layoutItems: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id) || !isStr(row.pageId) || !isStr(row.refId))
      return 'id/pageId/refId must be strings'
    if (!inValues(LAYOUT_KIND_VALUES)(row.kind)) return 'kind is not shortcut/folder/widget'
    if (!isFin(row.order)) return 'order is not a number'
    return null
  },
  shortcuts: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id) || !isStr(row.label)) return 'id/label must be strings'
    // A javascript:/data: URL stored here would run same-origin when a tile is
    // clicked (recordAndOpen → location.assign). This is the security gate.
    if (!isSafeWebUrl(row.url)) return 'url is not a safe http(s) address'
    const icon = row.icon
    if (!isObj(icon)) return 'icon is not an object'
    if (!inValues(SHORTCUT_ICON_TYPE_VALUES)(icon.type)) return 'icon.type is not auto/emoji/upload'
    if (icon.type === 'emoji' && !isStr(icon.emoji)) return 'icon.emoji is not a string'
    // Uploaded tile icons are data:image data-URLs rendered in <img>. Anything
    // else (e.g. a remote URL) would let a crafted import phone home.
    if (icon.type === 'upload' && !(isStr(icon.dataUrl) && DATA_IMAGE_URL_RE.test(icon.dataUrl)))
      return 'icon.dataUrl is not a data:image URL'
    return null
  },
  folders: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id) || !isStr(row.name)) return 'id/name must be strings'
    if (!isStrArr(row.shortcutIds)) return 'shortcutIds must be an array of strings'
    if (!isObj(row.icon) || row.icon.type !== 'emoji' || !isStr(row.icon.emoji))
      return 'icon must be an emoji icon'
    return null
  },
  widgetInstances: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id) || !isStr(row.type) || row.type.length === 0)
      return 'id/type must be non-empty strings'
    if (!inValues(WIDGET_SIZE_VALUES)(row.size)) return 'size is not small/medium/large'
    if (!isObj(row.settings)) return 'settings is not an object'
    return null
  },
  notes: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id) || !isStr(row.title) || !isStr(row.body))
      return 'id/title/body must be strings'
    if (!isBool(row.pinned)) return 'pinned is not a boolean'
    return null
  },
  tasks: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id) || !isStr(row.text)) return 'id/text must be strings'
    if (!isBool(row.done)) return 'done is not a boolean'
    if (!isNumOrNull(row.doneAt)) return 'doneAt must be a number or null'
    return null
  },
  history: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id) || !isStr(row.text)) return 'id/text must be strings'
    if (!inValues(HISTORY_KIND_VALUES)(row.kind)) return 'kind is not query/launch'
    // Launches become clickable suggestions; a non-http(s) URL here would run
    // through recordAndOpen on click. Query rows carry url: null.
    if (row.url !== null && !isSafeWebUrl(row.url)) return 'url is not a safe http(s) address'
    if (!isFin(row.count)) return 'count is not a number'
    return null
  },
  dockItems: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!isStr(row.id)) return 'id must be a string'
    if (!isFin(row.order)) return 'order is not a number'
    // The dock renders BUILTIN_APPS[appId].icon for unpinned items — an
    // unknown appId would throw on every surface and brick the app.
    if (!inValues(BUILTIN_APP_ID_VALUES)(row.appId)) return 'appId is not a known app'
    if (row.shortcutId !== null && !isStr(row.shortcutId)) return 'shortcutId must be null or a string'
    return null
  },
  currencyRates: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (row.id !== 'default') return 'id must be "default"'
    // base is fixed at USD in V1 (the pairing is USD-anchored); a crafted
    // table with a different base would silently mis-price every conversion.
    if (row.base !== 'USD') return 'base must be "USD"'
    const rates = row.rates
    if (!isObj(rates)) return 'rates is not an object'
    for (const code of Object.keys(rates)) {
      if (!/^[A-Z]{3}$/.test(code)) return `rate key “${code}” is not a 3-letter code`
      if (!(isFin(rates[code]) && rates[code] > 0)) return `rate for “${code}” is not a positive number`
    }
    if (!isNumOrNull(row.editedAt)) return 'editedAt must be a number or null'
    if (!isFin(row.updatedAt)) return 'updatedAt is not a number'
    return null
  },
  windowStates: (row) => {
    if (!isObj(row)) return 'row is not an object'
    if (!inValues(BUILTIN_APP_ID_VALUES)(row.appId)) return 'appId is not a known app'
    for (const key of ['x', 'y', 'w', 'h', 'lastOpenedAt', 'updatedAt'] as const)
      if (!isFin(row[key])) return `${key} is not a number`
    if (isFin(row.w) && isFin(row.h) && (row.w < 300 || row.h < 220)) return 'window is below the minimum size'
    if (!isBool(row.maximized) || !isBool(row.minimized) || !isBool(row.open)) return 'window flags are invalid'
    if (row.snapMode !== undefined && row.snapMode !== null && !inValues(WINDOW_SNAP_VALUES)(row.snapMode))
      return 'window snap mode is invalid'
    if (row.restoreBounds !== undefined) {
      if (!isObj(row.restoreBounds)) return 'window restore bounds are invalid'
      for (const key of ['x', 'y', 'w', 'h'] as const)
        if (!isFin(row.restoreBounds[key])) return `window restore ${key} is not a number`
    }
    return null
  },
}

/** Returns a human message for the first invalid row, or null if all pass. */
function validateBackupRows(data: Record<string, unknown>): string | null {
  for (const tableName of Object.keys(data)) {
    const rows = data[tableName]
    if (!Array.isArray(rows)) continue // non-array already reported by the caller
    const check = ROW_VALIDATORS[tableName]
    if (!check) continue // unknown table already rejected by the caller
    for (let i = 0; i < rows.length; i++) {
      const problem = check(rows[i])
      if (problem) return `Backup table “${tableName}” row ${i + 1}: ${problem}.`
    }
  }
  return null
}

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

  // Row-level validation before any write. Rejecting here (transaction has not
  // started) keeps existing data intact even for a mixed good/bad backup.
  const rowProblem = validateBackupRows(rowData)
  if (rowProblem) return { ok: false, reason: rowProblem }

  try {
    await db.transaction('rw', ALL_STORES, async () => {
      for (const t of TABLES) {
        const rows = rowData[t.name] as unknown[] | undefined
        if (rows === undefined) continue // table absent → tolerate by skipping
        await t.clear()
        if (rows.length > 0) await t.put(rows)
      }

      // Backfill freeform geometry for any imported layout rows that lack it.
      // Pre-freeform (V1) backups carry only id/pageId/kind/refId/order; their
      // desktop canvas would otherwise stack every tile at (0,0) — the v1→v2
      // Dexie migration has already run by the time a file is restored, so the
      // backfill must happen here, reusing the same deterministic packer.
      const imported = (rowData.layoutItems ?? []) as Array<
        Pick<LayoutItem, 'id' | 'pageId' | 'order' | 'kind' | 'refId'> &
          Partial<Pick<LayoutItem, 'x' | 'y' | 'w' | 'h'>>
      >
      const needsGeometry = imported.filter(
        (r) =>
          !(
            typeof r.x === 'number' &&
            typeof r.y === 'number' &&
            typeof r.w === 'number' &&
            typeof r.h === 'number'
          ),
      )
      if (needsGeometry.length > 0) {
        const widgetIds = [
          ...new Set(needsGeometry.filter((r) => r.kind === 'widget').map((r) => r.refId)),
        ]
        const widgets = widgetIds.length > 0 ? await db.widgetInstances.bulkGet(widgetIds) : []
        const sizeById = new Map(
          widgets.filter((w): w is WidgetInstance => Boolean(w)).map((w) => [w.id, w.size]),
        )
        const plan = planFreeformGeometry(
          needsGeometry.map((r) => ({
            id: r.id,
            pageId: r.pageId,
            order: r.order,
            kind: r.kind,
            refId: r.refId,
          })),
          (refId) => sizeById.get(refId),
        )
        await Promise.all(
          [...plan].map(([id, p]) =>
            db.layoutItems.update(id, {
              x: p.box.x,
              y: p.box.y,
              w: p.box.w,
              h: p.box.h,
              z: p.z,
            }),
          ),
        )
      }
    })
  } catch (err) {
    return { ok: false, reason: `Import failed: ${readableError(err)}` }
  }

  return { ok: true }
}
