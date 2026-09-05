import { Home, LayoutDashboard, Moon, Pencil, Search, Sun } from 'lucide-react'
import { useUi } from '@/state/ui'
import { goHome, goDashboard } from '@/state/nav'
import { useIsDesktop, useNow } from '@/hooks/useMedia'
import type { Mode } from '@/state/ui'
import { ControlCenterMenu } from './ControlCenter'
import styles from './menubar.module.css'

function ModeSwitch() {
  const mode = useUi((s) => s.mode)
  const pick = (m: Mode) => (m === 'home' ? goHome() : goDashboard())
  return (
    <div className={styles.switch} role="tablist" aria-label="Mode">
      {(
        [
          { m: 'home' as Mode, label: 'Home', icon: Home },
          { m: 'dashboard' as Mode, label: 'Dashboard', icon: LayoutDashboard },
        ]
      ).map(({ m, label, icon: Icon }) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          className={`${styles.switchBtn} ${mode === m ? styles.switchBtnActive : ''}`}
          onClick={() => pick(m)}
        >
          <Icon size={15} aria-hidden />
          <span>{label}</span>
        </button>
      ))}
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
          aria-pressed={searchOpen}
          aria-label="Search"
          title="Search (⌘K)"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search size={17} aria-hidden />
        </button>

        <button
          type="button"
          className={`icon-btn ${controlCenterOpen ? 'is-active' : ''}`}
          aria-pressed={controlCenterOpen}
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
