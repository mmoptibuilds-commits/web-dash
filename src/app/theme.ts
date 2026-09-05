import type { GlassPreset, ThemePreference } from '@/types/domain'

export type ResolvedTheme = 'light' | 'dark'

/** Resolve a theme preference against the OS. */
export function resolveTheme(pref: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (pref === 'light') return 'light'
  if (pref === 'dark') return 'dark'
  return prefersDark ? 'dark' : 'light'
}

/** Attribute name maps a reduced-effects flag to a `data-glass` state. */
function glassAttr(reducedEffects: boolean, glass: GlassPreset): string {
  return reducedEffects ? 'off' : glass
}

/**
 * Apply the resolved theme + reduced-effects + glass-preset attrs to <html>.
 * `data-glass` reflects what is *rendered*: 'off' while Reduced Effects is on
 * (that mode replaces glass with a solid surface), otherwise the chosen
 * preset. tokens.css keys the material tokens off these two attributes.
 */
export function applyThemeAttributes(
  theme: ResolvedTheme,
  reducedEffects: boolean,
  glass: GlassPreset = 'standard',
): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.dataset.effects = reducedEffects ? 'reduced' : 'full'
  root.dataset.glass = glassAttr(reducedEffects, glass)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  meta?.setAttribute('content', theme === 'dark' ? '#15181d' : '#f2f3f5')
}

/** Toggle native fullscreen when the browser permits it. */
export async function toggleFullscreen(): Promise<boolean> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return false
    }
    await document.documentElement.requestFullscreen()
    return true
  } catch {
    return document.fullscreenElement != null
  }
}

export function fullscreenSupported(): boolean {
  return typeof document !== 'undefined' && 'requestFullscreen' in document.documentElement
}
