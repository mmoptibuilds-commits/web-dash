/**
 * Age / date mathematics — pure functions over calendar dates, independent of
 * React and of the local timezone (all arithmetic runs on UTC-midnight Dates).
 *
 * UI code hands these functions `YYYY-MM-DD` strings straight from
 * `<input type="date">`; every function returns plain data so the age logic is
 * fully unit-tested in `age.test.ts`.
 *
 * Age is reported as whole calendar years/months/days using the "anchor"
 * method (step whole years from the birth date, then whole months, then the
 * remaining days), with month lengths clamped so e.g. a 29-Feb birthday lands
 * on 28-Feb in a non-leap year.
 */

export interface AgeParts {
  years: number
  months: number
  days: number
}

export interface AgeResult extends AgeParts {
  /** Exact total days between the dates. */
  totalDays: number
  /** Total days ÷ 365.2425 — the "24.7 years" figure. */
  exactYears: number
  /** Next birthday info, or null when the birth date is in the future. */
  next: { iso: string; daysUntil: number; turns: number } | null
}

/** Parse a `YYYY-MM-DD` string as a UTC-midnight Date (no timezone drift). */
export function parseIsoDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return new Date(NaN)
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return new Date(NaN)
  return new Date(Date.UTC(year, month - 1, day))
}

/** Format a Date back to `YYYY-MM-DD` (its UTC calendar fields). */
export function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's local date as `YYYY-MM-DD` (for the default "on this date"). */
export function todayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Days in a month; `month` is 1–12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Add a whole number of months, clamping the day to the target month. */
export function addMonths(date: Date, months: number): Date {
  const total = date.getUTCMonth() + months
  const year = date.getUTCFullYear() + Math.floor(total / 12)
  const month = ((total % 12) + 12) % 12
  const day = Math.min(date.getUTCDate(), daysInMonth(year, month + 1))
  return new Date(Date.UTC(year, month, day))
}

/** Whole-year/whole-month/remaining-day difference; requires birth ≤ on. */
export function calendarDiff(birth: Date, on: Date): AgeParts {
  let years = on.getUTCFullYear() - birth.getUTCFullYear()
  let anchor = addMonths(birth, years * 12)
  while (anchor > on && years > 0) {
    years -= 1
    anchor = addMonths(birth, years * 12)
  }
  // Whole months are measured from the *original* birthday day-of-month: each
  // candidate clamps afresh, so crossing a short month must not shift a running
  // anchor to the clamped day. A 31-Jan birthday toward 30-Apr (Feb 2023 has 28
  // days) is exactly 3 whole months — clamping Jan 31 + 3 months lands on Apr
  // 30 — not 3 months + 2 days measured from a drifted 28th.
  let months = 0
  for (let i = 0; i < 13; i++) {
    const next = addMonths(birth, years * 12 + (months + 1))
    if (next > on) break
    months += 1
  }
  const dayAnchor = addMonths(birth, years * 12 + months)
  const days = Math.round((on.getTime() - dayAnchor.getTime()) / 86_400_000)
  return { years, months, days }
}

const MS_PER_DAY = 86_400_000

/** Full age breakdown. Returns null when the "on" date precedes the birth. */
export function ageOn(birthIso: string, onIso: string): AgeResult | null {
  const birth = parseIsoDate(birthIso)
  const on = parseIsoDate(onIso)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(on.getTime()) || on < birth) {
    return null
  }
  const { years, months, days } = calendarDiff(birth, on)
  const totalDays = Math.round((on.getTime() - birth.getTime()) / MS_PER_DAY)
  return {
    years,
    months,
    days,
    totalDays,
    exactYears: totalDays / 365.2425,
    next: nextBirthday(birth, on),
  }
}

/** Anniversary for a target year, clamping 29-Feb to 28-Feb when needed. */
function anniversaryIn(birth: Date, year: number): Date {
  const month = birth.getUTCMonth()
  const day = Math.min(birth.getUTCDate(), daysInMonth(year, month + 1))
  return new Date(Date.UTC(year, month, day))
}

function nextBirthday(birth: Date, on: Date): { iso: string; daysUntil: number; turns: number } | null {
  let candidate = anniversaryIn(birth, on.getUTCFullYear())
  if (candidate <= on) candidate = anniversaryIn(birth, on.getUTCFullYear() + 1)
  return {
    iso: toIsoDate(candidate),
    daysUntil: Math.round((candidate.getTime() - on.getTime()) / MS_PER_DAY),
    turns: candidate.getUTCFullYear() - birth.getUTCFullYear(),
  }
}
