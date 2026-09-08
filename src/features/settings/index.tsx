import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleHelp, Database, Dock, Home, Image, Monitor, Moon, Palette, Search, Settings2, Sun } from 'lucide-react'
import styles from './settings.module.css'
import { settingsRepo } from '@/data/repositories'
import { useSettings } from '@/hooks/data'
import type {
  AppSettings,
  AppearanceProfile,
  DockStyle,
  GlassPreset,
  HomeDensity,
  IconFamily,
  IconShape,
  IconTreatment,
  IconSizePreset,
  LiquidGlassMode,
  SearchEngineId,
  ThemePreference,
} from '@/types/domain'
import { BackupControls } from './backupControls'
import { ChoiceSetting, Section, Segmented, ToggleSetting } from './controls'
import { WallpaperSection } from './wallpaper'
import type { PersistFn, SettingsPatch } from './model'
import { applyThemeAttributes, resolveTheme } from '@/app/theme'
import { usePrefersDark } from '@/hooks/useMedia'

type Mode = 'simple' | 'advanced'

const SIMPLE_NAV = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'wallpaper', label: 'Wallpaper', icon: Image },
] as const

const ADVANCED_NAV = [
  { id: 'icons', label: 'Icons', icon: Palette },
  { id: 'dock', label: 'Dock', icon: Dock },
  { id: 'home-layout', label: 'Home layout', icon: Home },
  { id: 'windows-and-embeds', label: 'Windows & embeds', icon: Settings2 },
  { id: 'motion-and-contrast', label: 'Motion & contrast', icon: Monitor },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'about', label: 'About', icon: CircleHelp },
] as const

/**
 * App identity for the About pane. package.json is not JSON-importable under
 * the repo's tsconfig (no resolveJsonModule) and the coordinator owns that
 * file, so this mirrors package.json manually. Keep it in sync on bump.
 */
const APP_NAME = 'mmoptibuilds'
const APP_VERSION = '1.2.0'

const MODE_OPTIONS: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'simple', label: 'Simple' },
  { value: 'advanced', label: 'Advanced' },
]

function themeOptions(): ReadonlyArray<{
  value: ThemePreference
  label: string
  icon: ReactNode
}> {
  return [
    { value: 'auto', label: 'Auto', icon: <Monitor size={15} /> },
    { value: 'light', label: 'Light', icon: <Sun size={15} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={15} /> },
  ]
}

const ENGINE_OPTIONS: ReadonlyArray<{ value: SearchEngineId; label: string }> = [
  { value: 'google', label: 'Google' },
  { value: 'bing', label: 'Bing' },
  { value: 'duckduckgo', label: 'DuckDuckGo' },
]

const SIZE_OPTIONS: ReadonlyArray<{ value: IconSizePreset; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'regular', label: 'Regular' },
  { value: 'large', label: 'Large' },
]

const GLASS_OPTIONS: ReadonlyArray<{ value: GlassPreset; label: string }> = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'standard', label: 'Standard' },
  { value: 'vibrant', label: 'Vibrant' },
]
const LIQUID_GLASS_OPTIONS: ReadonlyArray<{ value: LiquidGlassMode; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'performance', label: 'Performance' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'high', label: 'High' },
  { value: 'custom', label: 'Custom' },
]

const GLASS_DESCRIPTION: Record<GlassPreset, string> = {
  subtle: 'Calm translucency with a light blur.',
  standard: 'The balanced, tuned default.',
  vibrant: 'Rich color and a deep, smooth blur.',
}

const PROFILE_OPTIONS: ReadonlyArray<{ value: AppearanceProfile; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
]
const ICON_FAMILY_OPTIONS: ReadonlyArray<{ value: IconFamily; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'monochrome', label: 'Mono' },
  { value: 'tinted', label: 'Tinted' },
]
const ICON_SHAPE_OPTIONS: ReadonlyArray<{ value: IconShape; label: string }> = [
  { value: 'squircle', label: 'Squircle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'plain', label: 'Plain' },
]
const ICON_TREATMENT_OPTIONS: ReadonlyArray<{ value: IconTreatment; label: string }> = [
  { value: 'material', label: 'Material' },
  { value: 'flat', label: 'Flat' },
  { value: 'contrast', label: 'Contrast' },
]
const DOCK_STYLE_OPTIONS: ReadonlyArray<{ value: DockStyle; label: string }> = [
  { value: 'glass', label: 'Glass' },
  { value: 'shelf', label: 'Shelf' },
]
const DENSITY_OPTIONS: ReadonlyArray<{ value: HomeDensity; label: string }> = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'compact', label: 'Compact' },
]

