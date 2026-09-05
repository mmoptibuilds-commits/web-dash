import { useMemo, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import type { Shortcut } from '@/types/domain'
import { folderRepo, shortcutRepo } from '@/data/repositories'
import { useFolders, useShortcuts } from '@/hooks/data'
import { hostOf } from '@/lib/url'
import { recordAndOpen } from '@/lib/nav'
import { Favicon } from './Favicon'
import { filterShortcuts, folderNamesByShortcut, sortShortcuts } from './utils'
import styles from './bookmarks.module.css'

const MAX_SHOWN_FOLDER_NAMES = 2

/**
 * Links / Bookmarks mini-app — a manager over the shared shortcut store.
 * Search, add and delete shortcuts; folders are shown as a per-row tag, never
 * as a second link database.
 */
export function BookmarksMiniApp() {
  const shortcuts = useShortcuts()
  const folders = useFolders()

  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [folderId, setFolderId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<Shortcut | null>(null)

  const dataReady = shortcuts !== undefined && folders !== undefined
  const list = shortcuts ?? []
  const folderList = folders ?? []
  const folderMap = useMemo(
    () => folderNamesByShortcut(shortcuts ?? [], folders ?? []),
    [shortcuts, folders],
  )

  const visible = useMemo(
    () => sortShortcuts(filterShortcuts(shortcuts ?? [], query)),
    [shortcuts, query],
  )

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault()
    if (!label.trim() && !url.trim()) return
    setError(null)
    try {
      const result = await shortcutRepo.createShortcut({ label, url })
      if (!result.ok) {
        setError(result.reason)
        return
      }
      if (folderId) {
        await folderRepo.addShortcutToFolder(folderId, result.shortcut.id)
      }
      setLabel('')
      setUrl('')
      setFolderId('')
      setShowForm(false)
    } catch {
      setError('Something went wrong saving the link.')
    }
  }

  function closeForm() {
    setShowForm(false)
    setError(null)
  }

  async function handleDelete() {
    if (!confirming) return
    const id = confirming.id
    setConfirming(null)
    try {
      await shortcutRepo.deleteShortcut(id)
    } catch {
      setError('Something went wrong removing the link.')
    }
  }

  return (
    <div className={styles.app}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} aria-hidden />
          <input
            className={`${styles.input} ${styles.searchInput}`}
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Search links…"
            aria-label="Search links"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          className={styles.addBtn}
          aria-expanded={showForm}
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
        >
          <Plus size={16} aria-hidden />
          <span>Add link</span>
        </button>
      </div>

      {error && (
        <p className={styles.errorBanner} role="alert">
          {error}
        </p>
      )}

      {showForm && (
        <form className={styles.addForm} onSubmit={handleAdd}>
          <div className={styles.formRow}>
            <input
              className={styles.input}
              value={label}
              onChange={(ev) => setLabel(ev.target.value)}
              placeholder="Label"
              aria-label="Label"
              maxLength={80}
            />
            <input
              className={styles.input}
              value={url}
              onChange={(ev) => setUrl(ev.target.value)}
              placeholder="https://example.com"
              aria-label="URL"
              inputMode="url"
              spellCheck={false}
              autoCapitalize="off"
            />
          </div>
          {(folderList).length > 0 && (
            <select
              className={styles.input}
              value={folderId}
              onChange={(ev) => setFolderId(ev.target.value)}
              aria-label="Add to folder"
            >
              <option value="">No folder</option>
              {folderList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <div className={styles.formActions}>
            <button type="button" className={styles.btn} onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              Add
            </button>
          </div>
        </form>
      )}

      {confirming && (
        <div className={styles.confirmBar} role="alertdialog" aria-label="Delete link">
          <span className={styles.confirmText}>
            Remove “{confirming.label}”? It will disappear from Home pages, folders and the
            dock.
          </span>
          <span className={styles.confirmActions}>
            <button type="button" className={styles.btn} onClick={() => setConfirming(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={handleDelete}
            >
              Delete
            </button>
          </span>
        </div>
      )}

      <div className={styles.list} role="list" aria-label="Links">
        {dataReady && list.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>No links yet</span>
            <span className={styles.emptyHint}>
              Add your first link — it lives here in Links. To show it on Home,
              switch Home to Edit and add a Shortcut.
            </span>
          </div>
        )}

        {dataReady && list.length > 0 && visible.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>No links match</span>
            <span className={styles.emptyHint}>Try a different search.</span>
          </div>
        )}

        {visible.map((shortcut) => {
          const folderNames = folderMap.get(shortcut.id)
          return (
            <div className={styles.row} role="listitem" key={shortcut.id}>
              <button
                type="button"
                className={styles.rowOpen}
                onClick={() => recordAndOpen(shortcut.label, shortcut.url)}
                aria-label={`Open ${shortcut.label}`}
              >
                <Favicon url={shortcut.url} label={shortcut.label} size={22} />
                <span className={styles.rowText}>
                  <span className={styles.rowLabel}>{shortcut.label}</span>
                  <span className={styles.rowMeta}>
                    <span className={styles.rowHost}>{hostOf(shortcut.url)}</span>
                    {folderNames && folderNames.length > 0 && (
                      <span className={styles.rowFolders}>
                        {folderNames.slice(0, MAX_SHOWN_FOLDER_NAMES).join(' · ')}
                        {folderNames.length > MAX_SHOWN_FOLDER_NAMES
                          ? ` +${folderNames.length - MAX_SHOWN_FOLDER_NAMES}`
                          : ''}
                      </span>
                    )}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setConfirming(shortcut)}
                aria-label={`Delete ${shortcut.label}`}
                title={`Delete ${shortcut.label}`}
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
