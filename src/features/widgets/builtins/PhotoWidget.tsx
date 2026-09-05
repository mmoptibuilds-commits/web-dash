import { useRef, useState } from 'react'
import { Image as ImageIcon, ImagePlus, Trash2 } from 'lucide-react'
import type { WidgetComponentProps } from '../registry'
import { updateWidgetInstance } from '@/data/repositories/widgets'
import styles from './builtins.module.css'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read that image'))
    reader.readAsDataURL(file)
  })
}

export function PhotoWidget({ instance, editMode }: WidgetComponentProps) {
  const data = (instance.settings ?? {}) as { src?: string; name?: string }
  const src = data.src
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // While in edit mode the owner can swap or remove; once an image is set,
  // normal (viewing) mode shows it cleanly with no controls.
  const controlsVisible = editMode || !src

  async function onPick(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is larger than 8 MB')
      return
    }
    try {
      const dataUrl = await readAsDataUrl(file)
      await updateWidgetInstance(instance.id, {
        settings: { ...instance.settings, src: dataUrl, name: file.name },
      })
      setError(null)
    } catch {
      setError('Could not read that image')
    }
  }

  async function removePhoto() {
    const settings = { ...instance.settings }
    delete settings.src
    delete settings.name
    await updateWidgetInstance(instance.id, { settings })
  }

  return (
    <div className={styles.photo}>
      {src ? (
        <>
          <img
            className={styles.photoImg}
            src={src}
            alt={data.name ?? 'Photo'}
            draggable={false}
          />
          <div className={styles.photoImgOverlay} aria-hidden />
          {controlsVisible && (
            <div className={styles.photoActions}>
              <button
                type="button"
                className="icon-btn glass"
                aria-label="Replace photo"
                title="Replace photo"
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus size={16} aria-hidden />
              </button>
              {editMode && (
                <button
                  type="button"
                  className="icon-btn glass"
                  aria-label="Remove photo"
                  title="Remove photo"
                  onClick={() => void removePhoto()}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.photoEmpty}>
          {controlsVisible ? (
            <>
              <ImagePlus size={26} strokeWidth={1.6} aria-hidden />
              <span>Add a photo</span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => inputRef.current?.click()}
              >
                Upload…
              </button>
            </>
          ) : (
            <>
              <ImageIcon size={22} strokeWidth={1.5} aria-hidden />
              <span>No photo yet</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        aria-label="Upload a photo"
        onChange={(ev) => {
          void onPick(ev.target.files?.[0] ?? null)
          ev.target.value = ''
        }}
      />

      {error && (
        <p className={styles.photoErr} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
