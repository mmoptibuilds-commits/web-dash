import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db/db'
import { taskRepo } from '@/data/repositories'
import type { WidgetInstance } from '@/types/domain'
import { TasksWidget } from './TasksWidget'

const instance: WidgetInstance = {
  id: 'widget-1',
  type: 'tasks',
  size: 'medium',
  settings: {},
  createdAt: 1,
  updatedAt: 1,
}

function renderWidget() {
  return render(<TasksWidget instance={instance} />)
}

describe('TasksWidget', () => {
  beforeEach(async () => {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.clear()
    })
  })

  it('shows open tasks and toggles one complete', async () => {
    await taskRepo.createTask('Buy milk')
    await taskRepo.createTask('Walk dog')
    const done = await taskRepo.createTask('Old done')
    await taskRepo.setTaskDone(done.id, true)

    renderWidget()

    expect(await screen.findByRole('checkbox', { name: 'Buy milk' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Walk dog' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Old done' })).not.toBeInTheDocument()
    expect(screen.getByText('2 open')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))

    await waitFor(() => {
      expect(screen.queryByRole('checkbox', { name: 'Buy milk' })).not.toBeInTheDocument()
    })
    expect(screen.getByText('1 open')).toBeInTheDocument()
    // The completed task is still in the DB.
    const all = await taskRepo.listTasks()
    expect(all.find((t) => t.text === 'Buy milk')?.done).toBe(true)
  })

  it('shows an all-done empty state when there are no open tasks', async () => {
    const done = await taskRepo.createTask('Old done')
    await taskRepo.setTaskDone(done.id, true)

    renderWidget()
    expect(await screen.findByText('All done')).toBeInTheDocument()
    expect(screen.getByText('Open Tasks')).toBeInTheDocument()
  })
})