/**
 * Glass preset picker with a live sample. The sample is a real translucent
 * panel built from the shared material tokens, so picking a preset restyles it
 * in place — and because every chrome surface reads the same tokens, the whole
 * shell behind the settings window re-glasses live too. The Transparency slider
 * below composes with the preset: the preset owns blur + saturation while the
 * slider scales the shared --glass-a-* fill alphas (theme.ts), so both act on
 * the same live sample.
 */
function GlassSetting({
  value,
  translucency,
  onChange,
  onTranslucency,
}: {
  value: GlassPreset
  translucency: number
  onChange: (glass: GlassPreset) => void
  onTranslucency: (translucency: number) => void
}) {
  return (
    <div className={styles.settingBlock}>
      <div className={styles.settingText}>
        <span className={styles.settingTitle}>Glass</span>
        <span className={styles.settingDesc}>
          Translucency and blur behind windows and panels. {GLASS_DESCRIPTION[value]} Reduced
          Effects turns glass fully off.
        </span>
      </div>

      <div className={styles.glassPreview} aria-hidden="true">
        <span className={`${styles.previewBlob} ${styles.previewBlobA}`} />
        <span className={`${styles.previewBlob} ${styles.previewBlobB}`} />
        <span className={styles.glassSample}>
          <span className={styles.glassSampleBars}>
            <i />
            <i />
            <i />
          </span>
        </span>
      </div>

      <div className={styles.chipRow} role="radiogroup" aria-label="Glass">
        {GLASS_OPTIONS.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              onClick={() => onChange(option.value)}
            >
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.transRow}>
        <div className={styles.settingText}>
          <span className={styles.settingTitle} id="glass-transparency-title">
            Transparency
          </span>
          <span className={styles.settingDesc}>
            How much the wallpaper shows through. 0% is nearly solid; 100% is the most
            see-through. The preset above controls blur and colour; this controls fill opacity.
          </span>
        </div>
        <div className={styles.transControl}>
          <span className={styles.transEndpoint}>More solid</span>
          <input
            type="range"
            className={styles.range}
            min={0}
            max={1}
            step={0.01}
            value={translucency}
            aria-labelledby="glass-transparency-title"
            aria-valuetext={`${Math.round(translucency * 100)} percent transparent`}
            onChange={(e) => onTranslucency(Number(e.currentTarget.value))}
          />
          <span className={styles.transEndpoint}>More see-through</span>
          <span className={styles.transValue} aria-hidden>
            {Math.round(translucency * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function SimpleSettings({ settings, persist }: { settings: AppSettings; persist: PersistFn }) {
  return (
    <>
      <Section title="Appearance">
        <ChoiceSetting title="Appearance profile" description="Adjusts shell proportions for the current device." value={settings.appearanceProfile ?? 'auto'} options={PROFILE_OPTIONS} onChange={(appearanceProfile) => persist({ appearanceProfile })} />
        <ChoiceSetting
          title="Theme"
          description="Auto follows your system appearance."
          value={settings.theme}
          options={themeOptions()}
          onChange={(theme) => persist({ theme })}
        />
        <GlassSetting
          value={settings.glass ?? 'standard'}
          translucency={settings.glassTranslucency}
          onChange={(glass) => persist({ glass })}
          onTranslucency={(glassTranslucency) => persist({ glassTranslucency })}
        />
        <div className={styles.settingBlock}>
          <div className={styles.settingText}>
            <span className={styles.settingTitle}>Wallpaper dimming</span>
            <span className={styles.settingDesc}>Adds a gentle system scrim so icons and windows stay legible.</span>
          </div>
          <input className={styles.range} type="range" min={0} max={0.5} step={0.01} value={settings.wallpaperDimming ?? 0.12} aria-label="Wallpaper dimming" onChange={(event) => persist({ wallpaperDimming: Number(event.currentTarget.value) })} />
        </div>
        <ToggleSetting
          title="Reduced effects"
          description="Disables blur and heavy translucency."
          checked={settings.reducedEffects}
          onChange={(reducedEffects) => persist({ reducedEffects })}
        />
      </Section>

      <Section title="Search">
        <ChoiceSetting
          title="Default search engine"
          description="Used by the search bar on Home."
          value={settings.defaultSearchEngine}
          options={ENGINE_OPTIONS}
          onChange={(defaultSearchEngine) => persist({ defaultSearchEngine })}
        />
      </Section>

      <Section title="Home">
        <ChoiceSetting
          title="Icon size"
          value={settings.iconSize}
          options={SIZE_OPTIONS}
          onChange={(iconSize) => persist({ iconSize })}
        />
        <ToggleSetting
          title="Show labels"
          description="Show shortcut names under tiles."
          checked={settings.showLabels}
          onChange={(showLabels) => persist({ showLabels })}
        />
      </Section>

      <Section title="Wallpaper">
        <WallpaperSection
          wallpaper={settings.wallpaper}
          onChange={(wallpaper) => persist({ wallpaper })}
        />
      </Section>
    </>
  )
}

function NumberSetting({
  title,
  description,
  value,
  min,
  max,
  onChange,
}: {
  title: string
  description?: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className={styles.settingBlock}>
      <div className={styles.settingText}>
        <span className={styles.settingTitle}>{title}</span>
        {description ? <span className={styles.settingDesc}>{description}</span> : null}
      </div>
      <input className={styles.numberInput} type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.currentTarget.value))} aria-label={title} />
    </div>
  )
}

function AboutBlock() {
  return (
    <>
      <div className={styles.infoRow}>
        <span className={styles.infoKey}>App</span>
        <span className={styles.infoValue}>{APP_NAME}</span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoKey}>Version</span>
        <span className={styles.infoValue}>{APP_VERSION}</span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoKey}>Data</span>
        <span className={styles.infoValue}>Stored locally in your browser</span>
      </div>
    </>
  )
}

