import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WEEK_START,
  addMonths,
  chunkWeeks,
  daysInMonth,
  getMonthGrid,
  isSameDay,
  leadingOffset,
} from './monthGrid'

describe('calendar month-grid math', () => {
  describe('daysInMonth / leadingOffset', () => {
    it('knows leap vs common Februaries', () => {
      expect(daysInMonth(2026, 1)).toBe(28)
      expect(daysInMonth(2024, 1)).toBe(29)
    })

    it('computes Monday-first leading offsets', () => {
      // 2026-09-01 is a Tuesday -> one blank (Monday) before it.
      expect(leadingOffset(2026, 8, 1)).toBe(1)
      // 2026-02-01 is a Sunday -> six blanks on a Monday-first grid.
      expect(leadingOffset(2026, 1, 1)).toBe(6)
      // 2024-09-01 is a Sunday too.
      expect(leadingOffset(2024, 8, 1)).toBe(6)
    })
  })

  describe('getMonthGrid', () => {
    it('pads September 2026 to whole Monday-first weeks', () => {
      const grid = getMonthGrid(2026, 8, new Date(2026, 8, 5), DEFAULT_WEEK_START)
      expect(grid).toHaveLength(35) // 1 + 30 days + 4 trailing = 5 weeks

      // First cell is the muted last day of August (Monday).
      expect(grid[0]).toMatchObject({ year: 2026, month: 7, day: 31, outside: true })
      expect(grid[0].date.getDay()).toBe(1) // Monday
      // Current month runs from the second cell through day 30.
      expect(grid[1]).toMatchObject({ year: 2026, month: 8, day: 1, outside: false })
      expect(grid.filter((c) => !c.outside)).toHaveLength(30)
      // Trailing muted days belong to October.
      expect(grid[34]).toMatchObject({ year: 2026, month: 9, day: 4, outside: true })
    })

    it('marks today exactly once and only for the matching date', () => {
      const grid = getMonthGrid(2026, 8, new Date(2026, 8, 5), DEFAULT_WEEK_START)
      const todays = grid.filter((c) => c.isToday)
      expect(todays).toHaveLength(1)
      expect(todays[0]).toMatchObject({ key: '2026-09-05', day: 5, month: 8, outside: false })
    })

    it('starts weeks on the requested weekday', () => {
      const sun = getMonthGrid(2026, 8, new Date(2026, 8, 1), 0)
      expect(sun[0].date.getDay()).toBe(0) // Sunday start
      const mon = getMonthGrid(2026, 8, new Date(2026, 8, 1), 1)
      expect(mon[0].date.getDay()).toBe(1)
    })

    it('keeps each cell one day apart and keys increment in ISO order', () => {
      const grid = getMonthGrid(2026, 11, new Date(2026, 11, 25), DEFAULT_WEEK_START)
      for (let i = 1; i < grid.length; i++) {
        const prev = grid[i - 1].date
        const cur = grid[i].date
        const diff = (cur.getTime() - prev.getTime()) / 86_400_000
        expect(diff).toBe(1)
      }
      const keys = grid.map((c) => c.key)
      expect([...keys].sort()).toEqual(keys)
    })
  })

  describe('addMonths / isSameDay / chunkWeeks', () => {
    it('wraps across year boundaries', () => {
      expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
      expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
    })

    it('compares calendar days, ignoring the time of day', () => {
      expect(isSameDay(new Date(2026, 8, 5, 23, 59), new Date(2026, 8, 5, 0, 0))).toBe(true)
      expect(isSameDay(new Date(2026, 8, 5), new Date(2026, 8, 6))).toBe(false)
    })

    it('chunks a flat grid into whole weeks', () => {
      const rows = chunkWeeks(getMonthGrid(2026, 8, new Date(2026, 8, 5), 1))
      expect(rows).toHaveLength(5)
      for (const row of rows) expect(row).toHaveLength(7)
    })
  })
})
