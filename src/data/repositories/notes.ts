import { db } from '@/data/db/db'
import type { Note } from '@/types/domain'
import { now } from '@/types/domain'
import { uid } from '@/lib/id'

export async function createNote(title = ''): Promise<Note> {
  const t = now()
  const note: Note = {
    id: uid('note'),
    title,
    body: '',
    pinned: false,
    createdAt: t,
    updatedAt: t,
  }
  await db.notes.put(note)
  return note
}

/** Notes sorted pinned-first, then most-recently-updated. */
export async function listNotes(): Promise<Note[]> {
  const notes = await db.notes.toArray()
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt - a.updatedAt
  })
}

/** Autosave body/title, bumping updatedAt only when content actually changes. */
export async function updateNote(
  id: string,
  changes: Partial<Pick<Note, 'title' | 'body' | 'pinned'>>,
): Promise<void> {
  const existing = await db.notes.get(id)
  if (!existing) return
  await db.notes.update(id, { ...changes, updatedAt: now() })
}

export async function setNotePinned(id: string, pinned: boolean): Promise<void> {
  await db.notes.update(id, { pinned, updatedAt: now() })
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id)
}

/** Case-insensitive substring search across title + body. */
export async function searchNotes(query: string): Promise<Note[]> {
  const q = query.trim().toLowerCase()
  if (!q) return listNotes()
  const notes = await listNotes()
  return notes.filter(
    (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
  )
}
