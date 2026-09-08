import type { Folder, IconSizePreset, Shortcut } from '@/types/domain'
import { ShortcutGlyph } from '@/components/common/Glyph'
import styles from './home.module.css'

/** Map icon-size setting -> CSS scale class. */
export const SIZE_CLASS: Record<IconSizePreset, string> = {
  small: styles.boxSmall,
  regular: styles.boxRegular,
  large: styles.boxLarge,
}

/** Icon + label shortcut tile (visual only — click handled by the canvas). */
export function ShortcutTile({
  shortcut,
  showLabel,
  scale,
  onClick,
}: {
  shortcut: Shortcut
  showLabel: boolean
  scale: IconSizePreset
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${styles.soft} anim-fade`}
      onClick={onClick}
      title={shortcut.label}
      aria-label={`Open ${shortcut.label}`}
    >
      <span
        className={`${styles.box} ${styles.shortcutBox} ${SIZE_CLASS[scale]}`}
        style={shortcut.bg ? { background: shortcut.bg } : undefined}
      >
        <ShortcutGlyph icon={shortcut.icon} label={shortcut.label} url={shortcut.url} />
      </span>
      {showLabel && <span className={styles.label}>{shortcut.label}</span>}
    </button>
  )
}

/** Folder tile showing its emoji icon and member count. */
export function FolderTile({
  folder,
  showLabel,
  scale,
  onClick,
}: {
  folder: Folder
  showLabel: boolean
  scale: IconSizePreset
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${styles.soft} anim-fade`}
      onClick={onClick}
      title={folder.name}
      aria-label={`Open folder ${folder.name}`}
    >
      <span
        className={`${styles.box} ${SIZE_CLASS[scale]}`}
        style={folder.bg ? { background: folder.bg } : undefined}
      >
        <span className={styles.folderIcon} aria-hidden>
          {folder.icon.emoji}
        </span>
      </span>
      {showLabel && <span className={styles.label}>{folder.name}</span>}
    </button>
  )
}
