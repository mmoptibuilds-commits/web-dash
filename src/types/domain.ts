/**
 * Core domain entities + settings.
 *
 * These shapes are the shared data contract of the app. They are persisted
 * through Dexie (see src/data/db) and must stay versioned + backward
 * compatible. Cloud-sync hooks should attach here in V2, not by forking data.
 */

/** Stable entity id — generated with `uid()` in src/lib/id.ts. */
export type EntityId = string

/* ------------------------------------------------------------------ */
/* App settings (singleton row, id = 'main')                          */
/* ------------------------------------------------------------------ */

export type ThemePreference = 'auto' | 'light' | 'dark'
export type SearchEngineId = 'google' | 'bing' | 'duckduckgo'
export type IconSizePreset = 'small' | 'regular' | 'large'

/**
 * Reference to whichever wallpaper is active for the current surface.
 * `builtin` points at a preset shipped in code (gradients); `user` points at
 * a media row in the `wallpapers` table (image / video / animated).
 */
export type WallpaperRef =
  | { kind: 'builtin'; id: BuiltinWallpaperId }
  | { kind: 'user'; wallpaperId: EntityId }

export interface DashboardPanelPref {
  /** Panel type id — mirrors a built-in dashboard panel key. */
  key: 'notes' | 'tasks' | 'calendar' | 'bookmarks'
  order: number
}

export interface AppSettings {
  id: 'main'
  /** Light / dark / auto. 'auto' follows the OS (default). */
  theme: ThemePreference
  /** Reduced Effects — disables blur, heavy translucency. */
  reducedEffects: boolean
  defaultSearchEngine: SearchEngineId
  iconSize: IconSizePreset
  /** Whether shortcut labels render on home pages. */
  showLabels: boolean
  wallpaper: WallpaperRef
  /** Ordered + enabled dashboard panels. */
  dashboardPanels: DashboardPanelPref[]
  createdAt: number
  updatedAt: number
}

/* ------------------------------------------------------------------ */
/* Home pages + layout                                                */
/* ------------------------------------------------------------------ */

export interface HomePage {
  id: EntityId
  /** Sort index within the horizontal page strip. */
  index: number
  name: string
  createdAt: number
  updatedAt: number
}

export type LayoutItemKind = 'shortcut' | 'folder' | 'widget'

/**
 * A single placement on a home page. Home layout is an *ordered* grid:
 * `order` decides flow (top-to-bottom, left-to-right, wrapping at the
 * column count); grid span is derived from the referenced payload
 * (shortcuts/folders are 1×1, widgets use their size preset). This keeps
 * placement trivial to persist, reorder and migrate while remaining a
 * strict snap-to-grid.
 */
export interface LayoutItem {
  id: EntityId
  pageId: EntityId
  kind: LayoutItemKind
  /** Points at a Shortcut / Folder / WidgetInstance row. */
  refId: EntityId
  order: number
}

/* ------------------------------------------------------------------ */
/* Shortcuts & folders                                                */
/* ------------------------------------------------------------------ */

export type ShortcutIcon =
  | { type: 'auto' } /* best-effort favicon, letter monogram fallback */
  | { type: 'emoji'; emoji: string }
  | { type: 'upload'; dataUrl: string } /* custom transparent image */

export interface Shortcut {
  id: EntityId
  label: string
  /** Normalized absolute http(s) URL. `localhost` / private hosts allowed. */
  url: string
  icon: ShortcutIcon
  /** Optional tile background color (any CSS color). */
  bg: string | null
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: EntityId
  name: string
  /** Ordered member shortcut ids (shortcuts are shared entities). */
  shortcutIds: EntityId[]
  icon: { type: 'emoji'; emoji: string }
  /** Optional tint color for the tile. */
  bg: string | null
  createdAt: number
  updatedAt: number
}

/* ------------------------------------------------------------------ */
/* Widgets                                                            */
/* ------------------------------------------------------------------ */

export type WidgetSizeId = 'small' | 'medium' | 'large'

/** Any user-configurable payload a widget type needs (JSON-safe). */
export type WidgetSettings = Record<string, unknown>

export interface WidgetInstance {
  id: EntityId
  /** Registry key — see the widget registry in src/features/widgets. */
  type: string
  size: WidgetSizeId
  settings: WidgetSettings
  createdAt: number
  updatedAt: number
}

/* ------------------------------------------------------------------ */
/* Dock                                                               */
/* ------------------------------------------------------------------ */

export type BuiltinAppId =
  | 'home'
  | 'dashboard'
  | 'notes'
  | 'tasks'
  | 'calendar'
  | 'bookmarks'
  | 'settings'

export interface DockItem {
  id: EntityId
  order: number
  /** A built-in app (mode nav + mini-apps). */
  appId: BuiltinAppId
  /** A user shortcut (external link) pinned to the dock. */
  shortcutId: EntityId | null
}

/* ------------------------------------------------------------------ */
/* Notes                                                              */
/* ------------------------------------------------------------------ */

export interface Note {
  id: EntityId
  title: string
  body: string
  pinned: boolean
  createdAt: number
  updatedAt: number
}

/* ------------------------------------------------------------------ */
/* Tasks                                                              */
/* ------------------------------------------------------------------ */

export interface TaskItem {
  id: EntityId
  text: string
  done: boolean
  createdAt: number
  doneAt: number | null
  /** Kept for sort stability of user-ordered lists if we add them. */
  updatedAt: number
}

/* ------------------------------------------------------------------ */
/* History (local suggestions only — never read browser history)      */
/* ------------------------------------------------------------------ */

export type HistoryKind = 'query' | 'launch'

export interface HistoryEntry {
  /** Stable content key, e.g. `query:hearth` — upsert target. */
  id: string
  kind: HistoryKind
  /** Display text (query text, or launched shortcut label). */
  text: string
  /** For launches — the normalized URL that was opened. */
  url: string | null
  count: number
  lastUsedAt: number
}

/* ------------------------------------------------------------------ */
/* Wallpapers                                                         */
/* ------------------------------------------------------------------ */

export type WallpaperMediaKind = 'image' | 'video' | 'animated'

export interface Wallpaper {
  id: EntityId
  name: string
  kind: WallpaperMediaKind
  mime: string
  blob: Blob
  /** Bytes of the stored blob. */
  size: number
  addedAt: number
}

/** Built-in (code-shipped) gradient wallpaper presets. */
export const builtinWallpaperIds = [
  'ember',
  'dusk',
  'lagoon',
  'meadow',
  'mono-dark',
  'mono-light',
  'sakura',
  'slate',
] as const

export type BuiltinWallpaperId = (typeof builtinWallpaperIds)[number]

/* ------------------------------------------------------------------ */
/* Shared timestamps helpers                                          */
/* ------------------------------------------------------------------ */

export function now(): number {
  return Date.now()
}
