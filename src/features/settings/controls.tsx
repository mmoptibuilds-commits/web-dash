import type { ReactNode } from 'react'
import styles from './settings.module.css'

export interface ChoiceOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

/** A titled section in the settings column. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  )
}

/**
 * A labelled group of pill choices. Rendered as a stacked field (title above,
 * chips below) so it stays readable at narrow sheet widths.
 */
export function ChoiceSetting<T extends string>({
  title,
  description,
  value,
  options,
  onChange,
}: {
  title: string
  description?: string
  value: T
  options: ReadonlyArray<ChoiceOption<T>>
  onChange: (value: T) => void
}) {
  return (
    <div className={styles.settingBlock}>
      <div className={styles.settingText}>
        <span className={styles.settingTitle}>{title}</span>
        {description ? <span className={styles.settingDesc}>{description}</span> : null}
      </div>
      <div className={styles.chipRow} role="radiogroup" aria-label={title}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              onClick={() => onChange(option.value)}
            >
              {option.icon ? (
                <span className={styles.chipIcon} aria-hidden>
                  {option.icon}
                </span>
              ) : null}
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A single labelled row with a switch on the right. */
export function ToggleSetting({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.settingText}>
        <span className={styles.settingTitle}>{title}</span>
        {description ? <span className={styles.settingDesc}>{description}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={checked ? `${styles.switch} ${styles.switchOn}` : styles.switch}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.knob} aria-hidden />
      </button>
    </div>
  )
}

/** The Simple / Advanced mode segmented control near the top. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? `${styles.segOption} ${styles.segActive}` : styles.segOption}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
