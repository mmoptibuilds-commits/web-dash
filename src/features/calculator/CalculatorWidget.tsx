import { ArrowUpRight, Calculator } from 'lucide-react'
import type { WidgetComponentProps } from '@/features/widgets/registry'
import { launchApp } from '@/state/nav'
import { BasicCalc } from './BasicCalc'
import styles from './calculator.module.css'

/**
 * Home widget — a compact arithmetic keypad for quick sums that opens the full
 * Calculator (Basic / Dates / Currency) in a window or sheet.
 */
export function CalculatorWidget({ editMode }: WidgetComponentProps) {
  function openCalculator() {
    if (editMode) return
    launchApp('calculator')
  }

  return (
    <div className={styles.widget} data-testid="calculator-widget">
      <div className={styles.widgetHead}>
        <Calculator size={15} aria-hidden />
        <span>Calculator</span>
      </div>

      <BasicCalc variant="widget" />

      <button type="button" className={styles.widgetFooter} onClick={openCalculator}>
        Open Calculator
        <ArrowUpRight size={13} aria-hidden />
      </button>
    </div>
  )
}
