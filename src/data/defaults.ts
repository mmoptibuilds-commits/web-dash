import type { AppSettings, WallpaperRef } from '@/types/domain'
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
    glass: 'standard',
    glassTranslucency: 0.5,
    defaultSearchEngine: 'google',
    iconSize: 'regular',
    showLabels: true,
    wallpaper: DEFAULT_WALLPAPER,
    createdAt: now(),
    updatedAt: now(),
  }
}
