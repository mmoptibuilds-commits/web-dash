import { useUi } from '@/state/ui'
import { useNow } from '@/hooks/useMedia'
import { goHome } from '@/state/nav'
import { BUILTIN_APPS } from '@/types/apps'
import { ControlCenterMenu } from './ControlCenter'
import { Grid2X2, Pencil, Search, SlidersHorizontal } from 'lucide-react'
import styles from './menubar.module.css'

function Clock() {
  const now = useNow(10_000)
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return <div className={styles.clock} data-testid="menu-clock" aria-label={`${time}, ${date}`}><span className={styles.clockTime}>{time}</span><span className={styles.clockDate}>{date}</span></div>
}

/** Compact system bar: Home is the current surface, Apps opens Launchpad. */
export function MenuBar() {
  const editMode = useUi((s) => s.editMode)
  const toggleEditMode = useUi((s) => s.toggleEditMode)
  const launcherOpen = useUi((s) => s.launcherOpen)
  const setLauncherOpen = useUi((s) => s.setLauncherOpen)
  const controlCenterOpen = useUi((s) => s.controlCenterOpen)
  const searchOpen = useUi((s) => s.searchOpen)
  const setControlCenter = useUi((s) => s.setControlCenter)
  const setSearchOpen = useUi((s) => s.setSearchOpen)
  const focusOrder = useUi((s) => s.focusOrder)
  const front = focusOrder.at(-1)
  const context = front ? BUILTIN_APPS[front]?.name : 'Home'

  return (
    <header className={styles.bar} data-mode="home">
      <div className={styles.left}>
        <button type="button" className={styles.brand} onClick={goHome} aria-label="Hearth home">
          <span className={styles.brandDot} aria-hidden />
          <span className={styles.brandText}>Hearth</span>
        </button>
        <button type="button" className={styles.appsButton} aria-haspopup="dialog" aria-expanded={launcherOpen} onClick={() => setLauncherOpen(!launcherOpen)}>
          <Grid2X2 size={14} aria-hidden />
          <span>Apps</span>
        </button>
        <span className={styles.context} aria-live="polite">{context}</span>
      </div>
      <div className={styles.right}>
        <button type="button" className={`${styles.action} icon-btn`} aria-label={editMode ? 'Done editing Home' : 'Edit Home'} aria-pressed={editMode} onClick={toggleEditMode}>
          {editMode ? <span className={styles.actionLabel}>Done</span> : <Pencil size={15} aria-hidden />}
        </button>
        <button type="button" className={`${styles.action} icon-btn ${searchOpen ? 'is-active' : ''}`} aria-haspopup="dialog" aria-expanded={searchOpen} aria-label="Search" title="Search (⌘K)" onClick={() => setSearchOpen(!searchOpen)}>
          <Search size={16} aria-hidden />
        </button>
        <button type="button" className={`${styles.action} icon-btn ${controlCenterOpen ? 'is-active' : ''}`} aria-haspopup="dialog" aria-expanded={controlCenterOpen} aria-label="Control Center" title="Control Center" onClick={() => setControlCenter(!controlCenterOpen)}>
          <SlidersHorizontal size={16} aria-hidden />
        </button>
        <span className={styles.divider} aria-hidden />
        <Clock />
      </div>
      {controlCenterOpen && <ControlCenterMenu onClose={() => setControlCenter(false)} />}
    </header>
  )
}

