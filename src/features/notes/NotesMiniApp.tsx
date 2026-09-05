import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Pin, Plus, Search, StickyNote, Trash2 } from 'lucide-react'
import type { Note } from '@/types/domain'
import { noteRepo } from '@/data/repositories'
import { useNotes, useNotesSearch } from '@/hooks/data'
import { noteSnippet, noteTitle } from './noteText'
import { formatAbsoluteTime, formatRelativeTime } from './noteTime'
import styles from './notes.module.css'

interface NoteEditorProps {
  note: Note
  onBack: () => void
  onDeleted: (id: string) => void
}

/** Editor for one note. Owns a local draft and debounce-autosaves to noteRepo. */
function NoteEditor({ note, onBack, onDeleted }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const titleRef = useRef(note.title)
  const bodyRef = useRef(note.body)
  const dirtyRef = useRef(false)
  const timerRef = useRef<number | undefined>(undefined)
  const aliveRef = useRef(true)
  const confirmTimerRef = useRef<number | undefined>(undefined)

  // Keep refs on the latest draft so the debounce/flush always saves current text.
  useEffect(() => {
    titleRef.current = title
    bodyRef.current = body
  }, [title, body])

  // First cleanup flips the "alive" flag so later async setState is skipped.
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const saveNow = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    if (!dirtyRef.current) return
    dirtyRef.current = false
    void noteRepo
      .updateNote(note.id, { title: titleRef.current, body: bodyRef.current })
      .then(() => {
        if (aliveRef.current) setSaving(false)
      })
  }, [note.id])

  // Debounced autosave (~500ms) — never write on every keystroke.
  useEffect(() => {
    if (!dirtyRef.current) return
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(saveNow, 500)
  }, [title, body, saveNow])

  // On unmount: cancel the pending timer but persist the latest draft.
  useEffect(() => () => saveNow(), [saveNow])

  // Clear the armed-delete state after a pause.
  useEffect(
    () => () => {
      if (confirmTimerRef.current !== undefined) window.clearTimeout(confirmTimerRef.current)
    },
    [],
  )

  function handleTitleChange(value: string) {
    dirtyRef.current = true
    setSaving(true)
    setTitle(value)
  }

  function handleBodyChange(value: string) {
    dirtyRef.current = true
    setSaving(true)
    setBody(value)
  }

  function handleDeleteClick() {
    if (confirmingDelete) {
      if (confirmTimerRef.current !== undefined) window.clearTimeout(confirmTimerRef.current)
      void noteRepo.deleteNote(note.id)
      onDeleted(note.id)
      return
    }
    setConfirmingDelete(true)
    confirmTimerRef.current = window.setTimeout(() => setConfirmingDelete(false), 2600)
  }

  async function togglePin() {
    await noteRepo.setNotePinned(note.id, !note.pinned)
  }

  return (
    <div className={styles.editorPane} role="region" aria-label="Note editor">
      <div className={styles.editorHead}>
        <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Back to notes">
          <ArrowLeft size={20} aria-hidden />
        </button>
        <span className={styles.editorMeta}>
          {saving ? (
            <>
              <span className={styles.savingDot} aria-hidden />
              Saving…
            </>
          ) : (
            <>Edited {formatRelativeTime(note.updatedAt)}</>
          )}
        </span>
        <div className={styles.editorActions}>
          {confirmingDelete ? (
            <span className={styles.confirmRow}>
              <span className={styles.confirmText}>Delete note?</span>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleDeleteClick}
              >
                Delete
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => setConfirmingDelete(false)}
              >
                Keep
              </button>
            </span>
          ) : (
            <>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={togglePin}
                aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                aria-pressed={note.pinned}
              >
                <Pin size={17} aria-hidden />
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.dangerBtn}`}
                onClick={handleDeleteClick}
                aria-label="Delete note"
              >
                <Trash2 size={17} aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
      <div className={styles.editorBody}>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(ev) => handleTitleChange(ev.target.value)}
          placeholder="Title"
          aria-label="Note title"
        />
        <textarea
          className={styles.bodyField}
          value={body}
          onChange={(ev) => handleBodyChange(ev.target.value)}
          placeholder="Start writing…"
          aria-label="Note body"
          spellCheck={true}
        />
        <span className={styles.editorMeta}>
          {formatAbsoluteTime(note.updatedAt)} · {note.pinned ? 'Pinned' : 'Not pinned'}
        </span>
      </div>
    </div>
  )
}

/** Full Notes experience: list + editor, adaptive list/editor split. */
export function NotesMiniApp() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const allNotes = useNotes()
  const trimmedQuery = query.trim()
  const searchResults = useNotesSearch(trimmedQuery)

  const notes = allNotes ?? []
  const visible = trimmedQuery ? searchResults ?? [] : notes
  const selected = notes.find((n) => n.id === selectedId) ?? null

  async function handleNew() {
    const note = await noteRepo.createNote('')
    setQuery('')
    setSelectedId(note.id)
  }

  function handleDeleted(id: string) {
    if (selectedId === id) setSelectedId(null)
  }

  const noNotes = notes.length === 0
  const noMatches = !noNotes && visible.length === 0

  return (
    <div
      className={`${styles.app}${selected ? ` ${styles.hasSelection}` : ''}`}
      data-testid="notes-mini-app"
    >
      <section className={styles.listPane} aria-label="Notes list">
        <div className={styles.listHead}>
          <label className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} aria-hidden />
            <input
              className={styles.searchInput}
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Search notes"
              aria-label="Search notes"
              type="search"
            />
          </label>
          <button type="button" className={styles.iconBtn} onClick={handleNew} aria-label="New note">
            <Plus size={18} aria-hidden />
          </button>
        </div>

        <div className={styles.listBody}>
          {noNotes ? (
            <div className={styles.empty}>
              <StickyNote size={34} className={styles.emptyIcon} aria-hidden />
              <p className={styles.emptyTitle}>No notes yet</p>
              <p className={styles.emptyHint}>Capture a thought, a link, or a list.</p>
              <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleNew}>
                <Plus size={16} aria-hidden />
                New Note
              </button>
            </div>
          ) : noMatches ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No matches</p>
              <p className={styles.emptyHint}>
                Nothing matches “{trimmedQuery}”.
                <br />
                Try a different search.
              </p>
              <button type="button" className={styles.button} onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          ) : (
            <ul className={styles.noteList}>
              {visible.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className={`${styles.noteItem}${note.id === selectedId ? ` ${styles.noteItemSelected}` : ''}`}
                    onClick={() => setSelectedId(note.id)}
                  >
                    <span className={styles.noteItemTitle}>
                      <span className={styles.noteItemTitleText}>{noteTitle(note.title)}</span>
                      {note.pinned && (
                        <Pin size={11} className={styles.pinMark} aria-label="Pinned" />
                      )}
                    </span>
                    <span className={styles.noteItemSnippet}>
                      {noteSnippet(note.body) || 'No additional text'}
                    </span>
                    <span className={styles.noteItemMeta}>{formatRelativeTime(note.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {selected ? (
        <NoteEditor
          key={selected.id}
          note={selected}
          onBack={() => setSelectedId(null)}
          onDeleted={handleDeleted}
        />
      ) : (
        <div className={styles.editorPane}>
          <div className={styles.editorEmpty}>
            <StickyNote size={30} className={styles.emptyIcon} aria-hidden />
            <p className={styles.emptyTitle}>
              {noNotes ? 'No notes yet' : 'Select a note'}
            </p>
            <p className={styles.emptyHint}>
              {noNotes
                ? 'Create one from the list to get started.'
                : 'Pick a note from the list to read or edit it.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
