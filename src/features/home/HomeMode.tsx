import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, FolderPlus, LayoutGrid, ChevronLeft, ChevronRight, X, GripVertical } from 'lucide-react'
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
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useHomePages, usePageItems, useSettings, useShortcuts, useFolders } from '@/hooks/data'
import { useWidgetInstancesOf } from '@/hooks/data'
import { getWidgetDef } from '@/features/widgets/registry'
import { WIDGET_SIZE_LABELS } from '@/types/widgets'
import { useUi } from '@/state/ui'
import { recordAndOpen } from '@/lib/nav'
import { deleteShortcut } from '@/data/repositories/shortcuts'
import { deleteFolderCascade } from '@/data/repositories/folders'
import { reorderPageItems } from '@/data/repositories/layout'
import { deleteWidgetInstanceCascade, updateWidgetInstance } from '@/data/repositories/widgets'
import { ConfirmDialog } from '@/components/common/Modal'
import { ShortcutTile, FolderTile } from './homeItems'
import { ShortcutDialog, NewFolderDialog, WidgetPickerDialog, PagesManagerDialog } from './HomeDialogs'
import type {
  Folder,
  HomePage,
  LayoutItem,
  Shortcut,
  WidgetInstance,
  WidgetSizeId,
} from '@/types/domain'
import styles from './home.module.css'

/* ------------------------------------------------------------------ */

const SPAN: Record<WidgetSizeId, string> = {
  small: styles.spanSmall,
  medium: styles.spanMedium,
  large: styles.spanLarge,
}

type DialogState =
  | { type: 'shortcut'; editing: Shortcut | null }
  | { type: 'folder' }
  | { type: 'widget' }
  | { type: 'pages' }
  | null

interface ModeProps {
  page: HomePage
  isActive: boolean
  index: number
  editMode: boolean
  showLabels: boolean
  iconScale: 'small' | 'regular' | 'large'
  shortcutById: Map<string, Shortcut>
  folderById: Map<string, Folder>
  onEditShortcut: (s: Shortcut) => void
  onRemoveRequest: (item: LayoutItem) => void
}

