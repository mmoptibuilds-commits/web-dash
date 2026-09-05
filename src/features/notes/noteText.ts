/**
 * Small display helpers shared by the Notes mini-app and widget.
 * Pure text shaping — no data access, no React.
 */

/** Human label for a note's title, falling back when the user left it blank. */
export function noteTitle(title: string): string {
  const t = title.trim()
  return t.length > 0 ? t : 'Untitled'
}

/** One-line preview of a note body (first non-empty line). */
export function noteSnippet(body: string): string {
  const line = body
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  return line ?? ''
}
