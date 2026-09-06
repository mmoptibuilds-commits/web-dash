import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { windowApps } from '@/types/apps'
import { useUi } from '@/state/ui'
import { useIsDesktop } from '@/hooks/useMedia'
import { AppContent } from '@/components/shell/appContent'
import type { BuiltinAppId } from '@/types/domain'
import styles from './dashboard.module.css'

const DISMISS_PX = 96
const SNUB_PX = 8

/** Narrow-screen app host. Home remains mounted underneath the sheet. */
function MobileSheet({ appId }: { appId: BuiltinAppId }) {
  const openMobile = useUi((s) => s.openMobile)
  const app = windowApps().find((a) => a.id === appId)
  const sheetRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<{ id: number; startY: number } | null>(null)
  const movedRef = useRef(false)
  const [grabbing, setGrabbing] = useState(false)

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null
    const id = window.requestAnimationFrame(() => handleRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(id)
      const opener = openerRef.current
      if (opener && opener.isConnected) {
        opener.focus()
      } else {
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLElement>(`[data-appid="${appId}"]`)?.focus()
        })
      }
    }
  }, [appId])

  if (!app) return null
  const Icon = app.icon
  const close = () => openMobile(null)

  const onSheetKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return
    const t = e.target as HTMLElement
    if (!t.closest('input, textarea, [contenteditable="true"]')) close()
  }

  const applyPull = (dy: number) => {
    const sheet = sheetRef.current
    if (!sheet) return
    const cap = window.innerHeight * 0.4
    const offset = dy > cap ? cap + (dy - cap) * 0.3 : dy
    sheet.style.animation = 'none'
    sheet.style.transition = 'none'
    sheet.style.transform = `translateY(${offset.toFixed(1)}px)`
  }

  const springBack = () => {
    const sheet = sheetRef.current
    if (!sheet) return
    sheet.style.transition = ''
    sheet.style.transform = ''
  }

  const onHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    dragRef.current = { id: e.pointerId, startY: e.clientY }
    movedRef.current = false
    setGrabbing(true)
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* optional */ }
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
    if (movedRef.current && dy >= DISMISS_PX) close()
    else springBack()
  }
  const onHandleClick = () => {
    if (movedRef.current) movedRef.current = false
    else close()
  }

  return (
    <div
      ref={sheetRef}
      className={`${styles.sheet} anim-slide-up`}
      role="dialog"
      aria-modal="true"
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
        onPointerCancel={(e) => { if (dragRef.current?.id === e.pointerId) { dragRef.current = null; setGrabbing(false); springBack() } }}
        onClick={onHandleClick}
      >
        <span className={styles.sheetHandlePill} aria-hidden />
      </button>
      <div className={styles.sheetTop}>
        <button type="button" className={styles.sheetBack} aria-label="Back to Home" onClick={close}>
          <ChevronLeft size={20} aria-hidden />
          <span>Home</span>
        </button>
        <span className={styles.sheetTitle}><Icon size={16} aria-hidden />{app.name}</span>
        <span className={styles.sheetAside} aria-hidden><ChevronDown size={18} /></span>
      </div>
      <div className={styles.sheetBody}><AppContent appId={appId} /></div>
    </div>
  )
}

export function MobileSheetHost() {
  const desktop = useIsDesktop()
  const mobileAppId = useUi((s) => s.mobileAppId)
  return !desktop && mobileAppId ? <MobileSheet appId={mobileAppId} /> : null
}

/** Compatibility export for old imports. v1.1 renders no Dashboard page. */
export function DashboardMode() {
  return <MobileSheetHost />
}

