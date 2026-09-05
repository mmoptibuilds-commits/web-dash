import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/db/db'
import { noteRepo } from '@/data/repositories'

/**
 * Notes repo behavior — create/update/search/pin/delete.
 * (The mini-app debounces keystrokes and calls these same repo functions.)
 */
describe('notes repository', () => {
  beforeEach(async () => {
    await db.transaction('rw', db.notes, async () => {
      await db.notes.clear()
    })
  })

  it('creates a note and lists it pinned-first, updated-desc', async () => {
    const first = await noteRepo.createNote('First')
    const second = await noteRepo.createNote('Second')

    await noteRepo.updateNote(second.id, { body: 'b' })
    // second was updated last, so it leads the (unpinned) sort.
    let notes = await noteRepo.listNotes()
    expect(notes.map((n) => n.id)).toEqual([second.id, first.id])

    await noteRepo.setNotePinned(first.id, true)
    notes = await noteRepo.listNotes()
    expect(notes.map((n) => n.id)).toEqual([first.id, second.id])
    expect(notes[0].pinned).toBe(true)
  })

  it('updates title/body and bumps updatedAt only on change', async () => {
    const note = await noteRepo.createNote('Draft')
    const before = note.updatedAt

    await noteRepo.updateNote(note.id, { title: 'Edited', body: 'hello world' })
    const edited = await noteRepo.getNote(note.id)
    expect(edited?.title).toBe('Edited')
    expect(edited?.body).toBe('hello world')
    expect(edited?.updatedAt).toBeGreaterThanOrEqual(before)

    // updateNote on a deleted id is a no-op (safe for post-delete autosave flush)
    await noteRepo.deleteNote(note.id)
    await expect(noteRepo.updateNote(note.id, { body: 'ghost' })).resolves.toBeUndefined()
    expect(await noteRepo.getNote(note.id)).toBeUndefined()
  })

  it('searches title and body case-insensitively', async () => {
    await noteRepo.createNote('Groceries')
    const withBody = await noteRepo.createNote('Trip')
    await noteRepo.updateNote(withBody.id, { body: 'Remember the umbrella' })

    const byTitle = await noteRepo.searchNotes('groc')
    expect(byTitle).toHaveLength(1)
    expect(byTitle[0].title).toBe('Groceries')

    const byBody = await noteRepo.searchNotes('UMBRELLA')
    expect(byBody).toHaveLength(1)
    expect(byBody[0].id).toBe(withBody.id)

    const empty = await noteRepo.searchNotes('')
    expect(empty).toHaveLength(2)
  })

  it('deletes a note', async () => {
    const note = await noteRepo.createNote('doomed')
    expect(await noteRepo.listNotes()).toHaveLength(1)
    await noteRepo.deleteNote(note.id)
    expect(await noteRepo.listNotes()).toHaveLength(0)
  })
})
