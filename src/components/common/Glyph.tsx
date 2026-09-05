import { useState } from 'react'
import type { ShortcutIcon } from '@/types/domain'
import { faviconUrlFor } from '@/lib/url'
import styles from './Glyph.module.css'

/** Deterministic two-tone hue for letter monograms. */
export function hueFor(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) % 360
  return h
}

function Monogram({ label }: { label: string }) {
  const h = hueFor(label || '?')
  return (
    <span
      className={`${styles.surface} ${styles.mono}`}
      data-testid="shortcut-monogram"
      style={{
        backgroundImage: `linear-gradient(145deg, hsl(${h} 58% 46%), hsl(${(h + 38) % 360} 60% 34%))`,
      }}
      aria-hidden
    >
      {(label || '?').slice(0, 1).toUpperCase()}
    </span>
  )
}

/**
 * Renders a shortcut's chosen icon: emoji, uploaded image, or a best-effort
 * favicon that falls back to a letter monogram when it can't load.
 */
export function ShortcutGlyph({
  icon,
  label,
  url,
}: {
  icon: ShortcutIcon
  label: string
  url?: string
}) {
  if (icon.type === 'emoji') {
    const h = hueFor(icon.emoji)
    return (
      <span
        className={`${styles.surface} ${styles.emoji}`}
        data-testid="shortcut-glyph-surface"
        style={{
          backgroundImage: `linear-gradient(145deg, hsl(${h} 54% 56%), hsl(${(h + 38) % 360} 58% 38%))`,
        }}
        aria-hidden
      >
        {icon.emoji}
      </span>
    )
  }
  if (icon.type === 'upload') {
    return (
      <span className={styles.surface} data-testid="shortcut-glyph-surface" aria-hidden>
        <img className={`${styles.img} ${styles.uploaded}`} src={icon.dataUrl} alt="" />
      </span>
    )
  }
  // auto — favicon with monogram fallback
  if (url) {
    const src = faviconUrlFor(url)
    if (src) return <Favicon src={src} label={label} />
  }
  return <Monogram label={label} />
}

function Favicon({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <Monogram label={label} />
  return (
    <span className={styles.surface} data-testid="shortcut-glyph-surface" aria-hidden>
      <img
        className={`${styles.img} ${styles.favicon}`}
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </span>
  )
}
