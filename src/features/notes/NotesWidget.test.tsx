import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { db } from '@/data/db/db'
import { noteRepo } from '@/data/repositories'
import type { WidgetInstance } from '@/types/domain'
import { NotesWidget } from './NotesWidget'

const instance: WidgetInstance = {
  id: 'widget-1',
  type: 'notes',
  size: 'medium',
  settings: {},
  createdAt: 1,
  updatedAt: 1,
}

describe('NotesWidget', () => {
  beforeEach(async () => {
    await db.transaction('rw', db.notes, async () => {
      await db.notes.clear()
    })
  })

  it('shows an inviting empty state', async () => {
    render(<NotesWidget instance={instance} />)
    expect(await screen.findByText('No notes yet')).toBeInTheDocument()
    expect(screen.getByText('Open Notes')).toBeInTheDocument()
  })

  it('lists recent notes with a snippet, pinned first', async () => {
    const a = await noteRepo.createNote('Groceries')
    await noteRepo.updateNote(a.id, { body: 'Milk and eggs' })
    const b = await noteRepo.createNote('Meeting')
    await noteRepo.setNotePinned(b.id, true)

    render(<NotesWidget instance={instance} />)

    expect(await screen.findByText('Meeting')).toBeInTheDocument()
    // Both notes are listed (max 3).
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Milk and eggs')).toBeInTheDocument()
    expect(screen.getByText('Open Notes')).toBeInTheDocument()
  })
})
