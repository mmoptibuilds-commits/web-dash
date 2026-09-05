import { db } from '@/data/db/db'
import type { HistoryEntry, HistoryKind } from '@/types/domain'

function entryId(kind: HistoryKind, text: string): string {
  const key = text.trim().toLowerCase().slice(0, 200)
  return `${kind}:${key}`
}

/** Record a dashboard-originated query (or URL typed) for local suggestions. */
export async function recordHistory(kind: HistoryKind, text: string, url: string | null): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return
  const id = entryId(kind, trimmed)
  const existing = await db.history.get(id)
  const t = Date.now()
  if (existing) {
    await db.history.update(id, { count: existing.count + 1, lastUsedAt: t, text: trimmed, url })
  } else {
    await db.history.put({ id, kind, text: trimmed, url, count: 1, lastUsedAt: t })
  }
}

export async function recordQuery(text: string): Promise<void> {
  return recordHistory('query', text, null)
}

export async function recordLaunch(label: string, url: string): Promise<void> {
  return recordHistory('launch', label || url, url)
}

/** Most frequent + recent entries of a kind (fuzzy suggestion source). */
export async function suggestHistory(
  kind: HistoryKind,
  prefix = '',
  limit = 6,
): Promise<HistoryEntry[]> {
  const all = await db.history.where('kind').equals(kind).toArray()
  const p = prefix.trim().toLowerCase()
  const matched = p
    ? all.filter((e) => e.text.toLowerCase().includes(p))
    : all
  return matched
    .sort((a, b) => b.count - a.count || b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit)
}

/** Keep history bounded (default: newest 100 by activity). */
export async function pruneHistory(keep = 100): Promise<void> {
  const all = await db.history.toArray()
  if (all.length <= keep) return
  const sorted = all.sort(
    (a, b) => b.lastUsedAt - a.lastUsedAt || b.count - a.count,
  )
  const drop = sorted.slice(keep).map((e) => e.id)
  await db.history.bulkDelete(drop)
}

export async function clearHistory(): Promise<void> {
  await db.history.clear()
}
