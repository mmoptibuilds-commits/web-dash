import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { windowApps } from '@/types/apps'
import { useUi } from '@/state/ui'
import { useIsDesktop } from '@/hooks/useMedia'
import { launchApp } from '@/state/nav'
import { AppContent } from '@/components/shell/appContent'
import { WindowsHost } from '@/components/shell/WindowsHost'
import { hueFor } from '@/components/common/Glyph'
import type { BuiltinAppId } from '@/types/domain'
import styles from './dashboard.module.css'

function AppCard({ appId }: { appId: BuiltinAppId }) {
  const app = windowApps().find((a) => a.id === appId)!
  const Icon = app.icon
  const h = hueFor(app.name)
  return (
    <button
      type="button"
      className={styles.card}
      data-appid={appId}
      onClick={() => launchApp(appId)}
    >
      <span
        className={styles.cardGlyph}
        style={{
          backgroundImage: `linear-gradient(150deg, hsl(${h} 50% 54%), hsl(${(h + 40) % 360} 56% 40%))`,
        }}
      >
        <Icon size={26} strokeWidth={1.8} aria-hidden />
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardName}>{app.name}</span>
        <span className={styles.cardDesc}>{app.description}</span>
      </span>
      <ChevronLeft className={styles.cardChev} size={16} aria-hidden />
    </button>
  )
}

function Overview() {
  return (
    <div className={styles.overview}>
      <header className={styles.overviewHead}>
        <h1 className={styles.overviewTitle}>Dashboard</h1>
        <p className={styles.overviewSub}>Notes, tasks, calendar and links — your mini apps.</p>
      </header>
      <div className={styles.grid}>
        {windowApps().map((a) => (
          <AppCard key={a.id} appId={a.id} />
        ))}
      </div>
    </div>
  )
}

const DISMISS_PX = 96 // pull the sheet past this to close it (≈ 20% of a phone)
const SNUB_PX = 8 // pointer travel above this counts as a drag, not a tap

/**
 * A Dashboard mini-app on a phone: an iOS-style bottom sheet — rounded top,
 * grab handle, and pull-down-to-dismiss that springs back unless dragged past
 * the threshold. Tapping the handle (or Back / Escape) also closes it, so the
 * gesture is a bonus, never the only path. Focus returns to the opener.
 */
function MobileSheet({ appId }: { appId: BuiltinAppId }) {
  const openMobile = useUi((s) => s.openMobile)
  const app = windowApps().find((a) => a.id === appId)
  const sheetRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<{ id: number; startY: number } | null>(null)
  const movedRef = useRef(false) // travelled far enough that the next click is a drag artifact
  const [grabbing, setGrabbing] = useState(false)

  // Move focus into the sheet on open and hand it back on close (the sheet is a
  // full-screen layer; focus must not stay behind it on the covered dock).
  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null
    const id = window.requestAnimationFrame(() => handleRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(id)
      const opener = openerRef.current
      if (opener && opener.isConnected) {
        opener.focus?.()
        return
      }
      // The launcher that opened the sheet is usually unmounted for the whole
      // time a full-screen sheet is up (Dashboard's Overview is replaced by the
      // sheet), so a snapshot taken on open is disconnected by close. Re-query
      // the freshly committed surface for this app's launcher (`data-appid`)
      // once it exists instead of dropping focus to <body>.
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(`[data-appid="${appId}"]`)
          ?.focus?.()
      })
    }
  }, [appId])

  if (!app) return null
  const Icon = app.icon
  const close = () => openMobile(null)
  // Close on Escape — unless a text field is being edited inside the sheet.
  const onSheetKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return
    const t = e.target as HTMLElement
    if (t.closest('input, textarea, [contenteditable="true"]')) return
    close()
  }

  const applyPull = (dy: number) => {
    const sheet = sheetRef.current
    if (!sheet) return
    const cap = window.innerHeight * 0.4 // rubber-band past 40% so a fling can't fly off
    const offset = dy > cap ? cap + (dy - cap) * 0.3 : dy
    // The slide-up entrance animation owns `transform` while it plays, so an
    // inline transform set mid-animation would be ignored and the sheet would
    // not follow the finger. Drop the animation, then drive it by transform.
    sheet.style.animation = 'none'
    sheet.style.transition = 'none'
    sheet.style.transform = `translateY(${offset.toFixed(1)}px)`
  }
  const springBack = () => {
    const sheet = sheetRef.current
    if (!sheet) return
    sheet.style.transition = ''
    sheet.style.transform = '' // the stylesheet's transform transition animates it home
  }

  const onHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    dragRef.current = { id: e.pointerId, startY: e.clientY }
    movedRef.current = false
    setGrabbing(true)
    // Guarded: synthetic/test pointers (and edge platforms) may not be capturable.
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer capture is an optimisation — the sheet still follows */
    }
  }
  const onHandlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d || d.id !== e.pointerId) return
    const dy = Math.max(0, e.clientY - d.startY)
    if (dy > SNUB_PX) movedRef.current = true
    applyPull(dy)
  }
  const onHandlePointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d || d.id !== e.pointerId) return
    dragRef.current = null
    setGrabbing(false)
    const dy = Math.max(0, e.clientY - d.startY)
    if (movedRef.current && dy >= DISMISS_PX) {
      close()
    } else {
      springBack()
    }
  }
  const onHandlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.id !== e.pointerId) return
    dragRef.current = null
    setGrabbing(false)
    springBack()
  }
  const onHandleClick = () => {
    if (movedRef.current) {
      movedRef.current = false // a drag's trailing click — ignore it
      return
    }
    close()
  }

  return (
    <div
      ref={sheetRef}
      className={`${styles.sheet} anim-slide-up`}
      role="dialog"
      aria-label={`${app.name} sheet`}
      onKeyDown={onSheetKeyDown}
    >
      <button
        ref={handleRef}
        type="button"
        className={`${styles.sheetHandle}${grabbing ? ` ${styles.sheetGrabbing}` : ''}`}
        aria-label={`Close ${app.name} sheet`}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerEnd}
        onPointerCancel={onHandlePointerCancel}
        onClick={onHandleClick}
      >
        <span className={styles.sheetHandlePill} aria-hidden />
      </button>
      <div className={styles.sheetTop}>
        <button
          type="button"
          className={styles.sheetBack}
          aria-label="Back to dashboard"
          onClick={close}
        >
          <ChevronLeft size={20} aria-hidden />
          <span>Dashboard</span>
        </button>
        <span className={styles.sheetTitle}>
          <Icon size={16} aria-hidden />
          {app.name}
        </span>
        <span className={styles.sheetAside} aria-hidden>
          <ChevronDown size={18} />
        </span>
      </div>
      <div className={styles.sheetBody}>
        <AppContent appId={appId} />
      </div>
    </div>
  )
}

/** Dashboard surface: desktop = floating windows; mobile = sheets + overview. */
export function DashboardMode() {
  const desktop = useIsDesktop()
  const focusOrder = useUi((s) => s.focusOrder)
  const mobileAppId = useUi((s) => s.mobileAppId)

  if (desktop) {
    return (
      <>
        {focusOrder.length === 0 && <Overview />}
        <WindowsHost />
      </>
    )
  }
  return mobileAppId ? <MobileSheet appId={mobileAppId} /> : <Overview />
}
