import { useEffect, useRef, useState } from 'react'
import { Link2, Plus, Trash2, FolderPlus, Image as ImageIcon, Type } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { useHomePages } from '@/hooks/data'
import { createShortcut, updateShortcut } from '@/data/repositories/shortcuts'
import { addItemToPage } from '@/data/repositories/layout'
import {
  createFolder,
  addShortcutToFolder,
} from '@/data/repositories/folders'
import { createPage, deletePage, movePage, renamePage } from '@/data/repositories/pages'
import { createWidgetInstance } from '@/data/repositories/widgets'
import { ADDABLE_WIDGETS } from '@/features/widgets/registry'
import { useUi } from '@/state/ui'
import type { Folder, Shortcut, ShortcutIcon } from '@/types/domain'
import styles from './home.module.css'

/* ------------------------------------------------------------------ */
/* Shortcut add/edit form                                              */
/* ------------------------------------------------------------------ */

const EMOJI_PRESETS = ['🌐', '💬', '📬', '🧑‍💻', '🎵', '🎬', '📰', '🛒', '📚', '🎮', '🧭', '💼']
const BG_SWATCHES: Array<string | null> = [
  null,
  '#e2a33b',
  '#2f8f5b',
  '#3a74c8',
  '#7b57b8',
  '#c25656',
  '#3f9fb0',
]

interface ShortcutFormProps {
  open: boolean
  onClose: () => void
  pageId: string
  /** When set, edits that shortcut instead of creating a new one. */
  initial?: Shortcut
  /** When set, a freshly created shortcut is added into this folder. */
  folderId?: string
}

