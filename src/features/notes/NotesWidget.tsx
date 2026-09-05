import { ArrowUpRight, Pin, StickyNote } from 'lucide-react'
import type { WidgetComponentProps } from '@/features/widgets/registry'
import { useUi } from '@/state/ui'
import { useNotes } from '@/hooks/data'
import { noteSnippet, noteTitle } from './noteText'
import styles from './notes.module.css'

const MAX_ROWS = 3

/** Home widget: the three most recent notes (pinned first) with an open affordance. */
export function NotesWidget({ editMode }: WidgetComponentProps) {
  const notes = useNotes()
  const ui = useUi()
  const recent = (notes ?? []).slice(0, MAX_ROWS)

  function openNotes() {
    if (editMode) return
    ui.setMode('dashboard')
    ui.openApp('notes')
  }

  return (
    <div className={styles.widgetPanel}>
      <div className={styles.widgetHead}>
        <StickyNote size={15} aria-hidden />
        <span>Notes</span>
      </div>

      {recent.length === 0 ? (
        <div className={styles.widgetEmpty}>
          <p>No notes yet</p>
        </div>
      ) : (
        <ul className={styles.widgetList}>
          {recent.map((note) => (
            <li key={note.id}>
              <button type="button" className={styles.widgetRow} onClick={openNotes}>
                <span className={styles.widgetRowTitle}>
                  <span className={styles.widgetRowTitleText}>{noteTitle(note.title)}</span>
                  {note.pinned && <Pin size={11} className={styles.pinMark} aria-hidden />}
                </span>
                <span className={styles.widgetRowSnippet}>
                  {noteSnippet(note.body) || 'No additional text'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className={styles.widgetFooter} onClick={openNotes}>
        Open Notes
        <ArrowUpRight size={13} aria-hidden />
      </button>
    </div>
  )
}
