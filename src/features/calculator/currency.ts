/**
 * Currency conversion mathematics — pure functions only. The stored rate
 * tables (see data/repositories/currencyRates.ts) are USD-anchored: each
 * value is units of that code per 1 USD, so any pair converts as
 * `amount × rate(to) / rate(from)`. Live feeds are out of scope (local-first),
 * so this module is intentionally small and fully unit-tested.
 */

/** Convert `amount` in `from`-units into `to`-units via the anchor. */
export function convert(amount: number, fromRate: number, toRate: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(toRate) || !(fromRate > 0)) return NaN
  return (amount * toRate) / fromRate
}

/** Human names for the code-shipped baseline rates (fallback: the code). */
export const CURRENCY_CODE_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  KRW: 'South Korean Won',
  BRL: 'Brazilian Real',
  SGD: 'Singapore Dollar',
}

export function currencyName(code: string): string {
  return CURRENCY_CODE_NAMES[code] ?? code
}

function groupThousands(int: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatFixed(abs: number, decimals: number): string {
  const scaled = Math.round((abs + Number.EPSILON) * 10 ** decimals) / 10 ** decimals
  const [int, frac] = scaled.toFixed(decimals).split('.')
  const clean = frac ? frac.replace(/0+$/, '') : ''
  return clean ? `${groupThousands(int)}.${clean}` : groupThousands(int)
}

/**
 * Render a money amount with thousands separators and up to 4 decimals.
 * Very large magnitudes fall back to exponential form rather than overflow.
 */
export function formatAmount(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '0'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 1e15) {
    const exp = abs.toExponential(4).replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e')
    return `${sign}${exp}`
  }
  return `${sign}${formatFixed(abs, 4)}`
}

/** Render a "1 USD = …" cross rate with up to 6 significant decimals. */
export function formatCrossRate(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '0'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs < 1e-5) return `${sign}${abs.toExponential(3).replace(/\.?0+e/, 'e')}`
  return `${sign}${formatFixed(abs, 6)}`
}
