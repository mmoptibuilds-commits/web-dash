import { classifyInput, hostOf } from '@/lib/url'
import { buildSearchUrl } from '@/lib/search'
import type { SearchEngineId } from '@/types/domain'
import { recordAndOpen, recordAndSearch } from '@/lib/nav'

export type AddressOutcome =
  | { kind: 'url' | 'search'; target: string }
  | { kind: 'error'; reason: string }

/**
 * Decide what a typed address should do (no side effects). Used by the
 * search widget and any omnibox so behaviour stays in one place.
 */
export function planAddress(rawInput: string, engine: SearchEngineId): AddressOutcome {
  const result = classifyInput(rawInput)
  if (result.kind === 'invalid') return { kind: 'error', reason: result.reason }
  if (result.kind === 'url') return { kind: 'url', target: result.url }
  return { kind: 'search', target: buildSearchUrl(engine, result.query) }
}

/** Record history and navigate in the same tab. */
export function executeAddress(rawInput: string, engine: SearchEngineId): AddressOutcome {
  const plan = planAddress(rawInput, engine)
  if (plan.kind === 'error') return plan
  if (plan.kind === 'url') {
    recordAndOpen(hostOf(plan.target) || plan.target, plan.target)
  } else {
    recordAndSearch(rawInput, plan.target)
  }
  return plan
}
