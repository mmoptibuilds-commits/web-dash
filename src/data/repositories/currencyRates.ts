import { db } from '@/data/db/db'
import { CURRENCY_RATES_ID, defaultCurrencyRates } from '@/data/defaults'
import type { CurrencyRates } from '@/types/domain'

/**
 * Calculator currency rates (offline, user-editable, single row).
 *
 * Rates are a code-shipped baseline until the user edits them in the
 * Calculator. This repository is safe to call from `useLiveQuery`: `get` only
 * reads — when no row exists yet (e.g. a v2 install upgraded to v3) it returns
 * a transient copy of the baseline default. The row is persisted on the first
 * manual Save (writes happen from event handlers, never inside a live query),
 * stamped with `editedAt` so the UI can say "manual rates". Never fetched from
 * the network — local-first.
 */
export async function getCurrencyRates(): Promise<CurrencyRates> {
  const existing = await db.currencyRates.get(CURRENCY_RATES_ID)
  return existing ?? defaultCurrencyRates()
}

/** Persist a user-edited rates table (always a manual edit → stamps editedAt). */
export async function saveCurrencyRates(rates: Record<string, number>): Promise<CurrencyRates> {
  const current = await getCurrencyRates()
  const stamped = Date.now()
  const next: CurrencyRates = {
    ...current,
    rates,
    editedAt: stamped,
    updatedAt: stamped,
  }
  await db.currencyRates.put(next)
  return next
}

/** Restore the shipped baseline (used by the Calculator's "Reset rates"). */
export async function resetCurrencyRates(): Promise<CurrencyRates> {
  const fresh = defaultCurrencyRates()
  await db.currencyRates.put(fresh)
  return fresh
}
