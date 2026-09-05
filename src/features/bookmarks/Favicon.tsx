import { useState } from 'react'
import { faviconUrlFor } from '@/lib/url'
import styles from './bookmarks.module.css'

interface FaviconProps {
  url: string
  label: string
  size?: number
}

/**
 * A shortcut's favicon with a graceful letter-monogram fallback when the
 * favicon service can't be reached or the host is unparseable.
 */
export function Favicon({ url, label, size = 20 }: FaviconProps) {
  const src = faviconUrlFor(url)
  // Track which src failed so a changed URL automatically re-arms the image.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = src !== '' && failedSrc === src

  const letter = (label.trim().charAt(0) || '?').toUpperCase()
  const dim = { width: size, height: size }

  if (!src || failed) {
    return (
      <span className={styles.fav} style={dim} aria-hidden="true">
        <span className={styles.favMono} style={{ fontSize: Math.max(10, size * 0.52) }}>
          {letter}
        </span>
      </span>
    )
  }

  return (
    <span className={styles.fav} style={dim} aria-hidden="true">
      <img
        className={styles.favImg}
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
      />
    </span>
  )
}
