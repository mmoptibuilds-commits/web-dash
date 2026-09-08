import { db } from '@/data/db/db'
import type { Folder } from '@/types/domain'
import { now } from '@/types/domain'
import { uid } from '@/lib/id'

export async function createFolder(
  name: string,
  appearance: { emoji?: string; bg?: string | null } = {},
): Promise<Folder> {
  const t = now()
  const folder: Folder = {
    id: uid('folder'),
    name: name.trim().slice(0, 40) || 'Folder',
    shortcutIds: [],
    icon: { type: 'emoji', emoji: appearance.emoji?.slice(0, 8) || '📁' },
    bg: appearance.bg ?? null,
    createdAt: t,
    updatedAt: t,
  }
  await db.folders.put(folder)
  return folder
}

export async function updateFolderAppearance(
  id: string,
  appearance: { emoji: string; bg: string | null },
): Promise<void> {
  await db.folders.update(id, {
    icon: { type: 'emoji', emoji: appearance.emoji.slice(0, 8) || '📁' },
    bg: appearance.bg,
    updatedAt: now(),
  })
}

export async function listFolders(): Promise<Folder[]> {
  return db.folders.toArray()
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await db.folders.update(id, { name: name.trim().slice(0, 40) || 'Folder', updatedAt: now() })
}

export async function addShortcutToFolder(folderId: string, shortcutId: string): Promise<void> {
  const folder = await db.folders.get(folderId)
  if (!folder) return
  if (folder.shortcutIds.includes(shortcutId)) return
  await db.folders.update(folderId, {
    shortcutIds: [...folder.shortcutIds, shortcutId],
    updatedAt: now(),
  })
}

export async function removeShortcutFromFolder(
  folderId: string,
  shortcutId: string,
): Promise<void> {
  const folder = await db.folders.get(folderId)
  if (!folder) return
  await db.folders.update(folderId, {
    shortcutIds: folder.shortcutIds.filter((s) => s !== shortcutId),
    updatedAt: now(),
  })
}

/** Delete a folder plus any home-page layout items that referenced it. */
export async function deleteFolderCascade(folderId: string): Promise<void> {
  await db.transaction('rw', db.folders, db.layoutItems, async () => {
    const items = await db.layoutItems.where('refId').equals(folderId).toArray()
    await db.layoutItems.bulkDelete(items.map((i) => i.id))
    await db.folders.delete(folderId)
  })
}
