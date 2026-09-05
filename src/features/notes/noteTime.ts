/**
 * Timestamp formatting for the Notes feature.
 * Relative times for list rows; a fuller absolute stamp for the editor.
 */

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

const absoluteTime = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const absoluteWithYear = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

/** Compact "Edited …" style relative time; older dates fall back to absolute. */
export function formatRelativeTime(ts: number, base: number = Date.now()): string {
  const diff = ts - base
  const abs = Math.abs(diff)
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000
  if (abs < minute) return 'just now'
  if (abs < hour) return relative.format(Math.round(diff / minute), 'minute')
  if (abs < day) return relative.format(Math.round(diff / hour), 'hour')
  if (abs < 7 * day) return relative.format(Math.round(diff / day), 'day')
  return absoluteWithYear.format(new Date(ts))
}

/** Absolute local time, with the year when it is not the current one. */
export function formatAbsoluteTime(ts: number): string {
  const date = new Date(ts)
  if (date.getFullYear() !== new Date().getFullYear()) {
    return absoluteWithYear.format(date)
  }
  return absoluteTime.format(date)
}
