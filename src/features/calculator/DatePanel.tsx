import { useState } from 'react'
import { Cake, PartyPopper } from 'lucide-react'
import { ageOn, todayIso } from './age'
import styles from './calculator.module.css'

/** Format a YYYY-MM-DD iso as "May 10, 2027" (UTC calendar fields). */
function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Age & dates mode — whole years/months/days between a birth date and an
 * "on this date" (defaults to today), plus total days, exact years and the
 * next birthday countdown. All arithmetic is pure (`age.ts`); this component
 * is thin UI over it.
 */
export function DatePanel() {
  const [birth, setBirth] = useState('')
  const [on, setOn] = useState(() => todayIso())

  const result = birth ? ageOn(birth, on) : null

  return (
    <div className={styles.dateBody}>
      <div className={styles.dateFields}>
        <label className={styles.dateField}>
          <span className={styles.dateLabel}>Birth date</span>
          <input
            type="date"
            className={styles.dateInput}
            value={birth}
            aria-label="Birth date"
            onChange={(ev) => setBirth(ev.target.value)}
          />
        </label>
        <label className={styles.dateField}>
          <span className={styles.dateLabel}>On this date</span>
          <input
            type="date"
            className={styles.dateInput}
            value={on}
            aria-label="Age on date"
            onChange={(ev) => setOn(ev.target.value || todayIso())}
          />
        </label>
      </div>

      {!birth ? (
        <div className={styles.emptyHint}>
          Pick a birth date to see the age breakdown.
        </div>
      ) : result === null ? (
        <div className={styles.emptyHint}>
          The “on” date is before the birth date — pick a later one.
        </div>
      ) : (
        <div className={styles.ageSummary}>
          <div className={styles.ageBig} data-testid="age-breakdown">
            {result.years}{' '}
            <span className={styles.ageUnit}>{result.years === 1 ? 'year' : 'years'}</span>
            {', '}
            {result.months}{' '}
            <span className={styles.ageUnit}>{result.months === 1 ? 'month' : 'months'}</span>
            {', '}
            {result.days}{' '}
            <span className={styles.ageUnit}>{result.days === 1 ? 'day' : 'days'}</span>
          </div>

          <div className={styles.ageStats}>
            <div className={styles.ageStat}>
              <span className={styles.ageStatValue}>{result.totalDays.toLocaleString()}</span>
              <span className={styles.ageStatLabel}>total days</span>
            </div>
            <div className={styles.ageStat}>
              <span className={styles.ageStatValue}>{result.exactYears.toFixed(2)}</span>
              <span className={styles.ageStatLabel}>exact years</span>
            </div>
          </div>

          {result.next && (
            <div className={styles.birthdayCard}>
              <PartyPopper size={16} className={styles.birthdayIcon} aria-hidden />
              <span className={styles.birthdayText}>
                Next birthday {prettyDate(result.next.iso)} — turns {result.next.turns} in{' '}
                {result.next.daysUntil} {result.next.daysUntil === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={styles.dateNote}>
          <Cake size={14} aria-hidden />
          <span>Calculated locally from calendar dates.</span>
        </div>
      )}
    </div>
  )
}
