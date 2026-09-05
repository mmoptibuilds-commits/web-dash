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
 * Translucency / blur strength of the glass material. Presets restyle the
 * shared material tokens uniformly (see tokens.css `[data-glass]` blocks).
 * `reducedEffects` overrides any preset with a solid surface.
 */
export type GlassPreset = 'subtle' | 'standard' | 'vibrant'

/**
 * Reference to whichever wallpaper is active for the current surface.
 * `builtin` points at a preset shipped in code (gradients); `user` points at
 * a media row in the `wallpapers` table (image / video / animated).
 */
export type WallpaperRef =
  | { kind: 'builtin'; id: BuiltinWallpaperId }
  | { kind: 'user'; wallpaperId: EntityId }

export interface AppSettings {
  id: 'main'
  /** Light / dark / auto. 'auto' follows the OS (default). */
  theme: ThemePreference
  /** Reduced Effects — disables blur, heavy translucency. */
  reducedEffects: boolean
  /** Glass material preset (see GlassPreset). 'standard' is the tuned default. */
  glass: GlassPreset
  /**
   * Continuous translucency of glass fills, orthogonal to the preset (which owns
   * blur + saturation). 0 = most solid (near-opaque), 1 = most see-through;
   * 0.5 is the tuned baseline where no inline override is written. Reduced
   * Effects overrides it with a solid surface.
   */
  glassTranslucency: number
  defaultSearchEngine: SearchEngineId
  iconSize: IconSizePreset
  /** Whether shortcut labels render on home pages. */
  showLabels: boolean
  wallpaper: WallpaperRef
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
 * A single placement on a home page.
 *
 * Home supports two coordinated layout models, selected by viewport width and
 * stored independently on the SAME row so neither corrupts the other:
 *
 * - Desktop (>= 1024px) is a genuine freeform canvas: each item carries an
 *   explicit `x`/`y`/`w`/`h`/`z` box (CSS px, canvas capped at 1120 wide),
 *   is absolutely positioned, never auto-reflows around neighbours, and may
 *   overlap (z = bring-to-front). See src/data/layout/geometry.ts.
 *
 * - Compact widths (< 1024px) keep the ordered grid: `order` flows row-major
 *   and grid span derives from the payload (shortcuts/folders are 1×1,
 *   widgets use their size preset). Freeform edits never rewrite `order`, so a
 *   desktop arrangement cannot corrupt the phone's grid and vice-versa.
 *
 * All geometry fields are optional so rows written by earlier versions remain
 * valid; the DB upgrade and every write path fill them in.
 */
export interface LayoutItem {
  id: EntityId
  pageId: EntityId
  kind: LayoutItemKind
  /** Points at a Shortcut / Folder / WidgetInstance row. */
  refId: EntityId
  /** Ordered-grid flow order (compact widths). Also the phone auto-flow. */
  order: number
  /** Freeform canvas box — top/left in px within the page canvas. */
  x?: number
  y?: number
  /** Freeform canvas box — width/height in px. */
  w?: number
  h?: number
  /** Stack order on the freeform canvas (bring-to-front). */
  z?: number
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
  | 'calculator'
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
/* Calculator                                                         */
/* ------------------------------------------------------------------ */

/**
 * Offline currency rates backing the Calculator's converter. Single row
 * (`id: 'default'`), user-editable, local-first: no live feed — Hearth never
 * talks to a rate API. Rates are anchored to `base` (fixed USD in V1): each
 * value is how many units of that code one unit of `base` buys, so any pair
 * converts as `amount × rate(to) / rate(from)`. `editedAt` is null until the
 * user overrides a baseline rate, marking the table as "manual".
 */
export interface CurrencyRates {
  id: 'default'
  /** Reference currency the stored rates are anchored to (fixed 'USD' in V1). */
  base: string
  /** Units of each code per 1 unit of `base`. Codes are uppercase ISO 4217. */
  rates: Record<string, number>
  /** Epoch ms of the last manual edit; null while rates are the code baseline. */
  editedAt: number | null
  updatedAt: number
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
