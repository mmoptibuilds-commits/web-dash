import { useEffect, useRef, useState } from 'react'
import { LayoutPanelTop, Maximize2, Minus, X } from 'lucide-react'
import { useUi } from '@/state/ui'
import { BUILTIN_APPS } from '@/types/apps'
import { AppContent } from './appContent'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { BuiltinAppId } from '@/types/domain'
import { useIsDesktop } from '@/hooks/useMedia'
import { clampWindowState } from '@/data/repositories/windowStates'
import { resolveSnapMode } from '@/lib/windowSnap'
import type { WindowSnapMode } from '@/types/domain'
import styles from './windows.module.css'

/** Height reserved by the menu bar so windows never slide under it. */
const MENU_BOTTOM = 36
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

interface ResizeRef {
  pointerId: number
  startX: number
  startY: number
  originW: number
  originH: number
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function workArea() {
  return { left: 8, top: MENU_BOTTOM + 4, right: window.innerWidth - 8, bottom: window.innerHeight - DOCK_RESERVE - 6 }
}

const SNAP_CHOICES: ReadonlyArray<{ mode: WindowSnapMode; label: string }> = [
  { mode: 'left', label: 'Left half' },
  { mode: 'right', label: 'Right half' },
  { mode: 'top-left', label: 'Top left' },
  { mode: 'top-right', label: 'Top right' },
  { mode: 'bottom-left', label: 'Bottom left' },
  { mode: 'bottom-right', label: 'Bottom right' },
  { mode: 'maximize', label: 'Maximize' },
]

/** Floating desktop app window with traffic-light chrome + drag to move. */
function WindowFrame({ appId }: { appId: BuiltinAppId }) {
  const win = useUi((s) => s.windows[appId])
  const focusOrder = useUi((s) => s.focusOrder)
  const focusApp = useUi((s) => s.focusApp)
  const closeApp = useUi((s) => s.closeApp)
  const minimizeApp = useUi((s) => s.minimizeApp)
  const toggleMaximize = useUi((s) => s.toggleMaximize)
  const moveWindow = useUi((s) => s.moveWindow)
  const resizeWindow = useUi((s) => s.resizeWindow)
  const snapWindow = useUi((s) => s.snapWindow)
  const restoreWindow = useUi((s) => s.restoreWindow)
  const drag = useRef<DragRef | null>(null)
  const resize = useRef<ResizeRef | null>(null)
  const frameRef = useRef<HTMLElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)
  const [layoutOpen, setLayoutOpen] = useState(false)

