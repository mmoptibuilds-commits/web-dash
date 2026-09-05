import { useEffect, useRef } from 'react'
import { Maximize2, X } from 'lucide-react'
import { useUi } from '@/state/ui'
import { BUILTIN_APPS } from '@/types/apps'
import { AppContent } from './appContent'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { BuiltinAppId } from '@/types/domain'
import styles from './windows.module.css'

/** Height reserved by the menu bar so windows never slide under it. */
const MENU_BOTTOM = 48
/** Space reserved above the dock when maximizing. */
const DOCK_RESERVE = 96

interface DragRef {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/** Floating desktop app window with traffic-light chrome + drag to move. */
function WindowFrame({ appId }: { appId: BuiltinAppId }) {
  const win = useUi((s) => s.windows[appId])
  const focusOrder = useUi((s) => s.focusOrder)
  const focusApp = useUi((s) => s.focusApp)
  const closeApp = useUi((s) => s.closeApp)
  const toggleMaximize = useUi((s) => s.toggleMaximize)
  const moveWindow = useUi((s) => s.moveWindow)
  const drag = useRef<DragRef | null>(null)
  const frameRef = useRef<HTMLElement>(null)

  /** A freshly opened window is appended frontmost — move keyboard focus to it. */
  useEffect(() => {
    frameRef.current?.focus()
  }, [])

  /** Raise the window when any part of it receives keyboard focus (macOS model). */
  const raiseIfBehind = () => {
    const st = useUi.getState()
    if (st.focusOrder[st.focusOrder.length - 1] !== appId) focusApp(appId)
  }

  if (!win) return null
  const app = BUILTIN_APPS[appId]
  const Icon = app.icon
  const zIndex = 20 + focusOrder.indexOf(appId)
  const maximized = win.maximized
  const viewH = window.innerHeight
  const viewW = window.innerWidth

  const geometry = maximized
    ? {
        left: 8,
        top: MENU_BOTTOM + 4,
        width: viewW - 16,
        height: viewH - MENU_BOTTOM - DOCK_RESERVE - 6,
      }
    : { left: win.x, top: win.y, width: win.w, height: win.h }

  const onTitleDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (win.maximized) return
    // The traffic-light buttons live inside the titlebar; never start a drag
    // (or capture the pointer) for a press that began on a button, or the
    // button's own click gets retargeted and swallowed.
    if ((e.target as HTMLElement).closest('button')) return
    focusApp(appId)
    const el = e.currentTarget
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: win.x,
      originY: win.y,
      moved: false,
    }
  }

  const onTitleMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < 3) return
    d.moved = true
    const x = clamp(d.originX + dx, -win.w + 120, viewW - 80)
    const y = clamp(d.originY + dy, MENU_BOTTOM, viewH - 60)
    moveWindow(appId, x, y)
  }

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (d && d.pointerId === e.pointerId) {
      drag.current = null
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <section
      ref={frameRef}
      className={`${styles.window} ${maximized ? styles.maximized : ''}`}
      role="dialog"
      aria-label={`${app.name} window`}
      tabIndex={-1}
      style={{ ...geometry, zIndex }}
      data-front={focusOrder[focusOrder.length - 1] === appId}
      onFocus={raiseIfBehind}
      onPointerDown={raiseIfBehind}
    >
      <header
        className={styles.titlebar}
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={endDrag}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          toggleMaximize(appId)
        }}
      >
        <div className={styles.traffic}>
          <button
            type="button"
            className={`${styles.dot} ${styles.close}`}
            aria-label={`Close ${app.name}`}
            onClick={() => closeApp(appId)}
          >
            <X size={10} aria-hidden />
          </button>
          <button
            type="button"
            className={`${styles.dot} ${styles.zoom}`}
            aria-label={maximized ? `Restore ${app.name}` : `Maximize ${app.name}`}
            onClick={() => toggleMaximize(appId)}
          >
            <Maximize2 size={9} aria-hidden />
          </button>
        </div>
        <span className={styles.titleText}>
          <Icon size={13} aria-hidden />
          {app.name}
        </span>
        <span className={styles.titleSpacer} aria-hidden />
      </header>
      <div className={styles.content}>
        <AppContent appId={appId} />
      </div>
    </section>
  )
}

/** Renders all open desktop windows (dashboard mode only). */
export function WindowsHost() {
  const focusOrder = useUi((s) => s.focusOrder)
  return (
    <div className={styles.stage}>
      {focusOrder.map((id) => (
        <WindowFrame key={id} appId={id} />
      ))}
    </div>
  )
}
