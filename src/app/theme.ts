import type { AppSettings, GlassPreset, ThemePreference } from '@/types/domain'

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
 * Apply the resolved theme + reduced-effects + glass-preset attrs to <html>,
 * and drive the glass fill alphas from the continuous Transparency setting.
 * `data-glass` reflects what is *rendered*: 'off' while Reduced Effects is on
 * (that mode replaces glass with a solid surface), otherwise the chosen
 * preset. tokens.css keys the material tokens off the data attributes; fill
 * translucency is written inline because it is continuous (see applyGlassAlpha).
 */
export function applyThemeAttributes(
  theme: ResolvedTheme,
  reducedEffects: boolean,
  glass: GlassPreset = 'standard',
  translucency = 0.5,
  visual?: Partial<Pick<AppSettings, 'appearanceProfile' | 'iconFamily' | 'iconShape' | 'iconTreatment' | 'reducedTransparency' | 'highContrast' | 'wallpaperDimming' | 'homeDensity' | 'canvasMaxWidth'>>,
): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.dataset.effects = reducedEffects ? 'reduced' : 'full'
  root.dataset.glass = glassAttr(reducedEffects, glass)
  root.dataset.appearanceProfile = visual?.appearanceProfile ?? root.dataset.appearanceProfile ?? 'auto'
  root.dataset.iconFamily = visual?.iconFamily ?? root.dataset.iconFamily ?? 'system'
  root.dataset.iconShape = visual?.iconShape ?? root.dataset.iconShape ?? 'squircle'
  root.dataset.iconTreatment = visual?.iconTreatment ?? root.dataset.iconTreatment ?? 'material'
  root.dataset.transparency = visual?.reducedTransparency ? 'reduced' : 'full'
  root.dataset.contrast = visual?.highContrast ? 'high' : 'normal'
  root.dataset.homeDensity = visual?.homeDensity ?? root.dataset.homeDensity ?? 'balanced'
  root.style.setProperty('--home-canvas-max', `${visual?.canvasMaxWidth ?? 1120}px`)
  root.style.setProperty('--wallpaper-dimming', String(visual?.wallpaperDimming ?? 0.12))
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  meta?.setAttribute('content', theme === 'dark' ? '#15181d' : '#f2f3f5')
  applyGlassAlpha(root, reducedEffects || Boolean(visual?.reducedTransparency), translucency)
}

/** Fill alphas the Transparency setting may override. */
const GLASS_ALPHA_TOKENS = ['--glass-a-1', '--glass-a-2', '--glass-a-3', '--glass-a-elev'] as const

/**
 * Write `--glass-a-*` inline from the Transparency slider.
 *
 * The per-theme defaults already live in tokens.css, so we read each token's
 * computed base after the data attributes are set (never duplicate the numbers)
 * and scale it about the baseline: slider 0 (solid) → 0.95, 0.5 (tuned
 * default) → theme baseline, 1 (most see-through) → 0.18.
 * invisible or fully opaque. At the baseline we write nothing — CSS owns the
 * exact tuned value. Reduced Effects never gets inline alphas; its
 * `[data-effects='reduced']` block forces the solid fills instead.
 */
function applyGlassAlpha(root: HTMLElement, reducedEffects: boolean, translucency: number): void {
  for (const prop of GLASS_ALPHA_TOKENS) root.style.removeProperty(prop)
  if (reducedEffects) return
  if (Math.abs(translucency - 0.5) < 0.001) return
  const computed = getComputedStyle(root)
  const value = Math.min(1, Math.max(0, translucency))
  const solidAlpha = 0.95
  const clearAlpha = 0.18
  for (const prop of GLASS_ALPHA_TOKENS) {
    const base = Number.parseFloat(computed.getPropertyValue(prop))
    if (!Number.isFinite(base)) continue
    // Keep each token's theme-specific baseline involved in the calculation so
    // the slider changes the shared material without duplicating theme colors.
    // The endpoints are intentionally far enough apart to read over wallpaper.
    const target = value < 0.5 ? solidAlpha : clearAlpha
    const distanceFromBaseline = Math.abs(value - 0.5) / 0.5
    const alpha = base + (target - base) * distanceFromBaseline
    root.style.setProperty(prop, String(Number(alpha.toFixed(3))))
  }
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
