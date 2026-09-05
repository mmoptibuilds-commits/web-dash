import { useState } from 'react'
import { ArrowLeftRight, CalendarDays, Calculator } from 'lucide-react'
import { BasicCalc } from './BasicCalc'
import { DatePanel } from './DatePanel'
import { CurrencyMode } from './CurrencyMode'
import styles from './calculator.module.css'

type Mode = 'basic' | 'date' | 'currency'

const MODES: Array<{ id: Mode; label: string; icon: typeof Calculator }> = [
  { id: 'basic', label: 'Basic', icon: Calculator },
  { id: 'date', label: 'Dates', icon: CalendarDays },
  { id: 'currency', label: 'Currency', icon: ArrowLeftRight },
]

/**
 * Calculator mini-app — a three-mode window/sheet surface: a Basic arithmetic
 * calculator, an Age/Dates breakdown, and an offline Currency converter with a
 * local (user-editable) rate table. Panels stay mounted so switching tabs
 * never loses the in-progress calculation.
 */
export function CalculatorMiniApp() {
  const [mode, setMode] = useState<Mode>('basic')

  return (
    <div className={styles.app} data-testid="calculator-mini-app">
      <div className={styles.tabs} role="group" aria-label="Calculator mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`${styles.tab} ${mode === m.id ? styles.tabActive : ''}`}
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
          >
            <m.icon size={15} className={styles.tabIcon} aria-hidden />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.body}>
        <div className={styles.pane} hidden={mode !== 'basic'}>
          <BasicCalc variant="app" />
        </div>
        <div className={styles.pane} hidden={mode !== 'date'}>
          <DatePanel />
        </div>
        <div className={styles.pane} hidden={mode !== 'currency'}>
          <CurrencyMode />
        </div>
      </div>
    </div>
  )
}
