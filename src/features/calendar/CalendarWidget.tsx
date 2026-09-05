import { useMemo } from 'react'
import type { WidgetComponentProps } from '@/features/widgets/registry'
import { DEFAULT_WEEK_START, daysInMonth, leadingOffset } from './monthGrid'
import { formatMonthYear, weekdayLabels } from './format'
import { useNow } from '@/hooks/useMedia'
import styles from './calendar.module.css'

/**
 * Calendar widget — the current month at a glance. Display-only: no
 * navigation, no tap affordances beyond a passive "today" ring.
 */
export function CalendarWidget(_props: WidgetComponentProps) {
  const today = useNow(60_000)
  const year = today.getFullYear()
  const month = today.getMonth()

  const title = useMemo(() => formatMonthYear(year, month, 'short'), [year, month])
  const dayNames = useMemo(() => weekdayLabels(DEFAULT_WEEK_START), [])
  const lead = leadingOffset(year, month, DEFAULT_WEEK_START)
  const dim = daysInMonth(year, month)
  const todayDay = today.getDate()

  return (
    <div className={styles.panel}>
      <div className={styles.wTitle}>{title}</div>
      <div className={styles.wWeekdays} aria-hidden="true">
        {dayNames.map((name, i) => (
          <span key={name + i} className={styles.wWeekday}>
            {name}
          </span>
        ))}
      </div>
      <div className={styles.wGrid}>
        {Array.from({ length: lead }, (_, i) => (
          <span key={`blank-${i}`} className={styles.wDay} aria-hidden="true" />
        ))}
        {Array.from({ length: dim }, (_, i) => {
          const day = i + 1
          const isToday = day === todayDay
          return (
            <span
              key={day}
              className={`${styles.wDay} ${isToday ? styles.wToday : ''}`}
              aria-current={isToday ? 'date' : undefined}
            >
              {day}
            </span>
          )
        })}
      </div>
    </div>
  )
}
