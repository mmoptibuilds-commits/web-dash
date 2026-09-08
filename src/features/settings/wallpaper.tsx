import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Check, ImagePlus, Trash2 } from 'lucide-react'
import styles from './settings.module.css'
import { BUILTIN_WALLPAPERS } from '@/lib/wallpapers'
import type { Wallpaper, WallpaperRef } from '@/types/domain'
import { wallpaperRepo } from '@/data/repositories'
import { useWallpapers } from '@/hooks/data'
import { DEFAULT_WALLPAPER } from '@/data/defaults'

/**
 * Small preview for one uploaded wallpaper. The object URL is created once on
 * mount (Blob → URL) and revoked when this thumbnail unmounts / changes.
 */
function WallpaperThumb({ wallpaper }: { wallpaper: Wallpaper }) {
  const [url] = useState<string>(() => URL.createObjectURL(wallpaper.blob))

  useEffect(() => {
    return () => URL.revokeObjectURL(url)
  }, [url])

  return wallpaper.kind === 'video' ? (
    <video src={url} muted playsInline preload="metadata" />
  ) : (
    <img src={url} alt="" />
  )
}

export function WallpaperSection({
  wallpaper,
  onChange,
}: {
  wallpaper: WallpaperRef
  onChange: (ref: WallpaperRef) => void
}) {
  const wallpapers = useWallpapers()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const check = wallpaperRepo.checkMediaFile(file)
      if (!check.ok) {
        setError(check.reason)
        return
      }
      const added = await wallpaperRepo.addWallpaperMedia(file)
      onChange({ kind: 'user', wallpaperId: added.id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  async function removeWallpaper(wall: Wallpaper) {
    setError(null)
    try {
      await wallpaperRepo.deleteWallpaper(wall.id)
      if (wallpaper.kind === 'user' && wallpaper.wallpaperId === wall.id) {
        onChange(DEFAULT_WALLPAPER)
      }
    } catch {
      setError('Could not remove that wallpaper.')
    }
  }

  return (
    <>
      <div className={styles.settingBlock}>
        <div className={styles.settingText}>
          <span className={styles.settingTitle}>Built-in wallpapers</span>
          <span className={styles.settingDesc}>Gradient presets shipped with mmoptibuilds.</span>
        </div>
        <div className={styles.swatchGrid} role="radiogroup" aria-label="Built-in wallpapers">
          {BUILTIN_WALLPAPERS.map((builtin) => {
            const active = wallpaper.kind === 'builtin' && wallpaper.id === builtin.id
            return (
              <button
                key={builtin.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${builtin.name} wallpaper`}
                className={active ? `${styles.swatch} ${styles.swatchActive}` : styles.swatch}
                style={{ background: builtin.css }}
                onClick={() => onChange({ kind: 'builtin', id: builtin.id })}
              >
                {active ? (
                  <span className={styles.swatchCheck} aria-hidden>
                    <Check size={13} />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.settingBlock}>
        <div className={styles.settingText}>
          <span className={styles.settingTitle}>Upload your own</span>
          <span className={styles.settingDesc}>
            Image or short video stored locally on this device. PNG / JPG / WebP up to 15 MB,
            GIF up to 20 MB, MP4 / WebM / OGG up to 50 MB.
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          className={styles.hiddenInput}
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/ogg"
          tabIndex={-1}
          aria-hidden
          onChange={handleFile}
        />
        <div className={styles.uploadRow}>
          <button
            type="button"
            className={styles.uploadBtn}
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <ImagePlus size={16} aria-hidden />
            <span>{busy ? 'Adding…' : 'Upload image or video'}</span>
          </button>
        </div>
        {error ? (
          <p className={styles.errorText} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className={styles.settingBlock}>
        <div className={styles.settingText}>
          <span className={styles.settingTitle}>Uploaded wallpapers</span>
        </div>
        {!wallpapers || wallpapers.length === 0 ? (
          <p className={styles.emptyHint}>Nothing uploaded yet.</p>
        ) : (
          <ul className={styles.uploadedList}>
            {wallpapers.map((wall) => {
              const active = wallpaper.kind === 'user' && wallpaper.wallpaperId === wall.id
              return (
                <li key={wall.id}>
                  <button
                    type="button"
                    className={
                      active ? `${styles.uploadItem} ${styles.uploadItemActive}` : styles.uploadItem
                    }
                    aria-pressed={active}
                    aria-label={`Use ${wall.name}`}
                    onClick={() => onChange({ kind: 'user', wallpaperId: wall.id })}
                  >
                    <span className={styles.uploadThumb}>
                      <WallpaperThumb wallpaper={wall} />
                      {active ? (
                        <span className={styles.activeBadge} aria-hidden>
                          <Check size={11} />
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.uploadName}>{wall.name}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label={`Remove ${wall.name}`}
                    onClick={() => removeWallpaper(wall)}
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
