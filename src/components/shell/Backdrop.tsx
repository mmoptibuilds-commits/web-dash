import { useEffect, useState } from 'react'
import { useSettings, useWallpapers } from '@/hooks/data'
import { getBuiltinWallpaper } from '@/lib/wallpapers'
import type { Wallpaper } from '@/types/domain'
import styles from './backdrop.module.css'

/** Stable object URL for a user wallpaper row, revoked on change/unmount. */
function useObjectURL(wallpaper: Wallpaper | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    // Create/refresh the URL just past the current paint. The revocable URL
    // lifecycle requires the cleanup, so state is settled asynchronously to
    // avoid a cascade render within the effect's own commit.
    let created: string | null = null
    const raf = requestAnimationFrame(() => {
      if (!wallpaper) {
        setUrl(null)
        return
      }
      created = URL.createObjectURL(wallpaper.blob)
      setUrl(created)
    })
    return () => {
      cancelAnimationFrame(raf)
      if (created) URL.revokeObjectURL(created)
    }
  }, [wallpaper])
  return url
}

/** Full-viewport wallpaper layer. Renders builtin gradients or user media. */
export function Backdrop() {
  const settings = useSettings()
  const wallpapers = useWallpapers()
  const ref = settings?.wallpaper

  const builtin = ref?.kind === 'builtin' ? getBuiltinWallpaper(ref.id) : undefined
  const userWall =
    ref?.kind === 'user' ? wallpapers?.find((w) => w.id === ref.wallpaperId) : undefined
  const url = useObjectURL(userWall)
  const isVideo =
    userWall != null &&
    (userWall.kind === 'video' || (userWall.kind === 'animated' && userWall.mime.startsWith('video')))

  let media: React.ReactNode
  if (builtin) {
    media = <div className={styles.paint} style={{ backgroundImage: builtin.css }} />
  } else if (userWall && url) {
    media = isVideo ? (
      <video className={styles.paint} src={url} autoPlay muted loop playsInline />
    ) : (
      <img className={styles.paint} src={url} alt="" draggable={false} />
    )
  } else {
    // Pre-seed / loading fallback so the stage is never blank.
    media = (
      <div
        className={styles.paint}
        style={{
          backgroundImage:
            'radial-gradient(140% 120% at 50% -10%, #151924 0%, #0d0f16 52%, #08090e 100%)',
        }}
      />
    )
  }

  return (
    <div className={styles.backdrop} aria-hidden="true">
      {media}
      <div className={styles.vignette} />
    </div>
  )
}
