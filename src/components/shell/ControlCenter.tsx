import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Maximize2, Monitor, Moon, Sun, X } from 'lucide-react'
import { useSettings } from '@/hooks/data'
import { updateSettings } from '@/data/repositories/settings'
import { fullscreenSupported, toggleFullscreen } from '@/app/theme'
import { focusLayer, restoreFocus, trapTab } from '@/lib/focus'
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
      <ChevronRight size={16} className={styles.rowChevron} aria-hidden />
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
  const [closing, setClosing] = useState(false)
  const reduced = settings?.reducedEffects ?? false
  const theme = settings?.theme ?? 'auto'
  const panelRef = useRef<HTMLDivElement>(null)
  // Exit is animated (the panel reverses its rise), so the component must stay
  // mounted until the animation ends. These refs let the one-time mount effect
  // drive that lifecycle without depending on re-created callbacks.
  const closingRef = useRef(false)
  const closeTimer = useRef<number | undefined>(undefined)

  const finishClose = () => onClose()

  const requestClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    // Safety net: if animationend is ever missed, unmount shortly after the
    // exit animation would have ended.
    closeTimer.current = window.setTimeout(finishClose, 420)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Consume Escape so the app-wide chrome handler can't unmount us before
        // the exit animation runs.
        e.stopPropagation()
        requestClose()
      }
      if (panelRef.current) trapTab(e, panelRef.current)
    }
    const syncFs = () => setFullscreen(Boolean(document.fullscreenElement))
    const opener = document.activeElement
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('fullscreenchange', syncFs)
    const raf = window.requestAnimationFrame(() => {
      if (panelRef.current) focusLayer(panelRef.current)
    })
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('fullscreenchange', syncFs)
      window.cancelAnimationFrame(raf)
      if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current)
      restoreFocus(opener)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className={styles.ccScrim} onClick={requestClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`${styles.ccPanel} anim-rise ${closing ? styles.closing : ''}`}
        role="dialog"
        aria-label="Control Center"
        tabIndex={-1}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) finishClose()
        }}
      >
        <div className={styles.ccHead}>
          <span className={styles.ccTitle}>Control Center</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close"
            onClick={requestClose}
          >
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
          <span className={`${styles.ctrlSwitch} ${reduced ? styles.ctrlSwitchOn : ''}`} aria-hidden>
            <span className={styles.ctrlKnob} />
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
      </div>
    </>
  )
}
