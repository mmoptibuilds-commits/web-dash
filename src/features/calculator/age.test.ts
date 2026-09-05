import { describe, expect, it } from 'vitest'
import { addMonths, ageOn, calendarDiff, parseIsoDate, toIsoDate } from './age'

describe('date utilities', () => {
  it('round-trips ISO strings through UTC-midnight Dates', () => {
    const d = parseIsoDate('2024-02-29')
    expect(toIsoDate(d)).toBe('2024-02-29')
    expect(parseIsoDate('2024-02-29').getUTCMonth()).toBe(1)
  })

  it('rejects malformed dates as NaN', () => {
    expect(Number.isNaN(parseIsoDate('2024-13-01').getTime())).toBe(true)
    expect(Number.isNaN(parseIsoDate('nope').getTime())).toBe(true)
  })

  it('adds months and clamps short months', () => {
    expect(toIsoDate(addMonths(parseIsoDate('2024-01-31'), 1))).toBe('2024-02-29')
    expect(toIsoDate(addMonths(parseIsoDate('2024-01-31'), 13))).toBe('2025-02-28')
  })
})

describe('calendarDiff', () => {
  it('is zero on a birthday', () => {
    expect(calendarDiff(parseIsoDate('2000-05-10'), parseIsoDate('2024-05-10'))).toEqual({
      years: 24,
      months: 0,
      days: 0,
    })
  })

  it('counts a month on the same day-of-month', () => {
    expect(calendarDiff(parseIsoDate('2000-01-15'), parseIsoDate('2000-02-15'))).toEqual({
      years: 0,
      months: 1,
      days: 0,
    })
  })

  it('borrows correctly across a month boundary', () => {
    // Mar 1 minus Jan 31 (non-leap): 1 month 1 day (Jan 31 → Feb 28 → Mar 1).
    expect(calendarDiff(parseIsoDate('2023-01-31'), parseIsoDate('2023-03-01'))).toEqual({
      years: 0,
      months: 1,
      days: 1,
    })
  })

  it('handles a leap-day birthday in a non-leap year', () => {
    // Feb 29 birthdays keep their nominal 29th: whole-month boundaries clamp
    // only when a target month cannot hold 29 days. 23y on 2023-02-28, then
    // whole months on the 29th through 2024-01-29, leaving 29 days to Feb 27.
    expect(calendarDiff(parseIsoDate('2000-02-29'), parseIsoDate('2024-02-27'))).toEqual({
      years: 23,
      months: 11,
      days: 29,
    })
  })

  it('does not drift a month-end birthday across a short month', () => {
    // 31-Jan → 30-Apr 2023: Feb has only 28 days, yet three whole months from
    // the 31st still land on 30-Apr (clamped) — exactly 3 months, 0 days. A
    // running anchor clamped to Feb 28 would wrongly report 3 months, 2 days.
    expect(calendarDiff(parseIsoDate('2023-01-31'), parseIsoDate('2023-04-30'))).toEqual({
      years: 0,
      months: 3,
      days: 0,
    })
  })
})

describe('ageOn', () => {
  it('returns null when the on-date precedes the birth date', () => {
    expect(ageOn('2000-05-10', '1999-12-31')).toBeNull()
  })

  it('computes a full breakdown on a birthday', () => {
    const res = ageOn('2000-05-10', '2024-05-10')!
    expect(res.years).toBe(24)
    expect(res.months).toBe(0)
    expect(res.days).toBe(0)
    // 2000..2024 spans six leap years (2000,04,08,12,16,20): 24*365 + 6.
    expect(res.totalDays).toBe(24 * 365 + 6)
    expect(res.exactYears).toBeCloseTo(24, 1)
  })

  it('reports the next birthday in the future', () => {
    const res = ageOn('2000-05-10', '2026-09-05')!
    expect(res.next).toEqual({ iso: '2027-05-10', daysUntil: 247, turns: 27 })
  })

  it('reports a birthday later the same year', () => {
    const res = ageOn('2000-12-01', '2026-09-05')!
    expect(res.next!.iso).toBe('2026-12-01')
    expect(res.next!.turns).toBe(26)
  })
})
