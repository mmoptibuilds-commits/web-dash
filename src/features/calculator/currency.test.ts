import { describe, expect, it } from 'vitest'
import { convert, formatAmount, formatCrossRate } from './currency'

describe('convert', () => {
  it('converts between two currencies via the USD anchor', () => {
    // 100 USD → EUR (EUR 0.92 per USD).
    expect(convert(100, 1, 0.92)).toBeCloseTo(92, 10)
    // 100 EUR → USD.
    expect(convert(100, 0.92, 1)).toBeCloseTo(108.69565, 4)
    // 50 GBP → EUR (GBP 0.79, EUR 0.92 per USD).
    expect(convert(50, 0.79, 0.92)).toBeCloseTo(58.2278481, 6)
  })

  it('returns NaN for a zero or missing source rate', () => {
    expect(Number.isNaN(convert(10, 0, 1))).toBe(true)
    expect(Number.isNaN(convert(10, 1, NaN))).toBe(true)
  })
})

describe('formatAmount', () => {
  it('groups thousands and trims trailing zeros', () => {
    expect(formatAmount(1234.5)).toBe('1,234.5')
    expect(formatAmount(2)).toBe('2')
    expect(formatAmount(0.1)).toBe('0.1')
    expect(formatAmount(0)).toBe('0')
  })

  it('rounds to four decimals', () => {
    expect(formatAmount(1.23456)).toBe('1.2346')
    expect(formatAmount(-1.23456)).toBe('-1.2346')
  })

  it('falls back to exponential for huge magnitudes', () => {
    expect(formatAmount(1e20)).toMatch(/e\+/)
  })
})

describe('formatCrossRate', () => {
  it('shows meaningful precision for small cross rates', () => {
    expect(formatCrossRate(0.92)).toBe('0.92')
    expect(formatCrossRate(0.0009234)).toBe('0.000923')
    expect(formatCrossRate(1)).toBe('1')
  })

  it('uses exponential for extremely small rates', () => {
    expect(formatCrossRate(1e-7)).toMatch(/e-/)
  })
})
