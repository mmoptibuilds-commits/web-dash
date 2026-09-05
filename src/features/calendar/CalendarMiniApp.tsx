import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DEFAULT_WEEK_START,
  type DayCell,
  type MonthView,
  addMonths,
  chunkWeeks,
  getMonthGrid,
} from './monthGrid'
import { formatDayAria, formatMonthYear, weekdayLabels } from './format'
import { useNow } from '@/hooks/useMedia'
import styles from './calendar.module.css'

function cellClassName(cell: DayCell): string {
  if (cell.isToday) return styles.cellToday
  if (cell.outside) return styles.cellOutside
  return ''
}

/**
 * Calendar — V1 month view (no events). Fills 100% of the window/sheet the
 * shell provides; no glass wrapper (that is the shell's frame).
 */
export function CalendarMiniApp() {
  const today = useNow(60_000)
  const [view, setView] = useState<MonthView>(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })

  const cells = useMemo(
    () => getMonthGrid(view.year, view.month, today, DEFAULT_WEEK_START),
    [view, today],
  )
  const weeks = useMemo(() => chunkWeeks(cells), [cells])
  const title = useMemo(() => formatMonthYear(view.year, view.month, 'long'), [view])
  const dayNames = useMemo(() => weekdayLabels(DEFAULT_WEEK_START), [])

  function goToday() {
    const n = new Date()
    setView({ year: n.getFullYear(), month: n.getMonth() })
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setView((v) => addMonths(v, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <h2 className={styles.navTitle}>{title}</h2>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setView((v) => addMonths(v, 1))}
            aria-label="Next month"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
        <button type="button" className={styles.todayBtn} onClick={goToday}>
          Today
        </button>
      </header>

      <div className={styles.cal} role="grid" aria-label={`${title} calendar`}>
        <div className={styles.weekdays} role="row" aria-hidden="true">
          {dayNames.map((name, i) => (
            <span key={name + i} className={styles.weekday} role="columnheader">
              {name}
            </span>
          ))}
        </div>
        <div className={styles.grid} role="rowgroup">
          {weeks.map((week, wi) => (
            <div className={styles.row} role="row" key={`week-${wi}`}>
              {week.map((cell) => (
                <div
                  key={cell.key}
                  className={`${styles.cell} ${cellClassName(cell)}`}
                  role="gridcell"
                  aria-label={formatDayAria(cell.year, cell.month, cell.day)}
                  aria-current={cell.isToday ? 'date' : undefined}
                >
                  {cell.day}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
