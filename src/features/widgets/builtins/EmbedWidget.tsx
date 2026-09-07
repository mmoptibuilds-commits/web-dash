import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Link2, Maximize2, Minimize2, Pencil, X } from 'lucide-react'
import type { WidgetComponentProps } from '../registry'
import { updateWidgetInstance } from '@/data/repositories/widgets'
import { classifyInput, hostOf, isSafeUrl, normalizeHttpUrl } from '@/lib/url'
import { useSettings } from '@/hooks/data'
import styles from './builtins.module.css'

/** Sites we embed in a frame and navigate the whole tab for are distinct;
 *  embeds keep their own sandbox so a framed page can't grab the top tab. */
const FRAME_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups'

export function EmbedWidget({ instance, editMode }: WidgetComponentProps) {
  const data = (instance.settings ?? {}) as { url?: string; toolbar?: boolean }
  const appSettings = useSettings()
  const storedUrl = data.url && isSafeUrl(data.url) ? normalizeHttpUrl(data.url) : ''
  // The draft starts from the stored URL; edits stay local until applied, and
  // cancelling (stopEditing) re-syncs from the stored value.
  const [draft, setDraft] = useState(storedUrl)
  const [editing, setEditing] = useState(!storedUrl)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const embedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === embedRef.current)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])

  function apply(ev: React.FormEvent) {
    ev.preventDefault()
    const raw = draft.trim()
    if (!raw) {
      setError('Enter a web address to embed')
      return
    }
    const result = classifyInput(raw)
    if (result.kind === 'invalid') {
      setError(result.reason)
      return
    }
    if (result.kind === 'search') {
      setError('Enter a full link, e.g. https://example.com')
      return
    }
    setError(null)
    setEditing(false)
    void updateWidgetInstance(instance.id, {
      settings: { ...instance.settings, url: result.url },
    })
  }

  function stopEditing() {
    setError(null)
    setDraft(storedUrl)
    if (storedUrl) setEditing(false)
  }

  if (editing) {
    return (
      <div className={styles.embed} data-testid="embed-widget">
        <form className={styles.embedForm} onSubmit={apply}>
          <div className={styles.embedFormRow}>
            <input
              className={styles.embedInput}
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              placeholder="https://example.com"
              aria-label="Web address to embed"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              enterKeyHint="go"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Embed
            </button>
            <button
              type="button"
              className="icon-btn glass"
              aria-label="Cancel"
              onClick={stopEditing}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
          {error ? (
            <p className={styles.embedErr} role="alert">
              {error}
            </p>
          ) : (
            <p className={styles.embedHelp}>
              Some sites refuse to be framed — open them in a tab instead.
            </p>
          )}
        </form>
      </div>
    )
  }

  const toggleEmbedFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await embedRef.current?.requestFullscreen()
    } catch {
      // Browser policy may deny fullscreen; the bounded widget remains usable.
    }
  }

  // Instance settings can hide a toolbar for one embed, while the global
  // preference controls the default shell treatment for every embed.
  const showToolbar = data.toolbar !== false && appSettings?.embedToolbar !== false
  const allowFullscreen = appSettings?.embedFullscreen !== false

  return (
    <div ref={embedRef} className={styles.embed} data-testid="embed-widget">
      <div className={styles.embedBody}>
        <iframe
          className={styles.embedFrame}
          src={storedUrl}
          title={`Embedded site — ${storedUrl}`}
          sandbox={FRAME_SANDBOX}
          referrerPolicy="no-referrer"
          loading="lazy"
          allow="fullscreen"
        />
      </div>
      {showToolbar && <div className={styles.embedTop} data-testid="embed-toolbar">
        <span className={styles.embedHost} data-testid="embed-domain">
          <Link2 size={12} aria-hidden /> {hostOf(storedUrl)}
        </span>
        <span className={styles.embedActions}>
          {allowFullscreen && (
            <button type="button" className={styles.embedOpenBtn} aria-label={fullscreen ? 'Exit fullscreen embed' : 'Open embed fullscreen'} onClick={() => void toggleEmbedFullscreen()}>
              {fullscreen ? <Minimize2 size={12} aria-hidden /> : <Maximize2 size={12} aria-hidden />}
            </button>
          )}
          {editMode && (
            <button
              type="button"
              className={styles.embedOpenBtn}
              aria-label="Change embedded URL"
              onClick={() => setEditing(true)}
            >
              <Pencil size={12} aria-hidden /> Change
            </button>
          )}
          <a
            className={styles.embedOpenBtn}
            href={storedUrl}
            target="_blank"
            rel="noreferrer noopener"
            title="Open in a new tab"
          >
            <ExternalLink size={12} aria-hidden /> Open
          </a>
        </span>
      </div>}
      <span className={styles.embedNote}>If blank, the site blocks embedding</span>
    </div>
  )
}
