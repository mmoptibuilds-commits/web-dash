/**
 * Pure calendar month-grid math (no React, no Intl).
 *
 * The grid always renders whole weeks: the muted days of the previous month
 * that lead in, and the muted days of the following month that trail out, so
 * the layout stays a stable rectangle while navigating between months.
 *
 * Months are 0-indexed (as in `Date`): January = 0.
 * `weekStart` follows `Date#getDay()`: 0 = Sunday, 1 = Monday, … 6 = Saturday.
 * Hearth renders Monday-first (`DEFAULT_WEEK_START = 1`).
 */

export const DEFAULT_WEEK_START = 1

export interface MonthView {
  year: number
  /** 0-indexed month (0 = January). */
  month: number
}

export interface DayCell {
  /** Local midnight `Date` for the day (year/month/day are the source of truth). */
  date: Date
  year: number
  /** 0-indexed month of the cell — differs from the view month when `outside`. */
  month: number
  /** Day of month, 1–31. */
  day: number
  /** True when the cell belongs to an adjacent month (muted filler). */
  outside: boolean
  isToday: boolean
  /** Stable sortable key: `YYYY-MM-DD`. */
  key: string
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function keyOf(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Number of blank cells before day 1, given the week-start convention. */
export function leadingOffset(year: number, month: number, weekStart = DEFAULT_WEEK_START): number {
  return (new Date(year, month, 1).getDay() - weekStart + 7) % 7
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Advance/rewind a view month, wrapping across year boundaries. */
export function addMonths(view: MonthView, delta: number): MonthView {
  const d = new Date(view.year, view.month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

/** Build the flat day cells for a month view, padded out to whole weeks. */
export function getMonthGrid(
  year: number,
  month: number,
  today: Date = new Date(),
  weekStart = DEFAULT_WEEK_START,
): DayCell[] {
  const lead = leadingOffset(year, month, weekStart)
  const count = Math.ceil((lead + daysInMonth(year, month)) / 7) * 7
  const firstVisible = new Date(year, month, 1 - lead)

  const cells: DayCell[] = []
  for (let i = 0; i < count; i++) {
    const date = new Date(firstVisible.getFullYear(), firstVisible.getMonth(), firstVisible.getDate() + i)
    const outside = date.getFullYear() !== year || date.getMonth() !== month
    cells.push({
      date,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      outside,
      isToday: isSameDay(date, today),
      key: keyOf(date.getFullYear(), date.getMonth(), date.getDate()),
    })
  }
  return cells
}

/** Split a flat grid into whole-week rows. */
export function chunkWeeks<T>(cells: readonly T[], size = 7): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < cells.length; i += size) {
    rows.push(cells.slice(i, i + size))
  }
  return rows
}
