import { useRef } from 'react'
import { Home, LayoutDashboard, Moon, Pencil, Search, Sun } from 'lucide-react'
import { useUi } from '@/state/ui'
import { goHome, goDashboard } from '@/state/nav'
import { useIsDesktop, useNow } from '@/hooks/useMedia'
import type { Mode } from '@/state/ui'
import { ControlCenterMenu } from './ControlCenter'
import styles from './menubar.module.css'

const MODES: Array<{ m: Mode; label: string; icon: typeof Home }> = [
  { m: 'home', label: 'Home', icon: Home },
  { m: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

function ModeSwitch() {
  const mode = useUi((s) => s.mode)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const go = (i: number, dir: number) => {
    const next = (i + dir + MODES.length) % MODES.length
    const target = MODES[next]
    if (target.m === 'home') goHome()
    else goDashboard()
    tabRefs.current[next]?.focus()
  }
  const onKey = (i: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(i, 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(i, -1)
    }
  }
  return (
    <div className={styles.switch} role="radiogroup" aria-label="Mode">
      {MODES.map(({ m, label, icon: Icon }, i) => {
        const selected = mode === m
        return (
          <button
            key={m}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.switchBtn} ${selected ? styles.switchBtnActive : ''}`}
            onClick={() => (m === 'home' ? goHome() : goDashboard())}
            onKeyDown={onKey(i)}
          >
            <Icon size={15} aria-hidden />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Clock() {
  const now = useNow(10_000)
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <div className={styles.clock}>
      <span className={styles.clockTime}>{time}</span>
      <span className={styles.clockDate}>{date}</span>
    </div>
  )
}

export function MenuBar() {
  const mode = useUi((s) => s.mode)
  const editMode = useUi((s) => s.editMode)
  const toggleEditMode = useUi((s) => s.toggleEditMode)
  const controlCenterOpen = useUi((s) => s.controlCenterOpen)
  const searchOpen = useUi((s) => s.searchOpen)
  const setControlCenter = useUi((s) => s.setControlCenter)
  const setSearchOpen = useUi((s) => s.setSearchOpen)
  const desktop = useIsDesktop()

  return (
    <header className={styles.bar} data-mode={mode}>
      <div className={styles.left}>
        <button type="button" className={styles.brand} onClick={goHome} aria-label="Hearth home">
          <span className={styles.brandDot} aria-hidden />
          <span className={styles.brandText}>Hearth</span>
        </button>
      </div>

      <div className={styles.center}>
        <ModeSwitch />
      </div>

      <div className={styles.right}>
        {mode === 'home' && (
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${editMode ? 'is-active' : ''}`}
            onClick={toggleEditMode}
            aria-pressed={editMode}
          >
            {editMode ? (
              <>
                <span>Done</span>
              </>
            ) : (
              <>
                <Pencil size={14} aria-hidden />
                <span>Edit</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          className={`icon-btn ${searchOpen ? 'is-active' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          aria-label="Search"
          title="Search (⌘K)"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search size={17} aria-hidden />
        </button>

        <button
          type="button"
          className={`icon-btn ${controlCenterOpen ? 'is-active' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={controlCenterOpen}
          aria-label="Control Center"
          title="Control Center"
          onClick={() => setControlCenter(!controlCenterOpen)}
        >
          <span className={styles.ccIcon} aria-hidden>
            <Sun size={9} />
            <Moon size={9} />
          </span>
        </button>

        {desktop && (
          <>
            <span className={styles.divider} aria-hidden />
            <Clock />
          </>
        )}
      </div>

      {controlCenterOpen && <ControlCenterMenu onClose={() => setControlCenter(false)} />}
    </header>
  )
}