function AdvancedSettings({ settings, persist }: { settings: AppSettings; persist: PersistFn }) {
  return (
    <>
      <Section title="Icons">
        <ChoiceSetting title="Icon family" value={settings.iconFamily ?? 'system'} options={ICON_FAMILY_OPTIONS} onChange={(iconFamily) => persist({ iconFamily })} />
        <ChoiceSetting title="Icon shape" value={settings.iconShape ?? 'squircle'} options={ICON_SHAPE_OPTIONS} onChange={(iconShape) => persist({ iconShape })} />
        <ChoiceSetting title="Icon treatment" value={settings.iconTreatment ?? 'material'} options={ICON_TREATMENT_OPTIONS} onChange={(iconTreatment) => persist({ iconTreatment })} />
      </Section>
      <Section title="Dock">
        <ChoiceSetting title="Dock style" value={settings.dockStyle ?? 'glass'} options={DOCK_STYLE_OPTIONS} onChange={(dockStyle) => persist({ dockStyle })} />
        <ChoiceSetting title="Dock size" value={settings.dockSize ?? 'regular'} options={SIZE_OPTIONS} onChange={(dockSize) => persist({ dockSize })} />
        <ToggleSetting title="Pointer magnification" description="Lift icons slightly when using a mouse or trackpad." checked={settings.dockMagnification !== false} onChange={(dockMagnification) => persist({ dockMagnification })} />
        <ToggleSetting title="Running indicators" checked={settings.showDockIndicators !== false} onChange={(showDockIndicators) => persist({ showDockIndicators })} />
      </Section>
      <Section title="Home layout">
        <ChoiceSetting title="Density" value={settings.homeDensity ?? 'balanced'} options={DENSITY_OPTIONS} onChange={(homeDensity) => persist({ homeDensity })} />
        <NumberSetting title="Canvas width" description="Maximum desktop canvas width in pixels." value={settings.canvasMaxWidth} min={720} max={1600} onChange={(canvasMaxWidth) => persist({ canvasMaxWidth })} />
        <NumberSetting title="Grid snap" description="Movement increment in pixels." value={settings.gridSnap} min={1} max={32} onChange={(gridSnap) => persist({ gridSnap })} />
      </Section>
      <Section title="Windows and embeds">
        <ToggleSetting title="Restore windows on reload" description="Reopen windows that were open when mmoptibuilds was last closed." checked={settings.restoreWindowsOnReload} onChange={(restoreWindowsOnReload) => persist({ restoreWindowsOnReload })} />
        <ToggleSetting title="Embed toolbar" checked={settings.embedToolbar !== false} onChange={(embedToolbar) => persist({ embedToolbar })} />
        <ToggleSetting title="Allow embed fullscreen" checked={settings.embedFullscreen !== false} onChange={(embedFullscreen) => persist({ embedFullscreen })} />
      </Section>
      <Section title="Motion and contrast">
        <ChoiceSetting title="Liquid Glass renderer" description="Applies real-time refraction only to the menu bar and Dock, with automatic CSS and solid fallbacks." value={settings.liquidGlassMode ?? 'balanced'} options={LIQUID_GLASS_OPTIONS} onChange={(liquidGlassMode) => persist({ liquidGlassMode })} />
        {settings.liquidGlassMode === 'custom' ? (
          <div className={styles.settingBlock}>
            <label className={styles.settingText}>Refraction <input className={styles.range} type="range" min={0} max={0.08} step={0.001} value={settings.liquidGlassRefraction} onChange={(event) => persist({ liquidGlassRefraction: Number(event.currentTarget.value) })} /></label>
            <label className={styles.settingText}>Blur <input className={styles.range} type="range" min={0} max={10} step={0.25} value={settings.liquidGlassBlur} onChange={(event) => persist({ liquidGlassBlur: Number(event.currentTarget.value) })} /></label>
            <label className={styles.settingText}>Chromatic edge <input className={styles.range} type="range" min={0} max={0.012} step={0.001} value={settings.liquidGlassChromatic} onChange={(event) => persist({ liquidGlassChromatic: Number(event.currentTarget.value) })} /></label>
          </div>
        ) : null}
        <ToggleSetting title="Reduced transparency" description="Use clearer, more solid system surfaces." checked={settings.reducedTransparency} onChange={(reducedTransparency) => persist({ reducedTransparency })} />
        <ToggleSetting title="Higher contrast" checked={settings.highContrast} onChange={(highContrast) => persist({ highContrast })} />
      </Section>
      <Section title="Data">
        <BackupControls />
      </Section>
      <Section title="About">
        <AboutBlock />
      </Section>
    </>
  )
}

