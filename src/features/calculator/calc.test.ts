import { describe, expect, it } from 'vitest'
import {
  calcReducer,
  formatNumber,
  initCalc,
  type CalcAction,
  type CalcState,
} from './calc'

/** Apply a script of actions and return the resulting state. */
function run(actions: CalcAction[]): CalcState {
  return actions.reduce(calcReducer, initCalc())
}

const digit = (d: string): CalcAction => ({ type: 'digit', digit: d })
const op = (o: '+' | '−' | '×' | '÷'): CalcAction => ({ type: 'op', op: o })

describe('formatNumber', () => {
  it('strips floating-point noise', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3')
    expect(formatNumber(0.1 * 3)).toBe('0.3')
    expect(formatNumber(1 / 3)).toBe('0.333333333333') // 12 significant digits
  })

  it('formats whole numbers and negative zero cleanly', () => {
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(-0)).toBe('0')
    expect(formatNumber(-42)).toBe('-42')
  })

  it('maps non-finite to Error', () => {
    expect(formatNumber(Infinity)).toBe('Error')
    expect(formatNumber(NaN)).toBe('Error')
  })

  it('rounds oversized and tiny magnitudes to exponential form', () => {
    expect(formatNumber(1e16)).toMatch(/e/)
    expect(formatNumber(1e-10)).toMatch(/e/)
  })
})

describe('typing', () => {
  it('starts from 0 and appends digits', () => {
    expect(run([digit('4'), digit('2')]).entry).toBe('42')
  })

  it('swallows redundant leading zeros', () => {
    expect(run([digit('0'), digit('0'), digit('7')]).entry).toBe('7')
  })

  it('keeps one leading minus', () => {
    expect(run([digit('0'), digit('5'), { type: 'sign' }, digit('5')]).entry).toBe('-55')
  })

  it('enters a decimal point and keeps typing it idempotent', () => {
    const s = run([digit('3'), { type: 'dot' }, digit('1'), { type: 'dot' }, digit('4')])
    expect(s.entry).toBe('3.14')
  })

  it('lets a digit start fresh after an equals result', () => {
    const s = run([digit('2'), digit('0'), op('+'), digit('2'), { type: 'equals' }, digit('9')])
    expect(s.entry).toBe('9')
  })

  it('backspaces characters and never empties the entry', () => {
    expect(run([digit('1'), digit('2'), digit('3'), { type: 'backspace' }]).entry).toBe('12')
    expect(run([digit('1'), { type: 'backspace' }]).entry).toBe('0')
  })

  it('caps typed digits', () => {
    const actions: CalcAction[] = Array.from({ length: 30 }, () => digit('9'))
    expect(run(actions).entry).toBe('999999999999999') // 15 nines
  })
})

describe('arithmetic', () => {
  it('adds 2 + 2', () => {
    const s = run([digit('2'), op('+'), digit('2'), { type: 'equals' }])
    expect(s.entry).toBe('4')
    expect(s.acc).toBeNull()
    expect(s.pending).toBeNull()
  })

  it('chains left to right: 2 + 3 × 4 = 20', () => {
    expect(run([digit('2'), op('+'), digit('3'), op('×'), digit('4'), { type: 'equals' }]).entry).toBe(
      '20',
    )
  })

  it('subtracts and handles negatives', () => {
    expect(run([digit('9'), op('−'), digit('1'), digit('4'), { type: 'equals' }]).entry).toBe('-5')
  })

  it('divides', () => {
    expect(run([digit('8'), op('÷'), digit('2'), { type: 'equals' }]).entry).toBe('4')
  })

  it('continues from an equals result when chaining operators', () => {
    const s = run([
      digit('2'),
      op('+'),
      digit('3'),
      { type: 'equals' }, // 5
      op('×'),
      digit('6'),
      { type: 'equals' },
    ])
    expect(s.entry).toBe('30')
  })

  it('replaces the pending operator instead of double-applying', () => {
    const s = run([digit('1'), digit('2'), op('+'), op('×'), digit('3'), { type: 'equals' }])
    expect(s.entry).toBe('36') // 12 × 3
  })

  it('reports Error on division by zero and recovers on the next digit', () => {
    const s = run([digit('5'), op('÷'), digit('0'), { type: 'equals' }])
    expect(s.entry).toBe('Error')
    const recovered = calcReducer(s, digit('7'))
    expect(recovered.entry).toBe('7')
    expect(recovered.acc).toBeNull()
  })

  it('ignores operators while in Error state', () => {
    const s = run([digit('5'), op('÷'), digit('0'), { type: 'equals' }])
    const still = calcReducer(s, op('+'))
    expect(still.entry).toBe('Error')
  })
})

describe('percent', () => {
  it('halves a bare 50', () => {
    expect(run([digit('5'), digit('0'), { type: 'percent' }, { type: 'equals' }]).entry).toBe('0.5')
  })

  it('computes percent-of-acc for addition: 100 + 10% = 110', () => {
    const mid = run([digit('1'), digit('0'), digit('0'), op('+'), digit('1'), digit('0'), { type: 'percent' }])
    expect(mid.entry).toBe('10') // shows the percent amount…
    expect(run([digit('1'), digit('0'), digit('0'), op('+'), digit('1'), digit('0'), { type: 'percent' }, { type: 'equals' }]).entry).toBe('110')
  })

  it('applies percent-of-acc for subtraction: 200 − 25% = 150', () => {
    expect(
      run([digit('2'), digit('0'), digit('0'), op('−'), digit('2'), digit('5'), { type: 'percent' }, { type: 'equals' }])
        .entry,
    ).toBe('150')
  })

  it('uses plain ÷100 for multiplication: 200 × 10% = 20', () => {
    expect(
      run([digit('2'), digit('0'), digit('0'), op('×'), digit('1'), digit('0'), { type: 'percent' }, { type: 'equals' }])
        .entry,
    ).toBe('20')
  })
})
