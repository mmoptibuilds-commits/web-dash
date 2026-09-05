/** Stable unique id generator. Prefers crypto.randomUUID; falls back to a
 * random hex id when crypto is unavailable (non-secure contexts). */

function fallbackUid(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && 'getRandomValues' in c) {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  // Last-resort: Math.random is not cryptographically strong but only used
  // when the platform provides nothing better.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function uid(prefix?: string): string {
  let id = ''
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    id = crypto.randomUUID()
  } else {
    id = fallbackUid()
  }
  return prefix ? `${prefix}-${id}` : id
}
