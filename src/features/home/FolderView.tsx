import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Pencil, Plus, Trash2, X, Check } from 'lucide-react'
import { useFolders, useShortcuts } from '@/hooks/data'
import { useUi } from '@/state/ui'
import {
  removeShortcutFromFolder,
  renameFolder,
  deleteFolderCascade,
  updateFolderAppearance,
} from '@/data/repositories/folders'
import { recordAndOpen } from '@/lib/nav'
import { focusLayer, restoreFocus, trapTab } from '@/lib/focus'
import { ShortcutTile } from './homeItems'
import { ShortcutDialog } from './HomeDialogs'
import styles from './home.module.css'

/** Full-screen folder browsing + management surface. */
export function FolderView() {
  const openId = useUi((s) => s.openFolderId)
  const setOpen = useUi((s) => s.setOpenFolderId)
  const folders = useFolders()
  const shortcuts = useShortcuts()
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📁')
  const [bg, setBg] = useState<string | null>(null)
  const editMode = useUi((s) => s.editMode)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Dialog pattern: move focus into the folder on open, trap Tab, restore on
  // close — the layer is full-screen, so focus must not linger behind it.
  const open = Boolean(openId)
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    const raf = window.requestAnimationFrame(() => {
      if (overlayRef.current) focusLayer(overlayRef.current)
    })
    const onKey = (e: KeyboardEvent) => {
      if (overlayRef.current) trapTab(e, overlayRef.current)
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey, true)
      restoreFocus(opener)
    }
  }, [open])

  if (!openId || !folders || !shortcuts) return null
  const folder = folders.find((f) => f.id === openId)
  if (!folder) return null

  const members = folder.shortcutIds
    .map((id) => shortcuts.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
  const openShortcut = (s: (typeof members)[number]) => recordAndOpen(s.label, s.url)

  const commitRename = async () => {
    const next = name.trim()
    if (next) await renameFolder(folder.id, next)
    await updateFolderAppearance(folder.id, { emoji, bg })
    setRenaming(false)
  }

  const removeFolder = () => {
    const ok = window.confirm(`Delete folder “${folder.name}” and its links from Home?`)
    if (!ok) return
    setOpen(null)
    void deleteFolderCascade(folder.id)
  }

  return (
    <div
      ref={overlayRef}
      className={styles.folderOverlay}
      data-glass-role="popover"
      role="dialog"
      aria-modal="true"
      aria-label={`Folder ${folder.name}`}
      tabIndex={-1}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setOpen(null)
      }}
    >
      <div className={styles.folderInner}>
        <header className={styles.folderHeader}>
          <button
            type="button"
            className={styles.folderBack}
            onClick={() => setOpen(null)}
            aria-label="Back to pages"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>

          <div className={styles.folderTitleGroup}>
            <span className={styles.folderTitleEmoji} aria-hidden>
              {folder.icon.emoji}
            </span>
            {renaming ? (
              <span className={styles.folderRename}>
                <input
                  className={styles.folderRenameInput}
                  value={name}
                  autoFocus
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void commitRename()
                    if (e.key === 'Escape') setRenaming(false)
                  }}
                  aria-label="Folder name"
                />
                <button type="button" className="icon-btn" aria-label="Save name" onClick={() => void commitRename()}>
                  <Check size={15} aria-hidden />
                </button>
                <span className={styles.folderAppearance}>
                  {['📁', '🧰', '📚', '💼', '🎨', '✈️'].map((icon) => (
                    <button key={icon} type="button" className={icon === emoji ? styles.folderChoiceOn : styles.folderChoice} aria-label={`Use ${icon} folder icon`} aria-pressed={icon === emoji} onClick={() => setEmoji(icon)}>{icon}</button>
                  ))}
                  {[null, '#e2a33b', '#2f8f5b', '#3a74c8', '#7b57b8'].map((color) => (
                    <button key={color ?? 'none'} type="button" className={color === bg ? styles.folderTintOn : styles.folderTint} style={color ? { background: color } : undefined} aria-label={color ? `Use ${color} folder tint` : 'Use no folder tint'} aria-pressed={color === bg} onClick={() => setBg(color)} />
                  ))}
                </span>
              </span>
            ) : (
              <span className={styles.folderTitle}>
                <span>{folder.name}</span>
              </span>
            )}
          </div>

          <div className={styles.folderActions}>
            {editMode && !renaming && (
              <button type="button" className="icon-btn" aria-label="Customize folder" onClick={() => { setName(folder.name); setEmoji(folder.icon.emoji); setBg(folder.bg); setRenaming(true) }}>
                <Pencil size={16} aria-hidden />
              </button>
            )}
            {editMode ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
              <Plus size={15} aria-hidden />
              Add link
            </button> : null}
            {editMode ? <button type="button" className="icon-btn" aria-label="Delete folder" onClick={removeFolder}>
              <Trash2 size={16} aria-hidden />
            </button> : null}
          </div>
        </header>

        <div className={styles.folderBody}>
          {members.length === 0 ? (
            <div className={styles.folderEmpty}>
              <p>No links yet.</p>
              {editMode ? <button type="button" className="btn btn-ghost" onClick={() => setAdding(true)}>
                <Plus size={15} aria-hidden />
                Add a link
              </button> : null}
            </div>
          ) : (
            <div className={styles.folderGrid}>
              {members.map((s) => (
                <div key={s.id} className={styles.folderItem}>
                  {editMode ? <button
                    type="button"
                    className={styles.folderItemRemove}
                    aria-label={`Remove ${s.label} from folder`}
                    onClick={() => void removeShortcutFromFolder(folder.id, s.id)}
                  >
                    <X size={12} aria-hidden />
                  </button> : null}
                  <ShortcutTile shortcut={s} showLabel onClick={() => openShortcut(s)} scale="regular" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ShortcutDialog
        open={adding && editMode}
        onClose={() => setAdding(false)}
        pageId=""
        folderId={folder.id}
      />
    </div>
  )
}