export function ShortcutDialog({ open, onClose, pageId, initial, folderId }: ShortcutFormProps) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [iconMode, setIconMode] = useState<'auto' | 'emoji' | 'upload'>(
    initial?.icon.type ?? 'auto',
  )
  const [emoji, setEmoji] = useState(
    initial?.icon.type === 'emoji' ? initial.icon.emoji : EMOJI_PRESETS[0],
  )
  const [upload, setUpload] = useState(
    initial?.icon.type === 'upload' ? initial.icon.dataUrl : '',
  )
  const [bg, setBg] = useState<string | null>(initial?.bg ?? null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // The dialog stays mounted across open/close sessions (Modal returns null
  // when closed but this component's state persists), so the fields are
  // re-seeded from `initial` each time it OPENS. Without this, editing a second
  // shortcut would show the previous session's draft and Save would silently
  // overwrite the wrong shortcut. `initial` is mirrored into a ref inside an
  // effect (never during render) and read by the reset effect below, so a
  // live-query refetch while typing can't wipe in-progress edits mid-edit.
  const initialRef = useRef(initial)
  const prevOpen = useRef(false)
  useEffect(() => {
    initialRef.current = initial
  })
  useEffect(() => {
    if (open && !prevOpen.current) {
      const init = initialRef.current
      setLabel(init?.label ?? '')
      setUrl(init?.url ?? '')
      setIconMode(init?.icon.type ?? 'auto')
      setEmoji(init?.icon.type === 'emoji' ? init.icon.emoji : EMOJI_PRESETS[0])
      setUpload(init?.icon.type === 'upload' ? init.icon.dataUrl : '')
      setBg(init?.bg ?? null)
      setError(null)
    }
    prevOpen.current = open
  }, [open])

  const icon: ShortcutIcon =
    iconMode === 'emoji' ? { type: 'emoji', emoji } : iconMode === 'upload' ? { type: 'upload', dataUrl: upload } : { type: 'auto' }

  async function submit() {
    if (busy) return // in-flight guard: double activation must not double-create
    setError(null)
    if (!upload && iconMode === 'upload') {
      setError('Choose an image to use as the icon.')
      return
    }
    setBusy(true)
    try {
      if (initial) {
        const res = await updateShortcut(initial.id, { label, url, icon, bg })
        if (!res.ok) setError(res.reason)
        else onClose()
      } else {
        const res = await createShortcut({ label, url, icon, bg })
        if (!res.ok) {
          setError(res.reason)
          return
        }
        if (folderId) {
          await addShortcutToFolder(folderId, res.shortcut.id)
        } else {
          await addItemToPage(pageId, 'shortcut', res.shortcut.id)
        }
        onClose()
      }
    } finally {
      setBusy(false)
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 400_000) {
      setError('Icon image must be under 400 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const data = String(reader.result ?? '')
      if (data.startsWith('data:image/')) {
        setUpload(data)
        setIconMode('upload')
        setError(null)
      } else {
        setError('That file is not an image.')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit shortcut' : 'Add shortcut'}
      width={460}
    >
      <label className={styles.fieldLabel} htmlFor="sc-label">
        Name
      </label>
      <input
        id="sc-label"
        className="field"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (optional — uses host when blank)"
        autoFocus
        maxLength={80}
      />

      <label className={styles.fieldLabel} htmlFor="sc-url">
        Web address
      </label>
      <input
        id="sc-url"
        className="field"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        spellCheck={false}
        autoComplete="off"
      />

      <span className={styles.fieldLabel}>Icon</span>
      <div className={styles.segRow}>
        {(
          [
            { v: 'auto' as const, label: 'Auto', icon: Link2 },
            { v: 'emoji' as const, label: 'Emoji', icon: Type },
            { v: 'upload' as const, label: 'Image', icon: ImageIcon },
          ]
        ).map(({ v, label: l, icon: I }) => (
          <button
            key={v}
            type="button"
            className={`${styles.seg} ${iconMode === v ? styles.segOn : ''}`}
            aria-pressed={iconMode === v}
            onClick={() => setIconMode(v)}
          >
            <I size={14} aria-hidden />
            {l}
          </button>
        ))}
      </div>

      {iconMode === 'emoji' && (
        <div className={styles.emojiRow}>
          {EMOJI_PRESETS.map((em) => (
            <button
              key={em}
              type="button"
              className={`${styles.emojiPick} ${em === emoji ? styles.emojiPickOn : ''}`}
              aria-label={`Icon ${em}`}
              aria-pressed={em === emoji}
              onClick={() => setEmoji(em)}
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {iconMode === 'upload' && (
        <div className={styles.uploadRow}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
            {upload ? 'Replace image' : 'Choose image…'}
          </button>
          {upload && <img className={styles.uploadPreview} src={upload} alt="" />}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFile}
          />
        </div>
      )}

      <span className={styles.fieldLabel}>Tile tint</span>
      <div className={styles.swatches}>
        <button
          type="button"
          className={`${styles.swatch} ${bg === null ? styles.swatchOn : ''} ${styles.swatchNone}`}
          aria-label="No tint"
          aria-pressed={bg === null}
          onClick={() => setBg(null)}
        />
        {BG_SWATCHES.filter((c): c is string => c !== null).map((c) => (
          <button
            key={c}
            type="button"
            className={`${styles.swatch} ${bg === c ? styles.swatchOn : ''}`}
            style={{ background: c }}
            aria-label={`Tint ${c}`}
            aria-pressed={bg === c}
            onClick={() => setBg(c)}
          />
        ))}
      </div>

      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}

      <div className={styles.formActions}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
          {initial ? 'Save' : 'Add'}
        </button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* New folder                                                          */
/* ------------------------------------------------------------------ */

export function NewFolderDialog({
  open,
  onClose,
  pageId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  pageId: string
  onCreated: (folder: Folder) => void
}) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function create() {
    if (busy) return // in-flight guard: holding Enter fires repeat keydowns
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const folder = await createFolder(trimmed)
      await addItemToPage(pageId, 'folder', folder.id)
      onCreated(folder)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New folder" width={360}>
      <input
        className="field"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            e.preventDefault()
            void create()
          }
        }}
        placeholder="Folder name"
        autoFocus
        maxLength={40}
      />
      <div className={styles.formActions}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!name.trim() || busy}
          onClick={() => void create()}
        >
          <FolderPlus size={15} aria-hidden />
          Create
        </button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Widget picker                                                       */
/* ------------------------------------------------------------------ */

export function WidgetPickerDialog({
  open,
  onClose,
  pageId,
}: {
  open: boolean
  onClose: () => void
  pageId: string
}) {
  const [busy, setBusy] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title="Add widget" width={460}>
      <p className={styles.dialogHint}>Pick a widget to place on this page.</p>
      <div className={styles.widgetList}>
        {ADDABLE_WIDGETS.map((def) => {
          const Icon = def.icon
          return (
            <button
              key={def.type}
              type="button"
              className={styles.widgetPick}
              onClick={() => {
                if (busy) return // in-flight guard: double activation double-adds
                setBusy(true)
                void (async () => {
                  try {
                    const inst = await createWidgetInstance(def.type, def.defaultSize)
                    await addItemToPage(pageId, 'widget', inst.id)
                    onClose()
                  } finally {
                    setBusy(false)
                  }
                })()
              }}
            >
              <span className={styles.widgetPickIcon}>
                <Icon size={19} aria-hidden />
              </span>
              <span className={styles.widgetPickBody}>
                <span className={styles.widgetPickName}>{def.name}</span>
                <span className={styles.widgetPickDesc}>{def.description}</span>
              </span>
              <Plus size={16} className={styles.widgetPickPlus} aria-hidden />
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Pages manager (rename / reorder / delete / add)                     */
/* ------------------------------------------------------------------ */

export function PagesManagerDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pages = useHomePages()
  const activePageId = useUi((s) => s.activePageId)
  const setActivePageId = useUi((s) => s.setActivePageId)
  const [names, setNames] = useState<Record<string, string>>({})

  if (!pages) return null

  return (
    <Modal open={open} onClose={onClose} title="Pages" width={420}>
      <p className={styles.dialogHint}>Pages hold shortcuts, folders and widgets.</p>
      <div className={styles.pageList}>
        {pages.map((p, i) => (
          <div
            key={p.id}
            className={`${styles.pageRow} ${p.id === activePageId ? styles.pageRowActive : ''}`}
          >
            <button
              type="button"
              className={styles.pageSel}
              aria-label={`Go to page ${i + 1}`}
              aria-current={p.id === activePageId ? 'page' : undefined}
              title={p.id === activePageId ? 'Current page' : 'Go to page'}
              onClick={() => {
                setActivePageId(p.id)
                onClose()
              }}
            >
              <span className={styles.pageIdx}>{i + 1}</span>
            </button>
            <input
              className={styles.pageName}
              value={names[p.id] ?? p.name}
              onChange={(e) => setNames((n) => ({ ...n, [p.id]: e.target.value }))}
              onBlur={() => {
                const next = (names[p.id] ?? '').trim()
                if (next && next !== p.name) void renamePage(p.id, next)
                setNames((n) => ({ ...n, [p.id]: p.name }))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              aria-label="Page name"
              maxLength={30}
            />
            <div className={styles.pageTools}>
              <button
                type="button"
                className="icon-btn"
                aria-label="Move page left"
                disabled={i === 0}
                onClick={() => void movePage(p.id, i - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Move page right"
                disabled={i === pages.length - 1}
                onClick={() => void movePage(p.id, i + 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Delete page ${p.name}`}
                disabled={pages.length <= 1}
                onClick={() => {
                  const name = p.name
                  const ok = window.confirm(`Delete page “${name}” and its items?`)
                  if (ok) {
                    void deletePage(p.id).then(() => {
                      if (p.id === activePageId) setActivePageId(null)
                    })
                  }
                }}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          void (async () => {
            const page = await createPage()
            setActivePageId(page.id)
            onClose()
          })()
        }
      >
        <Plus size={15} aria-hidden />
        Add page
      </button>
    </Modal>
  )
}
