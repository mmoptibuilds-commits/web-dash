import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X } from 'lucide-react'
import { useDock, useShortcuts } from '@/hooks/data'
import { BUILTIN_APPS } from '@/types/apps'
import {
  addAppToDock,
  addShortcutToDock,
  removeDockItem,
  setDockOrder,
} from '@/data/repositories/dock'
import { useUi } from '@/state/ui'
import { launchApp } from '@/state/nav'
import { recordAndOpen } from '@/lib/nav'
import { hostOf } from '@/lib/url'
import { ShortcutGlyph, hueFor } from '@/components/common/Glyph'
import type { BuiltinAppId, DockItem, Shortcut } from '@/types/domain'
import styles from './dock.module.css'

interface Resolved {
  item: DockItem
  id: string
  label: string
  /** Present for pinned web shortcuts; undefined for built-in apps. */
  shortcut?: Shortcut
  onOpen: () => void
}

function AppGlyph({ appId, name }: { appId: BuiltinAppId; name: string }) {
  const Icon = BUILTIN_APPS[appId].icon
  const h = hueFor(name)
  return (
    <span
      className={styles.glyph}
      style={{
        backgroundImage: `linear-gradient(150deg, hsl(${h} 52% 52%), hsl(${(h + 42) % 360} 56% 38%))`,
      }}
    >
      <Icon size={26} strokeWidth={1.7} aria-hidden />
    </span>
  )
}

function DockTile({
  resolved,
  editable,
  active,
  canRemove,
  onUnpin,
}: {
  resolved: Resolved
  editable: boolean
  active: boolean
  /** False keeps a tile (e.g. the Dashboard escape hatch on mobile) locked. */
  canRemove: boolean
  onUnpin: () => void
}) {
  const { item, label, shortcut, onOpen } = resolved
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editable,
  })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.tileWrap} ${isDragging ? styles.tileDragging : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...(editable ? { ...attributes, ...listeners } : {})}
    >
      <button
        type="button"
        className={styles.tile}
        aria-label={`Open ${label}`}
        title={label}
        onClick={() => {
          if (!editable) onOpen()
        }}
      >
        {shortcut ? (
          <span className={styles.glyphShell}>
            <ShortcutGlyph icon={shortcut.icon} label={shortcut.label} url={shortcut.url} />
          </span>
        ) : (
          <AppGlyph appId={item.appId} name={label} />
        )}
      </button>

      {editable && canRemove && (
        <button
          type="button"
          className={styles.unpin}
          aria-label={`Remove ${label} from dock`}
          title={`Remove ${label} from dock`}
          onClick={onUnpin}
        >
          <X size={10} aria-hidden />
        </button>
      )}

      <span className={`${styles.indicator} ${active ? styles.indicatorOn : ''}`} aria-hidden />
    </div>
  )
}

