import type { Shortcut } from '@/types/domain'

/** Stable display order for the links manager + widget (alphabetical). */
export function sortShortcuts(list: Shortcut[]): Shortcut[] {
  return [...list].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base', numeric: true }),
  )
}

/** Client-side filter over label + URL. */
export function filterShortcuts(list: Shortcut[], query: string): Shortcut[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (s) => s.label.toLowerCase().includes(q) || s.url.toLowerCase().includes(q),
  )
}

/** Folder display names per shortcut id: { [shortcutId]: name[] }. */
export function folderNamesByShortcut(
  shortcuts: Shortcut[],
  folders: Array<{ name: string; shortcutIds: string[] }>,
): Map<string, string[]> {
  const map = new Map<string, string[]>()
  const ids = new Set(shortcuts.map((s) => s.id))
  for (const folder of folders) {
    for (const shortcutId of folder.shortcutIds) {
      if (!ids.has(shortcutId)) continue
      const existing = map.get(shortcutId)
      if (existing) existing.push(folder.name)
      else map.set(shortcutId, [folder.name])
    }
  }
  return map
}
