import { db } from '@/data/db/db'
import type { Shortcut, ShortcutIcon } from '@/types/domain'
import { now } from '@/types/domain'
import { uid } from '@/lib/id'
import { isSafeUrl, normalizeHttpUrl } from '@/lib/url'

export type NewShortcutInput = {
  label: string
  url: string
  icon?: ShortcutIcon
  bg?: string | null
}

export type CreateShortcutResult =
  | { ok: true; shortcut: Shortcut }
  | { ok: false; reason: string }

const MAX_LABEL = 80

function validateUrl(rawUrl: string): { ok: true; url: string } | { ok: false; reason: string } {
  const trimmed = rawUrl.trim()
  if (!trimmed) return { ok: false, reason: 'Enter a web address.' }
  // normalizeHttpUrl throws on inputs the URL parser rejects (e.g. embedded
  // control chars); surface that as a friendly message, not a rejected promise.
  let normalized: string
  try {
    normalized = normalizeHttpUrl(trimmed)
  } catch {
    return { ok: false, reason: 'That does not look like a valid web address.' }
  }
  if (!isSafeUrl(normalized)) {
    return { ok: false, reason: 'Only safe http(s) addresses are allowed.' }
  }
  return { ok: true, url: normalized }
}

/** Create a shortcut after normalizing + validating the URL. */
export async function createShortcut(input: NewShortcutInput): Promise<CreateShortcutResult> {
  const check = validateUrl(input.url)
  if (!check.ok) return { ok: false, reason: check.reason }

  const label = (input.label.trim() || '').slice(0, MAX_LABEL)
  const fallbackLabel = hostFrom(check.url)
  const t = now()
  const shortcut: Shortcut = {
    id: uid('sc'),
    label: label || fallbackLabel,
    url: check.url,
    icon: input.icon ?? { type: 'auto' },
    bg: input.bg ?? null,
    createdAt: t,
    updatedAt: t,
  }
  await db.shortcuts.put(shortcut)
  return { ok: true, shortcut }
}

function hostFrom(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export async function updateShortcut(
  id: string,
  changes: Partial<Omit<Shortcut, 'id' | 'createdAt'>>,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const existing = await db.shortcuts.get(id)
  if (!existing) return { ok: false, reason: 'Shortcut not found.' }

  if (changes.url !== undefined && changes.url !== existing.url) {
    const check = validateUrl(changes.url)
    if (!check.ok) return { ok: false, reason: check.reason }
    changes = { ...changes, url: check.url }
  }

  if (changes.label !== undefined && changes.label.trim() === '') {
    changes = { ...changes, label: hostFrom(existing.url) }
  }

  await db.shortcuts.update(id, { ...changes, updatedAt: now() })
  return { ok: true }
}

export async function deleteShortcut(id: string): Promise<void> {
  await db.transaction('rw', db.shortcuts, db.folders, db.layoutItems, db.dockItems, async () => {
    // Drop references from folders, home layouts and the dock.
    const folders = await db.folders.toArray()
    await Promise.all(
      folders
        .filter((f) => f.shortcutIds.includes(id))
        .map((f) => db.folders.update(f.id, { shortcutIds: f.shortcutIds.filter((s) => s !== id) })),
    )
    const items = await db.layoutItems.where('refId').equals(id).toArray()
    await db.layoutItems.bulkDelete(items.map((i) => i.id))
    const docked = await db.dockItems.where('shortcutId').equals(id).toArray()
    await db.dockItems.bulkDelete(docked.map((d) => d.id))
    await db.shortcuts.delete(id)
  })
}

export async function listShortcuts(): Promise<Shortcut[]> {
  return db.shortcuts.toArray()
}
