import type { AppSettings, HomePage, WallpaperRef } from '@/types/domain'
import { now } from '@/types/domain'

/** The single settings row id. */
export const SETTINGS_ID = 'main' as const

/** Home wallpaper used on a clean install. */
export const DEFAULT_WALLPAPER: WallpaperRef = { kind: 'builtin', id: 'ember' }

export function defaultSettings(): AppSettings {
  return {
    id: SETTINGS_ID,
    theme: 'auto',
    reducedEffects: false,
    defaultSearchEngine: 'google',
    iconSize: 'regular',
    showLabels: true,
    wallpaper: DEFAULT_WALLPAPER,
    dashboardPanels: [
      { key: 'notes', order: 0 },
      { key: 'tasks', order: 1 },
      { key: 'calendar', order: 2 },
      { key: 'bookmarks', order: 3 },
    ],
    createdAt: now(),
    updatedAt: now(),
  }
}

export function defaultHomePage(index: number, name = 'Home'): HomePage {
  const t = now()
  return { id: '', index, name, createdAt: t, updatedAt: t }
}
