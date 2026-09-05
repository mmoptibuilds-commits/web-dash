import { useReducer } from 'react'
import {
  calcReducer,
  formatNumber,
  initCalc,
  type CalcAction,
} from './calc'
import styles from './calculator.module.css'

interface KeyDef {
  text: string
  name: string
  tone: 'num' | 'util' | 'op'
  action: CalcAction
}

const KEYS: KeyDef[][] = [
  [
    { text: 'AC', name: 'All clear', tone: 'util', action: { type: 'clear' } },
    { text: '±', name: 'Plus minus', tone: 'util', action: { type: 'sign' } },
    { text: '%', name: 'Percent', tone: 'util', action: { type: 'percent' } },
    { text: '÷', name: 'Divide', tone: 'op', action: { type: 'op', op: '÷' } },
  ],
  [
    { text: '7', name: '7', tone: 'num', action: { type: 'digit', digit: '7' } },
    { text: '8', name: '8', tone: 'num', action: { type: 'digit', digit: '8' } },
    { text: '9', name: '9', tone: 'num', action: { type: 'digit', digit: '9' } },
    { text: '×', name: 'Multiply', tone: 'op', action: { type: 'op', op: '×' } },
  ],
  [
    { text: '4', name: '4', tone: 'num', action: { type: 'digit', digit: '4' } },
    { text: '5', name: '5', tone: 'num', action: { type: 'digit', digit: '5' } },
    { text: '6', name: '6', tone: 'num', action: { type: 'digit', digit: '6' } },
    { text: '−', name: 'Subtract', tone: 'op', action: { type: 'op', op: '−' } },
  ],
  [
    { text: '1', name: '1', tone: 'num', action: { type: 'digit', digit: '1' } },
    { text: '2', name: '2', tone: 'num', action: { type: 'digit', digit: '2' } },
    { text: '3', name: '3', tone: 'num', action: { type: 'digit', digit: '3' } },
    { text: '+', name: 'Add', tone: 'op', action: { type: 'op', op: '+' } },
  ],
  [
    { text: '0', name: '0', tone: 'num', action: { type: 'digit', digit: '0' } },
    { text: '.', name: 'Decimal point', tone: 'num', action: { type: 'dot' } },
    { text: '⌫', name: 'Backspace', tone: 'util', action: { type: 'backspace' } },
    { text: '=', name: 'Equals', tone: 'op', action: { type: 'equals' } },
  ],
]

function groupThousands(int: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Render the raw entry string with thousands separators and a real minus. */
export function displayEntry(entry: string): string {
  if (entry === 'Error') return 'Error'
  const neg = entry.startsWith('-')
  const body = neg ? entry.slice(1) : entry
  const [int, frac] = body.split('.')
  const grouped = groupThousands(int)
  return `${neg ? '−' : ''}${grouped}${frac !== undefined ? `.${frac}` : ''}`
}

export interface BasicCalcProps {
  /** 'app' inside the Calculator window/sheet; 'widget' inside a Home tile. */
  variant?: 'app' | 'widget'
}

/** Shared arithmetic surface (display + keypad) for the app and the widget. */
export function BasicCalc({ variant = 'app' }: BasicCalcProps) {
  const [state, dispatch] = useReducer(calcReducer, undefined, initCalc)

  const expr =
    state.pending !== null && state.acc !== null
      ? `${displayEntry(formatNumber(state.acc))} ${state.pending}`
      : ''

  const rootClass =
    variant === 'widget' ? `${styles.calc} ${styles.calcWidget}` : styles.calc

  return (
    <div className={rootClass}>
      <div className={styles.display}>
        <div className={styles.expr} aria-hidden="true">
          {expr}
        </div>
        <output className={styles.entry} data-testid="calc-display">
          {displayEntry(state.entry)}
        </output>
      </div>
      <div className={styles.keypad} role="group" aria-label="Keypad">
        {KEYS.flat().map((key, i) => {
          const toneClass =
            key.tone === 'op'
              ? styles.keyOp
              : key.tone === 'util'
                ? styles.keyUtil
                : styles.keyNum
          return (
            <button
              key={`${key.name}-${i}`}
              type="button"
              className={`${styles.key} ${toneClass}`}
              aria-label={key.name}
              onClick={() => dispatch(key.action)}
            >
              {key.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
