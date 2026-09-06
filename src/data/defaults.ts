import type { AppSettings, CurrencyRates, WallpaperRef } from '@/types/domain'
import { now } from '@/types/domain'

/** The single settings row id. */
export const SETTINGS_ID = 'main' as const

/** Home wallpaper used on a clean install. */
export const DEFAULT_WALLPAPER: WallpaperRef = { kind: 'builtin', id: 'lagoon' }

/** The single currency-rates row id. */
export const CURRENCY_RATES_ID = 'default' as const

/**
 * Code-shipped baseline for the offline Calculator converter (units of each
 * code per 1 USD). These are indicative manual values, NOT live quotes —
 * Hearth never fetches rates. The user can edit them in the Calculator and
 * the override is persisted (editedAt marks it as manual). Public-repo safe.
 */
export const DEFAULT_CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157,
  CNY: 7.24,
  INR: 83.4,
  CAD: 1.37,
  AUD: 1.52,
  CHF: 0.9,
  KRW: 1380,
  BRL: 5.4,
  SGD: 1.35,
}

export function defaultCurrencyRates(): CurrencyRates {
  return {
    id: CURRENCY_RATES_ID,
    base: 'USD',
    rates: { ...DEFAULT_CURRENCY_RATES },
    editedAt: null,
    updatedAt: now(),
  }
}

export function defaultSettings(): AppSettings {
  return {
    id: SETTINGS_ID,
    theme: 'auto',
    appearanceProfile: 'auto',
    reducedEffects: false,
    glass: 'standard',
    glassTranslucency: 0.5,
    wallpaperDimming: 0.12,
    defaultSearchEngine: 'google',
    iconSize: 'regular',
    iconFamily: 'system',
    iconShape: 'squircle',
    iconTreatment: 'material',
    showLabels: true,
    dockStyle: 'glass',
    dockSize: 'regular',
    dockMagnification: true,
    showDockIndicators: true,
    homeDensity: 'balanced',
    canvasMaxWidth: 1120,
    gridSnap: 8,
    restoreWindowsOnReload: false,
    defaultWindowWidth: 720,
    defaultWindowHeight: 520,
    embedFullscreen: true,
    embedToolbar: true,
    reducedTransparency: false,
    highContrast: false,
    wallpaper: DEFAULT_WALLPAPER,
    createdAt: now(),
    updatedAt: now(),
  }
}