  useEffect(() => {
    if (!layoutOpen) return
    const closeOutside = (event: PointerEvent) => {
      if (!layoutRef.current?.contains(event.target as Node)) setLayoutOpen(false)
    }
    const closeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLayoutOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeKey)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeKey)
    }
  }, [layoutOpen])

  /** A freshly opened window is appended frontmost — move keyboard focus to it. */
  useEffect(() => {
    frameRef.current?.focus()
  }, [])

  /** When the window ahead of this one is closed/minimized, its frame (and any
   *  focus inside it) unmounts and focus drops to <body>. If this window is now
   *  the front one, reclaim focus so keyboard navigation stays on the stage. */
  const isFront = focusOrder[focusOrder.length - 1] === appId
  const wasFront = useRef(false)
  useEffect(() => {
    if (isFront && !wasFront.current) {
      const a = document.activeElement
      if (a === document.body || (a && !a.isConnected)) frameRef.current?.focus()
    }
    wasFront.current = isFront
  }, [isFront, focusOrder, appId])

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
    : {
        left: clamp(win.x, 8 - win.w + 120, Math.max(8, viewW - 88)),
        top: clamp(win.y, MENU_BOTTOM + 4, Math.max(MENU_BOTTOM + 4, viewH - DOCK_RESERVE - 66)),
        width: Math.min(win.w, viewW - 16),
        height: Math.min(win.h, viewH - MENU_BOTTOM - DOCK_RESERVE - 10),
      }

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
    const origin = win.snapMode && win.restoreBounds ? win.restoreBounds : win
    if (win.snapMode) restoreWindow(appId)
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
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
      if (d.moved) {
        const mode = resolveSnapMode({ x: e.clientX, y: e.clientY }, workArea())
        if (mode) snapWindow(appId, mode, workArea())
      }
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
  }

  const onResizeDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || win.maximized) return
    e.preventDefault()
    focusApp(appId)
    resize.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originW: win.w, originH: win.h }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* optional */ }
  }
  const onResizeMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const r = resize.current
    if (!r || r.pointerId !== e.pointerId) return
    const maxW = Math.max(300, viewW - Math.max(8, win.x) - 8)
    const maxH = Math.max(220, viewH - Math.max(MENU_BOTTOM + 4, win.y) - DOCK_RESERVE - 6)
    resizeWindow(appId, clamp(r.originW + e.clientX - r.startX, 300, maxW), clamp(r.originH + e.clientY - r.startY, 220, maxH))
  }
  const onResizeEnd = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (resize.current?.pointerId !== e.pointerId) return
    resize.current = null
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* optional */ }
  }

  return (
    <section
      ref={frameRef}
      className={styles.window}
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
            className={`${styles.dot} ${styles.min}`}
            aria-label={`Minimize ${app.name}`}
            onClick={() => minimizeApp(appId)}
          >
            <Minus size={10} aria-hidden />
          </button>
          <button
            type="button"
            className={`${styles.dot} ${styles.zoom}`}
            aria-label={maximized ? `Restore ${app.name}` : `Maximize ${app.name}`}
            onClick={() => toggleMaximize(appId)}
          >
            <Maximize2 size={9} aria-hidden />
          </button>
          <div className={styles.layoutControl} ref={layoutRef}>
            <button
              type="button"
              className={`${styles.dot} ${styles.layoutDot}`}
              aria-label={`Arrange ${app.name} window`}
              aria-haspopup="menu"
              aria-expanded={layoutOpen}
              onClick={() => setLayoutOpen((open) => !open)}
            >
              <LayoutPanelTop size={9} aria-hidden />
            </button>
            {layoutOpen ? (
              <div className={styles.snapMenu} role="menu" aria-label={`${app.name} window layout`}>
                {SNAP_CHOICES.map((choice) => (
                  <button
                    key={choice.mode}
                    type="button"
                    role="menuitem"
                    data-snap={choice.mode}
                    onClick={() => {
                      snapWindow(appId, choice.mode, workArea())
                      setLayoutOpen(false)
                    }}
                  >
                    <span className={styles.snapIcon} aria-hidden />
                    {choice.label}
                  </button>
                ))}
                {(win.snapMode || win.maximized) ? (
                  <button type="button" role="menuitem" onClick={() => { restoreWindow(appId); setLayoutOpen(false) }}>
                    Restore floating
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
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
      {!maximized && (
        <button
          type="button"
          className={styles.resizeHandle}
          aria-label={`Resize ${app.name} window`}
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
        />
      )}
    </section>
  )
}

/** Renders all open desktop windows (dashboard mode only). */
export function WindowsHost() {
  const desktop = useIsDesktop()
  const focusOrder = useUi((s) => s.focusOrder)
  const windows = useUi((s) => s.windows)
  const moveWindow = useUi((s) => s.moveWindow)
  const resizeWindow = useUi((s) => s.resizeWindow)
  useEffect(() => {
    if (!desktop) return
    const clampOpenWindows = () => {
      const viewport = { width: window.innerWidth, height: window.innerHeight, top: MENU_BOTTOM + 4, bottom: window.innerHeight - DOCK_RESERVE - 6, inset: 8 }
      for (const [appId, state] of Object.entries(windows)) {
        // Snap geometry is already derived from the same viewport work area.
        // Re-clamping it through the floating-window path applies the inset a
        // second time and, via move/resizeWindow, discards restoreBounds.
        if (!state || state.maximized || state.snapMode) continue
        const next = clampWindowState(state, viewport)
        if (next.x !== state.x || next.y !== state.y) moveWindow(appId as BuiltinAppId, next.x, next.y)
        if (next.w !== state.w || next.h !== state.h) resizeWindow(appId as BuiltinAppId, next.w, next.h)
      }
    }
    clampOpenWindows()
    window.addEventListener('resize', clampOpenWindows)
    return () => window.removeEventListener('resize', clampOpenWindows)
  }, [desktop, windows, moveWindow, resizeWindow])
  if (!desktop) return null
  return (
    <div className={styles.stage}>
      {focusOrder.map((id) => (
        <WindowFrame key={id} appId={id} />
      ))}
    </div>
  )
}
