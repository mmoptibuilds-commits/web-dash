import type { ThemePreference } from '@/types/domain'

export type ResolvedTheme = 'light' | 'dark'

/** Resolve a theme preference against the OS. */
export function resolveTheme(pref: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (pref === 'light') return 'light'
  if (pref === 'dark') return 'dark'
  return prefersDark ? 'dark' : 'light'
}

/** Apply the resolved theme + reduced-effects attrs to <html>. */
export function applyThemeAttributes(theme: ResolvedTheme, reducedEffects: boolean): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.dataset.effects = reducedEffects ? 'reduced' : 'full'
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
