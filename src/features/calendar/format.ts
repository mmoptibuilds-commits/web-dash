import { DEFAULT_WEEK_START } from './monthGrid'

const MONTH_LONG = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const MONTH_SHORT = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' })
const WEEKDAY_SHORT = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const DAY_ARIA = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export type MonthStyle = 'long' | 'short'

/** e.g. "September 2026" (long) or "Sep 2026" (short). */
export function formatMonthYear(year: number, month: number, style: MonthStyle = 'long'): string {
  const fmt = style === 'short' ? MONTH_SHORT : MONTH_LONG
  return fmt.format(new Date(year, month, 1))
}

/**
 * Weekday column headers in display order. Hearth renders Monday-first, so
 * `weekdayLabels(1)` returns ["Mon", "Tue", …, "Sun"].
 */
export function weekdayLabels(weekStart: number = DEFAULT_WEEK_START): string[] {
  // 2023-01-01 was a Sunday, so adding `jsDay` yields a date whose getDay() === jsDay.
  return Array.from({ length: 7 }, (_, col) => {
    const jsDay = (col + weekStart) % 7
    return WEEKDAY_SHORT.format(new Date(2023, 0, 1 + jsDay))
  })
}

/** Accessible label for one day cell, e.g. "Saturday, September 5, 2026". */
export function formatDayAria(year: number, month: number, day: number): string {
  return DAY_ARIA.format(new Date(year, month, day))
}
