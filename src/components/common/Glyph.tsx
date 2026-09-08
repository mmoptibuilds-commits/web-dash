import { useState } from 'react'
import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import type { ShortcutIcon } from '@/types/domain'
import { faviconUrlFor } from '@/lib/url'
import styles from './Glyph.module.css'

/** Shared presentation for Hearth-owned app symbols. Parent controls supply the accessible name. */
export function SystemGlyph({
  icon: Icon,
  label,
  size = 44,
}: {
  icon: ComponentType<LucideProps>
  label: string
  size?: number
}) {
  return (
    <span
      className={styles.appSurface}
      data-icon-family="system"
      data-icon-shape="squircle"
      data-icon-treatment="material"
      data-app-artwork={label.toLowerCase()}
      aria-hidden
      title={label}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={1.8} />
    </span>
  )
}

function Monogram({ label }: { label: string }) {
  return (
    <span
      className={`${styles.surface} ${styles.mono}`}
      data-testid="shortcut-monogram"
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
      <span
        className={`${styles.surface} ${styles.emoji}`}
        data-testid="shortcut-glyph-surface"
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
