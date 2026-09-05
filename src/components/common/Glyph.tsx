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
      className={styles.mono}
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
    return (
      <span className={styles.emoji} aria-hidden>
        {icon.emoji}
      </span>
    )
  }
  if (icon.type === 'upload') {
    return <img className={styles.img} src={icon.dataUrl} alt="" aria-hidden />
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
    <img
      className={styles.img}
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
