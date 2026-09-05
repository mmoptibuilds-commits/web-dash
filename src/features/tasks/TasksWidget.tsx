import { ArrowUpRight, ListTodo } from 'lucide-react'
import type { WidgetComponentProps } from '@/features/widgets/registry'
import { useUi } from '@/state/ui'
import { useTasks } from '@/hooks/data'
import { taskRepo } from '@/data/repositories'
import type { TaskItem } from '@/types/domain'
import styles from './tasks.module.css'

const MAX_ROWS = 5

/** Home widget: top open tasks with live checkboxes and an open affordance. */
export function TasksWidget({ editMode }: WidgetComponentProps) {
  const tasks = useTasks()
  const ui = useUi()

  const list = tasks ?? []
  const open = list.filter((t) => !t.done)
  const remaining = open.length
  const shown = open.slice(0, MAX_ROWS)

  function openTasks() {
    if (editMode) return
    ui.setMode('dashboard')
    ui.openApp('tasks')
  }

  async function toggle(task: TaskItem) {
    await taskRepo.setTaskDone(task.id, !task.done)
  }

  return (
    <div className={styles.widgetPanel}>
      <div className={styles.widgetHead}>
        <ListTodo size={15} aria-hidden />
        <span>Tasks</span>
      </div>

      {shown.length === 0 ? (
        <div className={styles.widgetEmpty}>
          <p>All done</p>
        </div>
      ) : (
        <ul className={styles.widgetList}>
          {shown.map((task) => (
            <li key={task.id}>
              <label className={styles.widgetRow}>
                <span className={styles.widgetCheck}>
                  <input
                    type="checkbox"
                    className={styles.widgetCheckbox}
                    checked={task.done}
                    onChange={() => toggle(task)}
                    aria-label={task.text}
                  />
                </span>
                <span className={styles.widgetRowText}>{task.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className={styles.widgetFooter} onClick={openTasks}>
        <span className={styles.widgetFootLabel}>
          {remaining === 0 ? 'No open tasks' : `${remaining} open`}
        </span>
        <span className={styles.widgetFootAction}>
          Open Tasks
          <ArrowUpRight size={13} aria-hidden />
        </span>
      </button>
    </div>
  )
}
