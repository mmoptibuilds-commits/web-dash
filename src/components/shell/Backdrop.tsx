import { useEffect, useRef, useState } from 'react'
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
  const reduced = settings?.reducedEffects ?? false
  const videoRef = useRef<HTMLVideoElement>(null)

  // Respect "Reduce motion & blur": don't autoplay a wallpaper video, and if
  // the toggle flips while one is showing, stop it.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo) return
    if (reduced || document.hidden) {
      v.pause()
      return
    }
    v.play().catch(() => {
      /* autoplay may be blocked until interaction; leave paused */
    })
  }, [reduced, isVideo])

  // Pause looping wallpapers while the tab is hidden (battery/CPU courtesy).
  useEffect(() => {
    if (!isVideo || reduced) return
    const onVis = () => {
      const v = videoRef.current
      if (!v) return
      if (document.hidden) v.pause()
      else v.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [isVideo, reduced])

  let media: React.ReactNode
  if (builtin) {
    media = <div className={styles.paint} style={{ backgroundImage: builtin.css }} />
  } else if (userWall && url) {
    media = isVideo ? (
      <video
        ref={videoRef}
        className={styles.paint}
        src={url}
        autoPlay={!reduced}
        muted
        loop
        playsInline
      />
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
