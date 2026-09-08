import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useUi } from '@/state/ui'
import { launchApp } from '@/state/nav'
import { windowApps } from '@/types/apps'
import { SystemGlyph } from '@/components/common/Glyph'
import { ShortcutGlyph } from '@/components/common/Glyph'
import { useShortcuts } from '@/hooks/data'
import { recordAndOpen } from '@/lib/nav'
import { hostOf } from '@/lib/url'
import { createShortcut, deleteShortcut, updateShortcut } from '@/data/repositories/shortcuts'
import { ConfirmDialog, Modal } from '@/components/common/Modal'
import type { Shortcut } from '@/types/domain'
import styles from './app-launcher.module.css'

function ShortcutEditor({ shortcut, onClose }: { shortcut: Shortcut | null; onClose: () => void }) {
  const [label, setLabel] = useState(shortcut?.label ?? '')
  const [url, setUrl] = useState(shortcut?.url ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    const result = shortcut
      ? await updateShortcut(shortcut.id, { label, url })
      : await createShortcut({ label, url })
    setBusy(false)
    if (!result.ok) {
      setError(result.reason)
      return
    }
    onClose()
  }

  return (
    <Modal open title={shortcut ? `Edit ${shortcut.label}` : 'Add shortcut'} onClose={onClose} width={400}>
      <form className={styles.shortcutForm} onSubmit={(event) => void submit(event)}>
        <label className={styles.field}>
          <span>Name</span>
          <input autoFocus value={label} maxLength={80} onChange={(event) => setLabel(event.currentTarget.value)} />
        </label>
        <label className={styles.field}>
          <span>Web address</span>
          <input value={url} inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://example.com" onChange={(event) => setUrl(event.currentTarget.value)} />
        </label>
        {error ? <p className={styles.formError} role="alert">{error}</p> : null}
        <div className={styles.formActions}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{shortcut ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  )
}

/** Launchpad-style app inventory anchored over the permanent Home desktop. */
export function AppLauncher() {
  const setOpen = useUi((s) => s.setLauncherOpen)
  const shortcuts = useShortcuts() ?? []
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const [editing, setEditing] = useState<Shortcut | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Shortcut | null>(null)
  const childDialogOpen = editing !== undefined || deleting !== null

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null
    const id = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !childDialogOpen) {
        event.preventDefault()
        setOpen(false)
      }
      if (event.key !== 'Tab' || childDialogOpen) return
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
  }, [setOpen, childDialogOpen])

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false)
    }}>
      <section
        ref={panelRef}
        className={styles.panel}
        data-glass-role="popover"
        role="dialog"
        aria-modal="true"
        aria-label="Apps and links"
        aria-hidden={childDialogOpen ? 'true' : undefined}
        inert={childDialogOpen ? true : undefined}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Workspace</p>
            <h1 className={styles.title}>Launchpad</h1>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className="btn btn-ghost btn-sm" aria-label="Add shortcut" onClick={() => setEditing(null)}>
              <Plus size={15} aria-hidden />
              Add shortcut
            </button>
            <button type="button" className="icon-btn" aria-label="Close Launchpad" onClick={() => setOpen(false)}>
              <X size={17} aria-hidden />
            </button>
          </div>
        </header>
        <h2 className={styles.sectionTitle}>Apps</h2>
        <div className={styles.grid}>
          {windowApps().map((app) => {
            const Icon = app.icon
            return (
              <button
                key={app.id}
                type="button"
                className={styles.app}
                data-appid={app.id}
                aria-label={`Open ${app.name}`}
                onClick={() => { setOpen(false); launchApp(app.id) }}
              >
                <SystemGlyph icon={Icon} label={app.name} size={58} />
                <span className={styles.name}>{app.name}</span>
                <span className={styles.description}>{app.description}</span>
              </button>
            )
          })}
        </div>
        <h2 className={styles.sectionTitle}>Links</h2>
        {shortcuts.length > 0 ? (
          <div className={`${styles.grid} ${styles.linkGrid}`}>
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className={`${styles.app} ${styles.linkApp}`}>
                <button
                  type="button"
                  className={styles.linkLaunch}
                  aria-label={`Open ${shortcut.label}`}
                  onClick={() => {
                    setOpen(false)
                    recordAndOpen(shortcut.label, shortcut.url)
                  }}
                >
                  <span className={styles.linkGlyph}>
                    <ShortcutGlyph icon={shortcut.icon} label={shortcut.label} url={shortcut.url} />
                  </span>
                  <span className={styles.name}>{shortcut.label}</span>
                  <span className={styles.description}>{hostOf(shortcut.url)}</span>
                </button>
                <span className={styles.linkActions}>
                  <button type="button" className={styles.linkAction} aria-label={`Edit ${shortcut.label}`} onClick={() => setEditing(shortcut)}>
                    <Pencil size={13} aria-hidden />
                  </button>
                  <button type="button" className={styles.linkAction} aria-label={`Delete ${shortcut.label}`} onClick={() => setDeleting(shortcut)}>
                    <Trash2 size={13} aria-hidden />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : <p className={styles.empty}>Links added from Home or the Links app will appear here.</p>}
      </section>
      {editing !== undefined ? <ShortcutEditor key={editing?.id ?? 'new'} shortcut={editing} onClose={() => setEditing(undefined)} /> : null}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete shortcut?"
        message={deleting ? `Remove “${deleting.label}” from Apps, Home, folders and the Dock?` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void deleteShortcut(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
