import { useMemo } from 'react'
import { Bookmark } from 'lucide-react'
import type { WidgetComponentProps } from '@/features/widgets/registry'
import { useShortcuts } from '@/hooks/data'
import { hostOf } from '@/lib/url'
import { recordAndOpen } from '@/lib/nav'
import { Favicon } from './Favicon'
import { sortShortcuts } from './utils'
import styles from './bookmarks.module.css'

/** Bookmarks widget — compact, display-only list from the shared shortcut store. */
export function BookmarksWidget(_props: WidgetComponentProps) {
  const shortcuts = useShortcuts()

  const rows = useMemo(() => sortShortcuts(shortcuts ?? []), [shortcuts])
  const count = shortcuts?.length ?? 0
  const ready = shortcuts !== undefined

  return (
    <div className={styles.panel}>
      <div className={styles.wHead}>
        <Bookmark size={14} aria-hidden />
        <span className={styles.wTitle}>Links</span>
        {ready && <span className={styles.wCount}>{count} total</span>}
      </div>

      {ready && rows.length === 0 && <div className={styles.wEmpty}>No links yet</div>}

      <div className={styles.linkList}>
        {rows.map((shortcut) => (
          <button
            type="button"
            key={shortcut.id}
            className={styles.linkRow}
            onClick={() => recordAndOpen(shortcut.label, shortcut.url)}
            aria-label={`Open ${shortcut.label}`}
          >
            <Favicon url={shortcut.url} label={shortcut.label} size={18} />
            <span className={styles.linkLabel} title={hostOf(shortcut.url)}>
              {shortcut.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
