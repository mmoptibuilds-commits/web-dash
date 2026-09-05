import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/db/db'
import { taskRepo } from '@/data/repositories'

describe('tasks repository', () => {
  beforeEach(async () => {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.clear()
    })
  })

  it('creates tasks and lists open tasks before completed ones', async () => {
    const milk = await taskRepo.createTask('Buy milk')
    const dog = await taskRepo.createTask('Walk dog')

    let tasks = await taskRepo.listTasks()
    expect(tasks).toHaveLength(2)
    // Both open: newest first (dog was created after milk).
    expect(tasks[0].id).toBe(dog.id)
    expect(tasks[1].id).toBe(milk.id)

    await taskRepo.setTaskDone(milk.id, true)
    tasks = await taskRepo.listTasks()
    expect(tasks[0].id).toBe(dog.id)
    expect(tasks[0].done).toBe(false)
    expect(tasks[1].id).toBe(milk.id)
    expect(tasks[1].done).toBe(true)
    expect(tasks[1].doneAt).not.toBeNull()
  })

  it('renames a task with trimmed text', async () => {
    const task = await taskRepo.createTask('Old')
    await taskRepo.renameTask(task.id, '  New name  ')
    const found = (await taskRepo.listTasks()).find((t) => t.id === task.id)
    expect(found?.text).toBe('New name')
  })

  it('deletes a single task', async () => {
    const task = await taskRepo.createTask('doomed')
    expect(await taskRepo.listTasks()).toHaveLength(1)
    await taskRepo.deleteTask(task.id)
    expect(await taskRepo.listTasks()).toHaveLength(0)
  })

  it('counts open tasks', async () => {
    const keep = await taskRepo.createTask('Keep this')
    const done = await taskRepo.createTask('Remove me')
    await taskRepo.setTaskDone(done.id, true)

    expect(await taskRepo.countOpenTasks()).toBe(1)

    // Clearing = deleting the completed rows (done individually), as the
    // mini-app does while taskRepo.clearCompleted() awaits a coordinator fix.
    await taskRepo.deleteTask(done.id)
    const remaining = await taskRepo.listTasks()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(keep.id)
  })
})
