import { useState } from 'react'
import { ChevronLeft, Pencil, Plus, Trash2, X, Check } from 'lucide-react'
import { useFolders, useShortcuts } from '@/hooks/data'
import { useUi } from '@/state/ui'
import {
  removeShortcutFromFolder,
  renameFolder,
  deleteFolderCascade,
} from '@/data/repositories/folders'
import { recordAndOpen } from '@/lib/nav'
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
    setRenaming(false)
  }

  const removeFolder = () => {
    const ok = window.confirm(`Delete folder “${folder.name}” and its links from Home?`)
    if (!ok) return
    setOpen(null)
    void deleteFolderCascade(folder.id)
  }

  return (
    <div className={styles.folderOverlay} role="dialog" aria-label={`Folder ${folder.name}`}>
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
              </span>
            ) : (
              <span className={styles.folderTitle}>
                <span>{folder.name}</span>
                <span className={styles.folderCount}>{members.length} links</span>
              </span>
            )}
          </div>

          <div className={styles.folderActions}>
            {!renaming && (
              <button type="button" className="icon-btn" aria-label="Rename folder" onClick={() => { setName(folder.name); setRenaming(true) }}>
                <Pencil size={16} aria-hidden />
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
              <Plus size={15} aria-hidden />
              Add link
            </button>
            <button type="button" className="icon-btn" aria-label="Delete folder" onClick={removeFolder}>
              <Trash2 size={16} aria-hidden />
            </button>
          </div>
        </header>

        <div className={styles.folderBody}>
          {members.length === 0 ? (
            <div className={styles.folderEmpty}>
              <p>No links yet.</p>
              <button type="button" className="btn btn-ghost" onClick={() => setAdding(true)}>
                <Plus size={15} aria-hidden />
                Add a link
              </button>
            </div>
          ) : (
            <div className={styles.folderGrid}>
              {members.map((s) => (
                <div key={s.id} className={styles.folderItem}>
                  <button
                    type="button"
                    className={styles.folderItemRemove}
                    aria-label={`Remove ${s.label} from folder`}
                    onClick={() => void removeShortcutFromFolder(folder.id, s.id)}
                  >
                    <X size={12} aria-hidden />
                  </button>
                  <ShortcutTile shortcut={s} showLabel onClick={() => openShortcut(s)} scale="regular" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ShortcutDialog
        open={adding}
        onClose={() => setAdding(false)}
        pageId=""
        folderId={folder.id}
      />
    </div>
  )
}
