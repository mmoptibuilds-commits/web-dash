import { db } from '@/data/db/db'
import type { Folder } from '@/types/domain'
import { now } from '@/types/domain'
import { uid } from '@/lib/id'

export async function createFolder(name: string): Promise<Folder> {
  const t = now()
  const folder: Folder = {
    id: uid('folder'),
    name: name.trim().slice(0, 40) || 'Folder',
    shortcutIds: [],
    icon: { type: 'emoji', emoji: '📁' },
    bg: null,
    createdAt: t,
    updatedAt: t,
  }
  await db.folders.put(folder)
  return folder
}

export async function listFolders(): Promise<Folder[]> {
  return db.folders.toArray()
}

export async function getFolder(id: string): Promise<Folder | undefined> {
  return db.folders.get(id)
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await db.folders.update(id, { name: name.trim().slice(0, 40) || 'Folder', updatedAt: now() })
}

export async function setFolderIcon(id: string, emoji: string): Promise<void> {
  await db.folders.update(id, { icon: { type: 'emoji', emoji: emoji || '📁' }, updatedAt: now() })
}

export async function setFolderBg(id: string, bg: string | null): Promise<void> {
  await db.folders.update(id, { bg, updatedAt: now() })
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

/** Reorder folder members to exactly `orderedIds` (must be same set). */
export async function reorderFolderShortcuts(
  folderId: string,
  orderedIds: string[],
): Promise<void> {
  const folder = await db.folders.get(folderId)
  if (!folder) return
  const set = new Set(folder.shortcutIds)
  const next = orderedIds.filter((id) => set.has(id))
  for (const id of folder.shortcutIds) if (!next.includes(id)) next.push(id)
  await db.folders.update(folderId, { shortcutIds: next, updatedAt: now() })
}

/** Delete a folder plus any home-page layout items that referenced it. */
export async function deleteFolderCascade(folderId: string): Promise<void> {
  await db.transaction('rw', db.folders, db.layoutItems, async () => {
    const items = await db.layoutItems.where('refId').equals(folderId).toArray()
    await db.layoutItems.bulkDelete(items.map((i) => i.id))
    await db.folders.delete(folderId)
  })
}