function PayloadTile({
  item,
  shortcuts,
  folders,
  widgetInstances,
  onEditShortcut,
  onRemoveRequest,
  editMode,
  isActive,
  showLabels,
  iconScale,
}: {
  item: LayoutItem
  shortcuts: Map<string, Shortcut>
  folders: Map<string, Folder>
  widgetInstances: WidgetInstance[]
  onEditShortcut: (s: Shortcut) => void
  onRemoveRequest: (item: LayoutItem) => void
  editMode: boolean
  isActive: boolean
  showLabels: boolean
  iconScale: 'small' | 'regular' | 'large'
}) {
  const setOpenFolderId = useUi((s) => s.setOpenFolderId)
  const interactive = editMode && isActive
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !interactive,
  })

  let spanClass = styles.spanSmall
  let content: React.ReactNode = null

  if (item.kind === 'shortcut') {
    const shortcut = shortcuts.get(item.refId)
    if (!shortcut) return null
    content = (
      <ShortcutTile
        shortcut={shortcut}
        showLabel={showLabels}
        scale={iconScale}
        onClick={() => {
          if (interactive) onEditShortcut(shortcut)
          else recordAndOpen(shortcut.label, shortcut.url)
        }}
      />
    )
  } else if (item.kind === 'folder') {
    const folder = folders.get(item.refId)
    if (!folder) return null
    content = (
      <FolderTile
        folder={folder}
        count={folder.shortcutIds.length}
        showLabel={showLabels}
        scale={iconScale}
        onClick={() => setOpenFolderId(folder.id)}
      />
    )
  } else {
    const widget = widgetInstances.find((w) => w.id === item.refId)
    const def = widget ? getWidgetDef(widget.type) : undefined
    spanClass = widget ? SPAN[widget.size] : styles.spanMedium
    if (def && widget) {
      const Comp = def.component
      content = (
        <div className={styles.widgetHost}>
          <Comp instance={widget} editMode={interactive} />
        </div>
      )
    } else {
      content = <div className={styles.tile}>{/* unknown widget type */}</div>
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`${styles.cell} ${spanClass}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {interactive && (
        <button
          type="button"
          className={styles.dragBand}
          {...attributes}
          {...listeners}
          aria-label="Drag to rearrange"
        >
          <GripVertical size={14} aria-hidden />
        </button>
      )}
      {interactive && (
        <button
          type="button"
          className={styles.remove}
          aria-label="Remove from page"
          onClick={() => onRemoveRequest(item)}
        >
          <X size={13} aria-hidden />
        </button>
      )}

      {content}

      {item.kind === 'widget' && interactive && widgetInstances.find((w) => w.id === item.refId) && (
        <div className={styles.resizeRow}>
          {(['small', 'medium', 'large'] as WidgetSizeId[]).map((s) => (
            <button
              key={s}
              type="button"
              className={styles.resizeChip}
              aria-label={`Size ${WIDGET_SIZE_LABELS[s]}`}
              onClick={() => void updateWidgetInstance(item.refId, { size: s })}
            >
              {WIDGET_SIZE_LABELS[s][0]}
            </button>
          ))}
        </div>
      )}

      {isDragging && <div className={styles.dragShade} aria-hidden />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function PagePane(props: ModeProps) {
  const { page, isActive, editMode } = props
  const items = usePageItems(page.id)
  const ids = useMemo(
    () => (items ?? []).filter((i) => i.kind === 'widget').map((i) => i.refId),
    [items],
  )
  const widgetInstances = useWidgetInstancesOf(ids)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )
  const setActivePageId = useUi((s) => s.setActivePageId)
  const toggleEditMode = useUi((s) => s.toggleEditMode)

  if (!items) return <section className={styles.page} data-page-id={page.id} />

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ordered = items.map((i) => i.id)
    const from = ordered.indexOf(String(active.id))
    const to = ordered.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    void reorderPageItems(page.id, arrayMove(ordered, from, to))
  }

  return (
    <section className={styles.page} data-page-id={page.id}>
      {items.length === 0 && !editMode ? (
        <div className={styles.emptyPage}>
          <p>This page is empty.</p>
          <div className={styles.emptyActions}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                // Bring this page to the front and open the editor so the
                // "Shortcut / Folder / Widget" toolbar is immediately visible.
                setActivePageId(page.id)
                if (!editMode) toggleEditMode()
              }}
            >
              <Plus size={15} aria-hidden />
              Add content
            </button>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className={styles.canvas}>
              {items.map((item) => (
                <PayloadTile
                  key={item.id}
                  item={item}
                  shortcuts={props.shortcutById}
                  folders={props.folderById}
                  widgetInstances={(widgetInstances ?? []).filter(
                    (w): w is WidgetInstance => Boolean(w),
                  )}
                  onEditShortcut={props.onEditShortcut}
                  onRemoveRequest={props.onRemoveRequest}
                  editMode={editMode}
                  isActive={isActive}
                  showLabels={props.showLabels}
                  iconScale={props.iconScale}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */

export function HomeMode() {
  const pages = useHomePages()
  const shortcuts = useShortcuts()
  const folders = useFolders()
  const settings = useSettings()
  const editMode = useUi((s) => s.editMode)
  const activePageId = useUi((s) => s.activePageId)
  const setActivePageId = useUi((s) => s.setActivePageId)
  const stripRef = useRef<HTMLDivElement>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingRemove, setPendingRemove] = useState<LayoutItem | null>(null)
  const [removeLabel, setRemoveLabel] = useState('this item')

  const showLabels = settings?.showLabels ?? true
  const iconScale = settings?.iconSize ?? 'regular'

  // Keep the active page valid. Pick the first page once it's needed (null
  // after boot or when the active page is removed). Crucially, do NOT snap back
  // when the active id is simply not in the list yet: right after "Add page"
  // the live query can still be stale while the store already points at the new
  // page, and resetting there would swallow the freshly created page's focus.
  const prevPageIds = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!pages || pages.length === 0) return
    const ids = new Set(pages.map((p) => p.id))
    const prev = prevPageIds.current
    prevPageIds.current = ids
    if (activePageId == null) {
      setActivePageId(pages[0].id)
      return
    }
    if (ids.has(activePageId)) return
    // Active page is missing AND a prior list contained it → it was deleted,
    // so fall back to the first page. A brand-new id is left alone until its
    // page arrives in the list.
    if (prev && prev.has(activePageId)) setActivePageId(pages[0].id)
  }, [pages, activePageId, setActivePageId])

  // Bring the active page into view. This is an *instant* jump on purpose:
  // a smooth scroll animates through intermediate positions, and reading those
  // back in onScrollSync would fight the activation (see onScrollSync). Manual
  // swipes on the strip are still smooth — they scroll the element directly and
  // onScrollSync follows.
  useEffect(() => {
    const el = stripRef.current
    if (!el || !pages || !activePageId) return
    const idx = pages.findIndex((p) => p.id === activePageId)
    if (idx < 0) return
    const left = idx * el.clientWidth
    if (Math.abs(el.scrollLeft - left) < 2) return
    el.scrollTo({ left, behavior: 'auto' })
  }, [activePageId, pages])

  const onScrollSync = () => {
    const el = stripRef.current
    if (!el || el.clientWidth === 0) return
    // While the active id is not in the live page list (e.g. right after "Add
    // page", when the Dexie query is one render behind the store) the scroll
    // position is stale relative to it — any scroll event then would read as
    // "back on Home" and swallow the fresh page's activation. Hold off until
    // the id materializes and the strip has been scrolled to it.
    if (!pages || !pages.some((p) => p.id === activePageId)) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    const current = pages[idx]
    if (current && current.id !== activePageId) setActivePageId(current.id)
  }

  const shortcutById = useMemo(() => {
    const m = new Map<string, Shortcut>()
    for (const s of shortcuts ?? []) m.set(s.id, s)
    return m
  }, [shortcuts])
  const folderById = useMemo(() => {
    const m = new Map<string, Folder>()
    for (const f of folders ?? []) m.set(f.id, f)
    return m
  }, [folders])

  if (!pages || pages.length === 0) return null

  const activeIndex = Math.max(
    0,
    pages.findIndex((p) => p.id === activePageId),
  )

  const goTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, idx))
    setActivePageId(pages[clamped].id)
  }

  const openDialog = (d: DialogState) => {
    // A freshly created folder opens right away.
    setDialog(d)
  }

  const askRemove = (item: LayoutItem) => {
    const label =
      item.kind === 'shortcut'
        ? `“${shortcutById.get(item.refId)?.label ?? 'this shortcut'}”`
        : item.kind === 'folder'
          ? `folder “${folderById.get(item.refId)?.name ?? ''}”`
          : 'this widget'
    setRemoveLabel(label)
    setPendingRemove(item)
  }

  const doRemove = async (item: LayoutItem) => {
    if (item.kind === 'shortcut') await deleteShortcut(item.refId)
    else if (item.kind === 'folder') await deleteFolderCascade(item.refId)
    else await deleteWidgetInstanceCascade(item.refId)
    setPendingRemove(null)
  }

  const newFolderCreated = (folder: Folder) => {
    setDialog(null)
    const ui = useUi.getState()
    ui.setOpenFolderId(folder.id)
  }

  return (
    <div className={styles.home}>
      {/* Page header: prev/next, name, pages list, dots */}
      <div className={styles.pageHeader}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Previous page"
          disabled={activeIndex === 0}
          onClick={() => goTo(activeIndex - 1)}
        >
          <ChevronLeft size={18} aria-hidden />
        </button>

        <button
          type="button"
          className={styles.pageTitle}
          onClick={() => openDialog({ type: 'pages' })}
        >
          <span>{pages[activeIndex]?.name}</span>
          <ChevronRight size={14} aria-hidden />
        </button>

        <button
          type="button"
          className={styles.navBtn}
          aria-label="Next page"
          disabled={activeIndex === pages.length - 1}
          onClick={() => goTo(activeIndex + 1)}
        >
          <ChevronRight size={18} aria-hidden />
        </button>

        <span className={styles.dots} role="group" aria-label="Pages">
          {pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.dot} ${i === activeIndex ? styles.dotOn : ''}`}
              aria-label={`Page ${i + 1}: ${p.name}`}
              aria-current={i === activeIndex ? 'true' : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </span>
      </div>

      <div
        ref={stripRef}
        className={styles.strip}
        onScroll={onScrollSync}
      >
        {pages.map((p, i) => (
          <PagePane
            key={p.id}
            page={p}
            isActive={p.id === activePageId}
            index={i}
            editMode={editMode}
            showLabels={showLabels}
            iconScale={iconScale}
            shortcutById={shortcutById}
            folderById={folderById}
            onEditShortcut={(s) => setDialog({ type: 'shortcut', editing: s })}
            onRemoveRequest={askRemove}
          />
        ))}
      </div>

      {editMode && (
        <div className={styles.editBar}>
          <button type="button" className="btn btn-ghost" onClick={() => setDialog({ type: 'shortcut', editing: null })}>
            <Plus size={15} aria-hidden />
            Shortcut
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setDialog({ type: 'folder' })}>
            <FolderPlus size={15} aria-hidden />
            Folder
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setDialog({ type: 'widget' })}>
            <LayoutGrid size={15} aria-hidden />
            Widget
          </button>
        </div>
      )}

      {/* Dialogs */}
      <ShortcutDialog
        open={dialog?.type === 'shortcut'}
        onClose={() => setDialog(null)}
        pageId={pages[activeIndex].id}
        initial={dialog?.type === 'shortcut' ? dialog.editing ?? undefined : undefined}
      />
      <NewFolderDialog
        open={dialog?.type === 'folder'}
        onClose={() => setDialog(null)}
        pageId={pages[activeIndex].id}
        onCreated={newFolderCreated}
      />
      <WidgetPickerDialog
        open={dialog?.type === 'widget'}
        onClose={() => setDialog(null)}
        pageId={pages[activeIndex].id}
      />
      <PagesManagerDialog open={dialog?.type === 'pages'} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={pendingRemove != null}
        title="Remove from page"
        message={`Remove ${removeLabel}? This can't be undone.`}
        confirmLabel="Remove"
        danger
        onConfirm={() => pendingRemove && void doRemove(pendingRemove)}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}
