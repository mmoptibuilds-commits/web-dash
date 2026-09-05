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
import { X } from 'lucide-react'
import { useDock, useShortcuts } from '@/hooks/data'
import { BUILTIN_APPS } from '@/types/apps'
import { removeDockItem, setDockOrder } from '@/data/repositories/dock'
import { useUi } from '@/state/ui'
import { launchApp } from '@/state/nav'
import { recordAndOpen } from '@/lib/nav'
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
  onUnpin,
}: {
  resolved: Resolved
  editable: boolean
  active: boolean
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

      {editable && shortcut && (
        <button
          type="button"
          className={styles.unpin}
          aria-label={`Remove ${label} from dock`}
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

  return (
    <nav className={styles.dock} aria-label="Dock">
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
                onUnpin={() => void unpin(r.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </nav>
  )
}
