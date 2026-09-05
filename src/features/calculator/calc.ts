/**
 * Basic calculator engine — pure, immediate-execution chaining (left to
 * right, no precedence, like a handheld / iOS calculator: 2 + 3 × 4 = 20).
 *
 * The engine owns no React state: a plain reducer over `CalcState` drives
 * both the mini-app and the Home widget, so every behaviour below is unit
 * tested in `calc.test.ts` and identical on both surfaces.
 *
 * Model
 * -----
 * - `entry` is the number currently being edited / displayed, as a raw
 *   string (digits, optional leading '-', optional trailing '.').
 * - Pressing an operator with nothing pending stores the entry as `acc` and
 *   arms `pending`; pressing another operator then *replaces* it (12 + × →
 *   just ×). Once a second operand is typed, an operator or `=` applies the
 *   pending operation first, so chains evaluate left to right.
 * - `fresh` is true right after an operator or `=` — the next digit starts a
 *   new operand instead of appending to the shown number.
 * - `%` is contextual: with a pending +/− it computes the *percent of acc*
 *   (100 + 10 % = 110); otherwise it divides the current entry by 100.
 * - Division by zero yields the sentinel entry "Error". Any digit starts over;
 *   operators/`=` are no-ops until then.
 */

export const ERROR = 'Error'

export type CalcOp = '+' | '−' | '×' | '÷'

export interface CalcState {
  /** The number being edited, as a raw string ('0' when idle). */
  entry: string
  /** Accumulated left operand waiting on `pending`, or null at rest. */
  acc: number | null
  /** Operator armed but not yet applied. */
  pending: CalcOp | null
  /** True after an operator/equals: the next digit starts a new number. */
  fresh: boolean
}

export type CalcAction =
  | { type: 'digit'; digit: string }
  | { type: 'dot' }
  | { type: 'sign' }
  | { type: 'op'; op: CalcOp }
  | { type: 'equals' }
  | { type: 'percent' }
  | { type: 'clear' }
  | { type: 'backspace' }

export function initCalc(): CalcState {
  return { entry: '0', acc: null, pending: null, fresh: false }
}

/** Cap on how many digits the user may type (excludes '-' and '.'). */
const MAX_TYPED_DIGITS = 15

function parseEntry(entry: string): number {
  if (entry === ERROR) return 0
  const n = Number.parseFloat(entry)
  return Number.isFinite(n) ? n : 0
}

function apply(a: number, b: number, op: CalcOp): number {
  switch (op) {
    case '+':
      return a + b
    case '−':
      return a - b
    case '×':
      return a * b
    case '÷':
      return b === 0 ? Infinity : a / b
  }
}

/**
 * Render a number without floating-point noise. Precision is capped at 12
 * significant digits; very large/small magnitudes fall back to exponential
 * notation. Never returns scientific/Infinity/NaN text — those map to "Error".
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return ERROR
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e15 || abs < 1e-9) return trimExponent(n.toExponential(8))
  const rounded = Number(n.toPrecision(12))
  // Number#toString emits plain decimal for |x| ≥ 1e-6 (already exponent-cased
  // below that) and up to 1e21, which covers every non-exponent magnitude here.
  const s = String(rounded)
  return s.includes('e') ? trimExponent(s) : trimZeros(s)
}

function trimZeros(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/\.?0+$/, '')
}

function trimExponent(s: string): string {
  return s.replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e')
}

const isDigit = (c: string) => c.length === 1 && c >= '0' && c <= '9'

function digitCountOf(entry: string): number {
  let count = 0
  for (const c of entry) if (c >= '0' && c <= '9') count++
  return count
}

export function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'clear':
      return initCalc()

    case 'digit': {
      if (!isDigit(action.digit)) return state
      if (state.entry === ERROR) return calcReducer(initCalc(), action)
      if (state.fresh) return { ...state, entry: action.digit, fresh: false }
      // Leading-zero handling: 0 then 5 → 5; -0 then 5 → -5.
      if (state.entry === '0') return { ...state, entry: action.digit }
      if (state.entry === '-0') return { ...state, entry: `-${action.digit}` }
      if (digitCountOf(state.entry) >= MAX_TYPED_DIGITS) return state
      return { ...state, entry: state.entry + action.digit }
    }

    case 'dot': {
      if (state.entry === ERROR) return calcReducer(initCalc(), { type: 'dot' })
      if (state.fresh) return { ...state, entry: '0.', fresh: false }
      if (state.entry.includes('.')) return state
      if (state.entry === '') return state
      return { ...state, entry: `${state.entry}.` }
    }

    case 'sign': {
      if (state.entry === ERROR || state.entry === '0') return state
      const neg = state.entry.startsWith('-')
      return { ...state, entry: neg ? state.entry.slice(1) : `-${state.entry}` }
    }

    case 'op': {
      if (state.entry === ERROR) return state
      // An operator right after another just changes the pending operator
      // (12 + × → ×), rather than applying the first twice.
      if (state.acc !== null && state.pending !== null && state.fresh) {
        return { ...state, pending: action.op }
      }
      if (state.acc === null) {
        return {
          entry: formatNumber(parseEntry(state.entry)),
          acc: parseEntry(state.entry),
          pending: action.op,
          fresh: true,
        }
      }
      const next = apply(state.acc, parseEntry(state.entry), state.pending ?? action.op)
      return {
        entry: formatNumber(next),
        acc: next,
        pending: action.op,
        fresh: true,
      }
    }

    case 'equals': {
      if (state.entry === ERROR) return state
      if (state.acc === null || state.pending === null) {
        // Nothing pending: a lone = just means "start fresh on next digit".
        return { ...state, fresh: true }
      }
      const result = apply(state.acc, parseEntry(state.entry), state.pending)
      if (!Number.isFinite(result)) {
        return { entry: ERROR, acc: null, pending: null, fresh: true }
      }
      return { entry: formatNumber(result), acc: null, pending: null, fresh: true }
    }

    case 'percent': {
      if (state.entry === ERROR) return state
      const v = parseEntry(state.entry)
      // Contextual: 100 + 10 % means "10% of 100" → 10, so = yields 110.
      if (
        (state.pending === '+' || state.pending === '−') &&
        state.acc !== null
      ) {
        return { ...state, entry: formatNumber((state.acc * v) / 100) }
      }
      return { ...state, entry: formatNumber(v / 100) }
    }

    case 'backspace': {
      if (state.entry === ERROR) return initCalc()
      if (state.fresh) return state // a result has nothing to erase
      const next = state.entry.slice(0, -1)
      if (next === '' || next === '-') return { ...state, entry: '0' }
      return { ...state, entry: next }
    }
  }
}
