import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useUi } from '@/state/ui'
import { launchApp } from '@/state/nav'
import { windowApps } from '@/types/apps'
import { SystemGlyph } from '@/components/common/Glyph'
import styles from './app-launcher.module.css'

/** Launchpad-style app inventory anchored over the permanent Home desktop. */
export function AppLauncher() {
  const setOpen = useUi((s) => s.setLauncherOpen)
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null
    const id = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
      if (event.key !== 'Tab') return
      const buttons = panelRef.current?.querySelectorAll<HTMLButtonElement>('button')
      if (!buttons || buttons.length < 2) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('keydown', onKey)
      const opener = openerRef.current
      if (opener?.isConnected) requestAnimationFrame(() => opener.focus())
    }
  }, [setOpen])

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false)
    }}>
      <section ref={panelRef} className={styles.panel} role="dialog" aria-modal="true" aria-label="Apps">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Workspace</p>
            <h1 className={styles.title}>Apps</h1>
          </div>
          <button type="button" className="icon-btn" aria-label="Close Apps" onClick={() => setOpen(false)}>
            <X size={17} aria-hidden />
          </button>
        </header>
        <div className={styles.grid}>
          {windowApps().map((app) => {
            const Icon = app.icon
            return (
              <button
                key={app.id}
                type="button"
                className={styles.app}
                data-appid={app.id}
                onClick={() => { setOpen(false); launchApp(app.id) }}
              >
                <SystemGlyph icon={Icon} label={app.name} size={58} />
                <span className={styles.name}>{app.name}</span>
                <span className={styles.description}>{app.description}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
