import type { WidgetComponentProps } from '../registry'
import styles from './builtins.module.css'
import { useNow } from '@/hooks/useMedia'

const TIME = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})
const DATE = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export function ClockWidget(_props: WidgetComponentProps) {
  const now = useNow(15_000)
  return (
    <div className={styles.clock} role="timer" aria-label={`${TIME.format(now)}, ${DATE.format(now)}`}>
      <span className={styles.clockTime}>{TIME.format(now)}</span>
      <span className={styles.clockDate}>{DATE.format(now)}</span>
    </div>
  )
}