export function SettingsMiniApp() {
  const settings = useSettings()
  const [mode, setMode] = useState<Mode>('simple')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [navQuery, setNavQuery] = useState('')
  const [activeSection, setActiveSection] = useState('appearance')
  const scrollRef = useRef<HTMLDivElement>(null)
  const prefersDark = usePrefersDark()

  const navItems = mode === 'simple' ? SIMPLE_NAV : ADVANCED_NAV
  const visibleNavItems = useMemo(() => {
    const query = navQuery.trim().toLowerCase()
    return query ? navItems.filter((item) => item.label.toLowerCase().includes(query)) : navItems
  }, [navItems, navQuery])

  if (!settings) {
    return <div className={styles.root} aria-busy="true" />
  }

  const persist: PersistFn = (patch: SettingsPatch) => {
    void settingsRepo
      .updateSettings(patch)
      .then(() => setSaveError(null))
      .catch(() => setSaveError('Could not save that change.'))
  }

  const changeTranslucency = (value: number) => {
    // Apply the shared material immediately. The repository write remains the
    // source of truth, while this keeps a fast slider drag from waiting for a
    // Dexie live-query round trip before the shell responds.
    applyThemeAttributes(
      resolveTheme(settings.theme, prefersDark),
      settings.reducedEffects,
      settings.glass ?? 'standard',
      value,
    )
    persist({ glassTranslucency: value })
  }

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar} data-testid="settings-sidebar" aria-label="Settings sections">
        <label className={styles.sidebarSearch}>
          <Search size={13} aria-hidden />
          <input
            type="search"
            value={navQuery}
            placeholder="Search"
            aria-label="Search settings sections"
            onChange={(event) => setNavQuery(event.currentTarget.value)}
          />
        </label>
        <nav className={styles.sidebarNav}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? `${styles.sidebarItem} ${styles.sidebarItemActive}` : styles.sidebarItem}
                aria-label={`Show ${item.label} settings`}
                aria-current={activeSection === item.id ? 'page' : undefined}
                onClick={() => {
                  setActiveSection(item.id)
                  const section = scrollRef.current?.querySelector<HTMLElement>(`[data-settings-section="${item.id}"]`)
                  if (section && scrollRef.current) scrollRef.current.scrollTo({ top: Math.max(0, section.offsetTop - 18) })
                }}
              >
                <span className={styles.sidebarIcon} aria-hidden><Icon size={14} /></span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
      <div className={styles.scroll} ref={scrollRef}>
        <div className={styles.inner}>
        <Segmented
          label="Settings level"
          value={mode}
          options={MODE_OPTIONS}
          onChange={(nextMode) => {
            setMode(nextMode)
            setActiveSection(nextMode === 'simple' ? SIMPLE_NAV[0].id : ADVANCED_NAV[0].id)
            setNavQuery('')
            scrollRef.current?.scrollTo({ top: 0 })
          }}
        />

        {saveError ? (
          <p className={styles.errorText} role="alert">
            {saveError}
          </p>
        ) : null}

        {mode === 'simple' ? (
          <SimpleSettings
            settings={settings}
            persist={(patch) => {
              if (patch.glassTranslucency !== undefined) {
                changeTranslucency(patch.glassTranslucency)
                return
              }
              persist(patch)
            }}
          />
        ) : (
          <AdvancedSettings settings={settings} persist={persist} />
        )}
        </div>
      </div>
    </div>
  )
}

export default SettingsMiniApp
