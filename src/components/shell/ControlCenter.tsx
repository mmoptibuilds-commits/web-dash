import { useEffect, useState } from 'react'
import { Maximize2, Monitor, Moon, Settings, Sun, X } from 'lucide-react'
import { launchApp } from '@/state/nav'
import { useSettings } from '@/hooks/data'
import { updateSettings } from '@/data/repositories/settings'
import { fullscreenSupported, toggleFullscreen } from '@/app/theme'
import type { ThemePreference } from '@/types/domain'
import styles from './menubar.module.css'

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'auto', label: 'Auto', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function Row({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof Sun
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <span className={styles.rowIcon}>
        <Icon size={15} aria-hidden />
      </span>
      <span className={styles.rowText}>
        {label}
        {hint && <span className={styles.rowHint}>{hint}</span>}
      </span>
      <span className={styles.rowChevron}>›</span>
    </button>
  )
}

function ThemePicker({ value, onChange }: { value: ThemePreference; onChange: (t: ThemePreference) => void }) {
  return (
    <div className={styles.segmented}>
      {THEME_OPTIONS.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          className={`${styles.segment} ${value === v ? styles.segmentOn : ''}`}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
        >
          <Icon size={14} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}

/** The slim "Control Center Lite" panel under the menu bar. */
export function ControlCenterMenu({ onClose }: { onClose: () => void }) {
  const settings = useSettings()
  const [fullscreen, setFullscreen] = useState(false)
  const reduced = settings?.reducedEffects ?? false
  const theme = settings?.theme ?? 'auto'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const syncFs = () => setFullscreen(Boolean(document.fullscreenElement))
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', syncFs)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', syncFs)
    }
  }, [onClose])

  return (
    <>
      <div className={styles.ccScrim} onClick={onClose} aria-hidden="true" />
      <div className={`${styles.ccPanel} anim-rise`} role="menu" aria-label="Control Center">
        <div className={styles.ccHead}>
          <span className={styles.ccTitle}>Control Center</span>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <X size={15} aria-hidden />
          </button>
        </div>

        <span className={styles.label}>Appearance</span>
        <ThemePicker
          value={theme}
          onChange={(next) => void updateSettings({ theme: next })}
        />

        <button
          type="button"
          role="switch"
          aria-checked={reduced}
          className={`${styles.row} ${reduced ? styles.rowOn : ''}`}
          onClick={() => void updateSettings({ reducedEffects: !reduced })}
        >
          <span className={styles.rowIcon}>
            <Moon size={15} aria-hidden />
          </span>
          <span className={styles.rowText}>Reduce motion &amp; blur</span>
          <span className={`${styles.toggle} ${reduced ? styles.toggleOn : ''}`} aria-hidden>
            <span className={styles.toggleKnob} />
          </span>
        </button>

        <div className={styles.ccDivider} />

        {fullscreenSupported() && (
          <Row
            icon={Maximize2}
            label={fullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            onClick={() => void toggleFullscreen()}
          />
        )}
        <Row
          icon={Settings}
          label="Settings"
          hint="Theme, wallpaper, data"
          onClick={() => {
            onClose()
            launchApp('settings')
          }}
        />
      </div>
    </>
  )
}
