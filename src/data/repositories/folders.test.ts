import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/db/db'
import { createFolder, updateFolderAppearance } from './folders'

describe('folder customization', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('persists the chosen emoji and tint when creating and editing a folder', async () => {
    const folder = await createFolder('Work', { emoji: '🧰', bg: '#334155' })
    expect(folder.icon.emoji).toBe('🧰')
    expect(folder.bg).toBe('#334155')

    await updateFolderAppearance(folder.id, { emoji: '📚', bg: null })
    expect(await db.folders.get(folder.id)).toMatchObject({ icon: { type: 'emoji', emoji: '📚' }, bg: null })
  })
})
