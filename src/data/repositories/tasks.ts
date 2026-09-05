import { db } from '@/data/db/db'
import type { TaskItem } from '@/types/domain'
import { now } from '@/types/domain'
import { uid } from '@/lib/id'

export async function createTask(text: string): Promise<TaskItem> {
  const t = now()
  const task: TaskItem = {
    id: uid('task'),
    text: text.trim(),
    done: false,
    createdAt: t,
    doneAt: null,
    updatedAt: t,
  }
  await db.tasks.put(task)
  return task
}

/** Open tasks first (most recent first), then completed (most recent first). */
export async function listTasks(): Promise<TaskItem[]> {
  const tasks = await db.tasks.toArray()
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return b.createdAt - a.createdAt
  })
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  await db.tasks.update(id, { done, doneAt: done ? now() : null, updatedAt: now() })
}

export async function renameTask(id: string, text: string): Promise<void> {
  await db.tasks.update(id, { text: text.trim(), updatedAt: now() })
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id)
}

export async function clearCompleted(): Promise<void> {
  await db.tasks.where('done').equals(1).delete()
}

export async function countOpenTasks(): Promise<number> {
  return db.tasks.filter((t) => !t.done).count()
}
