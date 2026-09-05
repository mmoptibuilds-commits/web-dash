import { useState } from 'react'
import type { ReactNode } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import styles from './settings.module.css'
import { settingsRepo } from '@/data/repositories'
import { useSettings } from '@/hooks/data'
import type {
  AppSettings,
  GlassPreset,
  IconSizePreset,
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

/**
 * App identity for the About pane. package.json is not JSON-importable under
 * the repo's tsconfig (no resolveJsonModule) and the coordinator owns that
 * file, so this mirrors package.json manually. Keep it in sync on bump.
 */
const APP_NAME = 'Hearth'
const APP_VERSION = '1.0.0'

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

const GLASS_DESCRIPTION: Record<GlassPreset, string> = {
  subtle: 'Calm translucency with a light blur.',
  standard: 'The balanced, tuned default.',
  vibrant: 'Rich color and a deep, smooth blur.',
}

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

function AdvancedSettings() {
  return (
    <>
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
  const prefersDark = usePrefersDark()

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
      <div className={styles.inner}>
        <Segmented label="Settings level" value={mode} options={MODE_OPTIONS} onChange={setMode} />

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
          <AdvancedSettings />
        )}
      </div>
    </div>
  )
}

export default SettingsMiniApp
