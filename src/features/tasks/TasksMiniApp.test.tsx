import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db/db'
import { TasksMiniApp } from './TasksMiniApp'

describe('TasksMiniApp', () => {
  beforeEach(async () => {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.clear()
    })
  })

  it('starts with an inviting empty state', async () => {
    render(<TasksMiniApp />)
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument()
    expect(screen.getByText('All done')).toBeInTheDocument()
  })

  it('adds, completes, then clears a task', async () => {
    const user = userEvent.setup()
    render(<TasksMiniApp />)

    // Add a task.
    const input = screen.getByRole('textbox', { name: 'New task text' })
    await user.type(input, 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add task' }))

    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText(/1 open/)).toBeInTheDocument()

    // Toggle it done.
    const checkbox = await screen.findByRole('checkbox', { name: /mark .*buy milk.*as done/i })
    await user.click(checkbox)
    // Footer flips to "All done" and "Clear completed" appears.
    await waitFor(() => {
      expect(screen.getByText('All done')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear completed/i })).toBeInTheDocument()
    })

    // "Clear completed" removes the completed task.
    await user.click(screen.getByRole('button', { name: /clear completed/i }))
    await waitFor(() => {
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    })
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })
})
