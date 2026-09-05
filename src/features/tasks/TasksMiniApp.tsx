import { useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { CheckCircle2, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react'
import type { TaskItem } from '@/types/domain'
import { taskRepo } from '@/data/repositories'
import { useTasks } from '@/hooks/data'
import styles from './tasks.module.css'

/** Full Tasks experience: add, check, inline-edit, delete, clear completed. */
export function TasksMiniApp() {
  const tasks = useTasks()
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const cancelRef = useRef(false)

  const list = tasks ?? []
  const doneCount = list.filter((t) => t.done).length
  const openCount = list.length - doneCount

  async function handleAdd(ev: FormEvent) {
    ev.preventDefault()
    const value = text.trim()
    if (!value) return
    await taskRepo.createTask(value)
    setText('')
  }

  function beginEdit(task: TaskItem) {
    cancelRef.current = false
    setEditingId(task.id)
    setDraft(task.text)
  }

  function commitEdit(id: string | null, value: string) {
    if (!id) return
    const trimmed = value.trim()
    if (!trimmed) return
    void taskRepo.renameTask(id, trimmed)
  }

  function handleEditKeyDown(ev: KeyboardEvent<HTMLInputElement>, id: string) {
    if (ev.key === 'Enter') {
      ev.preventDefault()
      commitEdit(id, draft)
      cancelRef.current = true // ignore the blur fired by the unmounting input
      setEditingId(null)
      setDraft('')
    } else if (ev.key === 'Escape') {
      ev.preventDefault()
      cancelRef.current = true
      setEditingId(null)
      setDraft('')
    }
  }

  function handleEditBlur(id: string) {
    // Escape sets cancelRef first so a blur fired by the unmounting input is a no-op.
    if (cancelRef.current) {
      cancelRef.current = false
      return
    }
    setEditingId(null)
    commitEdit(id, draft)
  }

  async function handleToggle(task: TaskItem) {
    await taskRepo.setTaskDone(task.id, !task.done)
  }

  async function handleDelete(id: string) {
    await taskRepo.deleteTask(id)
    if (editingId === id) {
      setEditingId(null)
      setDraft('')
    }
  }

  async function handleClearCompleted() {
    // If the row being edited is a completed one, it is about to disappear.
    const editedDone = editingId ? list.find((t) => t.id === editingId)?.done : false
    const doneIds = list.filter((t) => t.done).map((t) => t.id)
    // NOTE: taskRepo.clearCompleted() is currently broken (queries an
    // un-indexed `done` keyPath), so clear via per-row deletes for now.
    await Promise.all(doneIds.map((id) => taskRepo.deleteTask(id)))
    if (editedDone) {
      setEditingId(null)
      setDraft('')
    }
  }

  return (
    <div className={styles.app} data-testid="tasks-mini-app">
      <form className={styles.addForm} onSubmit={handleAdd} aria-label="Add task">
        <input
          className={styles.taskInput}
          value={text}
          onChange={(ev) => setText(ev.target.value)}
          placeholder="Add a task…"
          aria-label="New task text"
        />
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary} ${styles.addBtn}`}
          disabled={!text.trim()}
          aria-label="Add task"
        >
          <Plus size={17} aria-hidden />
        </button>
      </form>

      <div className={styles.listBody}>
        {list.length === 0 ? (
          <div className={styles.empty}>
            <ListTodo size={34} className={styles.emptyIcon} aria-hidden />
            <p className={styles.emptyTitle}>No tasks yet</p>
            <p className={styles.emptyHint}>Add one above and it will stick around — no account needed.</p>
          </div>
        ) : (
          <ul className={styles.taskList}>
            {list.map((task) => (
              <li
                key={task.id}
                className={`${styles.taskRow}${task.done ? ` ${styles.taskRowDone}` : ''}`}
              >
                <label className={styles.taskCheck}>
                  <input
                    type="checkbox"
                    className={styles.taskCheckbox}
                    checked={task.done}
                    onChange={() => handleToggle(task)}
                    aria-label={
                      task.done ? `Mark “${task.text}” as not done` : `Mark “${task.text}” as done`
                    }
                  />
                </label>

                {editingId === task.id ? (
                  <input
                    className={styles.taskEdit}
                    value={draft}
                    autoFocus
                    onChange={(ev) => setDraft(ev.target.value)}
                    onBlur={() => handleEditBlur(task.id)}
                    onKeyDown={(ev) => handleEditKeyDown(ev, task.id)}
                    aria-label="Edit task text"
                  />
                ) : (
                  <span
                    className={styles.taskText}
                    title={task.done ? undefined : 'Double-click to edit'}
                    onDoubleClick={() => beginEdit(task)}
                  >
                    {task.text}
                  </span>
                )}

                <div className={styles.rowActions}>
                  {editingId !== task.id && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => beginEdit(task)}
                      aria-label={`Edit task “${task.text}”`}
                    >
                      <Pencil size={15} aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.dangerBtn}`}
                    onClick={() => handleDelete(task.id)}
                    aria-label={`Delete task “${task.text}”`}
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className={styles.footer}>
        <span className={styles.footerCount} aria-live="polite">
          {openCount === 0 ? 'All done' : `${openCount} open · ${doneCount} done`}
        </span>
        {doneCount > 0 && (
          <button type="button" className={styles.clearBtn} onClick={handleClearCompleted}>
            <CheckCircle2 size={14} aria-hidden />
            Clear completed
          </button>
        )}
      </footer>
    </div>
  )
}