/** macOS-style launcher dock, persistent across modes & pages. */
export function Dock() {
  const dock = useDock()
  const shortcuts = useShortcuts()
  const editMode = useUi((s) => s.editMode)
  const mode = useUi((s) => s.mode)
  const windows = useUi((s) => s.windows)
  const mobileAppId = useUi((s) => s.mobileAppId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const [adding, setAdding] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  const canAdd = editMode && mode === 'home'
  const open = adding && canAdd

  // The "Add to dock" popover is transient UI — drop it whenever the user
  // leaves Edit Mode or Home while it is open, whatever input opened/closed it.
  useEffect(
    () =>
      useUi.subscribe((s, prev) => {
        if (prev.editMode !== s.editMode || prev.mode !== s.mode) {
          if (!s.editMode || s.mode !== 'home') setAdding(false)
        }
      }),
    [],
  )

  // Close on outside pointer-down/click or Escape. The popover and the bar are
  // both inside `.stack`, so a row click never trips the outside handler before
  // its own onClick runs.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: Event) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setAdding(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAdding(false)
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('click', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('click', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Move focus into the popover when it opens (it is not a focus trap).
  useEffect(() => {
    if (open) popRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [open])

  if (!dock || !shortcuts) return null

  const shortcutById = new Map(shortcuts.map((s) => [s.id, s]))
  const resolved: Resolved[] = []
  for (const item of dock) {
    if (item.shortcutId) {
      const shortcut = shortcutById.get(item.shortcutId)
      if (!shortcut) continue // stale pin — ignore until cleaned
      resolved.push({
        item,
        id: item.id,
        label: shortcut.label,
        shortcut,
        onOpen: () => recordAndOpen(shortcut.label, shortcut.url),
      })
    } else {
      const app = BUILTIN_APPS[item.appId]
      resolved.push({
        item,
        id: item.id,
        label: app.name,
        onOpen: () => launchApp(item.appId),
      })
    }
  }

  // Candidates the "Add to dock" popover offers: built-in apps and pinned web
  // shortcuts that are not already present.
  const dockedIds = new Set<string>()
  const pinnedIds = new Set<string>()
  for (const r of resolved) {
    if (r.shortcut) pinnedIds.add(r.shortcut.id)
    else dockedIds.add(r.item.appId)
  }
  const addableApps = Object.values(BUILTIN_APPS).filter((a) => !dockedIds.has(a.id))
  const addableShortcuts = shortcuts.filter((s) => !pinnedIds.has(s.id))

  const activeIds = new Set<string>()
  if (mode === 'home') {
    for (const r of resolved) {
      if (!r.shortcut && r.item.appId === 'home') activeIds.add(r.id)
    }
  } else {
    for (const r of resolved) {
      if (r.shortcut) continue
      const open =
        Object.prototype.hasOwnProperty.call(windows, r.item.appId) || mobileAppId === r.item.appId
      if (open) activeIds.add(r.id)
    }
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = resolved.map((r) => r.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    void setDockOrder(arrayMove(ids, from, to))
  }

  const unpin = async (id: string) => {
    await removeDockItem(id)
    const remaining = resolved.filter((r) => r.id !== id).map((r) => r.id)
    void setDockOrder(remaining)
  }

  const addApp = (appId: BuiltinAppId) => {
    void addAppToDock(appId)
    setAdding(false)
  }

  const addShortcut = (id: string) => {
    void addShortcutToDock(id)
    setAdding(false)
  }

  const nothingToAdd = addableApps.length === 0 && addableShortcuts.length === 0

  return (
    <nav className={styles.dock} aria-label="Dock">
      <div ref={barRef} className={styles.stack}>
        {open && (
          <div
            id="dock-add-pop"
            ref={popRef}
            className={styles.addPop}
            role="dialog"
            aria-label="Add to dock"
          >
            {nothingToAdd ? (
              <p className={styles.addEmpty}>Everything is already in the dock.</p>
            ) : (
              <div className={styles.addList}>
                {addableApps.length > 0 && <p className={styles.addSection}>Apps</p>}
                {addableApps.map((a) => {
                  const Icon = a.icon
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={styles.addRow}
                      onClick={() => addApp(a.id)}
                    >
                      <span className={styles.addRowIcon}>
                        <Icon size={17} strokeWidth={1.9} aria-hidden />
                      </span>
                      <span className={styles.addRowText}>
                        <span className={styles.addRowName}>{a.name}</span>
                        <span className={styles.addRowMeta}>
                          {a.kind === 'nav' ? 'Go to' : 'Open'}
                        </span>
                      </span>
                    </button>
                  )
                })}
                {addableShortcuts.length > 0 && <p className={styles.addSection}>Links</p>}
                {addableShortcuts.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={styles.addRow}
                    onClick={() => addShortcut(s.id)}
                  >
                    <span className={styles.addRowIcon}>
                      <ShortcutGlyph icon={s.icon} label={s.label} url={s.url} />
                    </span>
                    <span className={styles.addRowText}>
                      <span className={styles.addRowName}>{s.label}</span>
                      <span className={styles.addRowMeta}>{hostOf(s.url)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={styles.bar}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={resolved.map((r) => r.id)}
              strategy={horizontalListSortingStrategy}
            >
              {resolved.map((r) => (
                <DockTile
                  key={r.id}
                  resolved={r}
                  editable={editMode}
                  active={activeIds.has(r.id)}
                  canRemove={!r.shortcut && r.item.appId === 'dashboard' ? false : true}
                  onUnpin={() => void unpin(r.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {canAdd && (
            <button
              type="button"
              className={styles.addChip}
              aria-label="Add to dock"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? 'dock-add-pop' : undefined}
              onClick={() => setAdding((v) => !v)}
            >
              <Plus size={20} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
