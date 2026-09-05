import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db/db'
import { noteRepo } from '@/data/repositories'
import { NotesMiniApp } from './NotesMiniApp'

describe('NotesMiniApp', () => {
  beforeEach(async () => {
    await db.transaction('rw', db.notes, async () => {
      await db.notes.clear()
    })
  })

  it('creates a note from the empty state and autosaves typed content', async () => {
    const user = userEvent.setup()
    render(<NotesMiniApp />)

    // Empty state invites a first note.
    await user.click(await screen.findByRole('button', { name: 'New Note' }))

    const titleInput = await screen.findByRole('textbox', { name: 'Note title' })
    await user.type(titleInput, 'Hello note')
    await user.type(screen.getByRole('textbox', { name: 'Note body' }), 'Body text')

    // Debounced autosave (~500ms) persists title + body through noteRepo.
    await waitFor(
      async () => {
        const notes = await noteRepo.listNotes()
        expect(notes).toHaveLength(1)
        expect(notes[0]?.title).toBe('Hello note')
        expect(notes[0]?.body).toBe('Body text')
      },
      { timeout: 2500 },
    )
  })
})
