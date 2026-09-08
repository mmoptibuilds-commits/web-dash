import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'
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
import {
  useHomePages,
  usePageItems,
  useSettings,
  useShortcuts,
  useFolders,
  useWidgetInstancesOf,
} from '@/hooks/data'
import { useFreeformCanvas } from '@/hooks/useMedia'
import { getWidgetDef } from '@/features/widgets/registry'
import { WIDGET_SIZE_LABELS } from '@/types/widgets'
import { useUi } from '@/state/ui'
import { recordAndOpen } from '@/lib/nav'
import { deleteShortcut } from '@/data/repositories/shortcuts'
import { deleteFolderCascade } from '@/data/repositories/folders'
import { reorderPageItems, setItemBox } from '@/data/repositories/layout'
import { deleteWidgetInstanceCascade, updateWidgetInstance } from '@/data/repositories/widgets'
import {
  FREE_CANVAS_W,
  SNAP,
  canonicalBoxForWidget,
  clampBox,
  boxesOverlap,
  itemBox,
  MIN_BOX,
  resolveMove,
  resolveResize,
  type Box,
} from '@/data/layout/geometry'
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

interface PayloadCtx {
  shortcut?: Shortcut
  folder?: Folder
  widget?: WidgetInstance
  interactive: boolean
  showLabels: boolean
  iconScale: 'small' | 'regular' | 'large'
  onEditShortcut: (s: Shortcut) => void
  onOpenFolder: (id: string) => void
}

/** Inner content for a tile — shared by the compact grid and the freeform
 *  canvas so the two renderers cannot drift on payload markup. */
function payloadNode(
  item: LayoutItem,
  ctx: PayloadCtx,
): { node: ReactNode; isWidget: boolean } {
  if (item.kind === 'shortcut' && ctx.shortcut) {
    return {
      isWidget: false,
      node: (
        <ShortcutTile
          shortcut={ctx.shortcut}
          showLabel={ctx.showLabels}
          scale={ctx.iconScale}
          onClick={() => {
            if (ctx.interactive) ctx.onEditShortcut(ctx.shortcut!)
            else recordAndOpen(ctx.shortcut!.label, ctx.shortcut!.url)
          }}
        />
      ),
    }
  }
  if (item.kind === 'folder' && ctx.folder) {
    return {
      isWidget: false,
      node: (
        <FolderTile
          folder={ctx.folder}
          showLabel={ctx.showLabels}
          scale={ctx.iconScale}
          onClick={() => ctx.onOpenFolder(ctx.folder!.id)}
        />
      ),
    }
  }
  if (item.kind === 'widget') {
    const def = ctx.widget ? getWidgetDef(ctx.widget.type) : undefined
    if (def && ctx.widget) {
      const Comp = def.component
      return {
        isWidget: true,
        node: (
          <div className={styles.widgetHost}>
            <Comp instance={ctx.widget} editMode={ctx.interactive} />
          </div>
        ),
      }
    }
    return { isWidget: false, node: <div className={styles.tile} /> }
  }
  return { isWidget: false, node: null }
}

/* ------------------------------------------------------------------ */
/* Compact ordered-grid tile (unchanged V1 behaviour, < 1024px)        */
/* ------------------------------------------------------------------ */

function PayloadTile({
  item,
  shortcuts,
  folders,
  widgetInstances,
  onEditShortcut,
  onRemoveRequest,
  onOpenFolder,
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
  onOpenFolder: (id: string) => void
  editMode: boolean
  isActive: boolean
  showLabels: boolean
  iconScale: 'small' | 'regular' | 'large'
}) {
  const interactive = editMode && isActive
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !interactive,
  })

  const shortcut = item.kind === 'shortcut' ? shortcuts.get(item.refId) : undefined
  const folder = item.kind === 'folder' ? folders.get(item.refId) : undefined
  const widget =
    item.kind === 'widget' ? widgetInstances.find((w) => w.id === item.refId) : undefined

  let spanClass = styles.spanSmall
  if (widget) spanClass = SPAN[widget.size] ?? styles.spanMedium
  const { node } = payloadNode(item, {
    shortcut,
    folder,
    widget,
    interactive,
    showLabels,
    iconScale,
    onEditShortcut,
    onOpenFolder,
  })

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

      {node}

      {item.kind === 'widget' && interactive && widget && (
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
/* Freeform tile (>= 1024px)                                           */
/* ------------------------------------------------------------------ */

interface FreeTileProps {
  item: LayoutItem
  ctx: PayloadCtx
  box: Box
  label: string
  selected: boolean
  interactive: boolean
  onRemoveRequest: (item: LayoutItem) => void
  onResizePreset: (item: LayoutItem, s: WidgetSizeId) => void
  onStartMove: (e: ReactPointerEvent, item: LayoutItem) => void
  onStartResize: (e: ReactPointerEvent, item: LayoutItem) => void
  onKeyAction: (e: ReactKeyboardEvent, item: LayoutItem) => void
  onToggleSelect: (id: string | null) => void
  suppressClickRef: MutableRefObject<boolean>
  zIndex: number
}

function FreeTile(props: FreeTileProps) {
  const {
    item,
    ctx,
    box,
    label,
    selected,
    interactive,
    zIndex,
    onRemoveRequest,
    onResizePreset,
    onStartMove,
    onStartResize,
    onKeyAction,
    onToggleSelect,
    suppressClickRef,
  } = props

  const isWidget = item.kind === 'widget' && Boolean(ctx.widget)
  const handle = (e: ReactPointerEvent) => {
    // A plain click selects; a drag is only claimed once the pointer travels.
    e.stopPropagation()
    onToggleSelect(item.id)
    onStartMove(e, item)
  }

  const ring = interactive ? (
    <span
      className={`${styles.freeRing} ${selected ? styles.freeRingOn : ''}`}
      aria-hidden
    />
  ) : null

  return (
    <div
      className={`${styles.freeTile} ${interactive ? styles.freeTileEdit : ''}`}
      data-tile-id={item.id}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h, zIndex }}
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? `${label} tile` : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={interactive ? handle : undefined}
      onKeyDown={interactive ? (e) => onKeyAction(e, item) : undefined}
      onClickCapture={
        interactive
          ? (e) => {
              // A drag release lands as a click; swallow it so the tile doesn't
              // "open" whatever the pointer happened to release over.
              if (suppressClickRef.current) {
                e.preventDefault()
                e.stopPropagation()
                suppressClickRef.current = false
              }
            }
          : undefined
      }
    >
      {ring}
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

      {payloadNode(item, ctx).node}

      {interactive && isWidget && ctx.widget && (
        <div className={styles.resizeRow}>
          {(['small', 'medium', 'large'] as WidgetSizeId[]).map((s) => (
            <button
              key={s}
              type="button"
              className={styles.resizeChip}
              aria-label={`Size ${WIDGET_SIZE_LABELS[s]}`}
              onClick={() => onResizePreset(item, s)}
            >
              {WIDGET_SIZE_LABELS[s][0]}
            </button>
          ))}
        </div>
      )}

      {interactive && (
        <button
          type="button"
          className={styles.freeHandle}
          // Pointer-only chrome: keyboard users resize the focused tile with
          // Alt+Arrows (the tile itself is the tab stop), so this handle must
          // not surface as an announced-but-inert control in the tab order.
          tabIndex={-1}
          aria-hidden
          data-testid="resize-handle"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onStartResize(e, item)
          }}
        >
          <span aria-hidden />
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

type GuideLine = { axis: 'x' | 'y'; at: number }
type Interaction =
  | { id: string; mode: 'move'; box: Box; guides: GuideLine[] }
  | { id: string; mode: 'resize'; box: Box }

interface Gesture {
  id: string
  kind: LayoutItem['kind']
  mode: 'move' | 'resize'
  originCX: number
  originCY: number
  base: Box
  others: Box[]
  /** Highest stored z among the other tiles when the gesture began. */
  maxZ: number
  moved: boolean
}

interface PageProps {
  page: HomePage
  isActive: boolean
  index: number
  editMode: boolean
  freeform: boolean
  showLabels: boolean
  iconScale: 'small' | 'regular' | 'large'
  gridSnap: number
  shortcutById: Map<string, Shortcut>
  folderById: Map<string, Folder>
  onEditShortcut: (s: Shortcut) => void
  onRemoveRequest: (item: LayoutItem) => void
}

/** Non-form-control target — the rest of a tile is a move surface. */
function isFormTarget(t: EventTarget | null): boolean {
  return (
    t instanceof Element &&
    Boolean(
      t.closest(
        'input, textarea, select, [contenteditable], .freeHandle, .remove, .resizeChip',
      ),
    )
  )
}

function PagePane(props: PageProps) {
  const { page, isActive, editMode, freeform } = props
  const snapStep = props.gridSnap > 0 ? props.gridSnap : SNAP
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
  const setOpenFolderId = useUi((s) => s.setOpenFolderId)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [interaction, setInteraction] = useState<Interaction | null>(null)
  const [cw, setCw] = useState(FREE_CANVAS_W)
  const [ch, setCh] = useState(520)
  const canvasRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<Gesture | null>(null)
  const interactionRef = useRef<Interaction | null>(null)
  const suppressClickRef = useRef(false)

  const interactive = editMode && isActive
  const itemsLoaded = items !== undefined

  // Track the rendered freeform canvas width (page padding + 1120 cap) so
  // drags/resizes clamp to it and never push tiles off the right edge.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const measure = () => {
      const w = el.offsetWidth
      const pageHeight = el.parentElement?.clientHeight ?? window.innerHeight
      if (w > 0) setCw(Math.min(w, FREE_CANVAS_W))
      if (pageHeight > 0) setCh(Math.max(240, pageHeight - 32))
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [page.id, freeform, itemsLoaded])

  const sizeById = useMemo(() => {
    const m = new Map<string, WidgetSizeId>()
    for (const w of widgetInstances ?? []) if (w) m.set(w.id, w.size)
    return m
  }, [widgetInstances])

  const boxOf = (item: LayoutItem): Box =>
    clampBox(itemBox(item, sizeById.get(item.refId)), cw, ch)

  // A tile's *live* box: the transient drag/resize box while interacting.
  const liveBoxOf = (item: LayoutItem): Box =>
    interaction && interaction.id === item.id ? interaction.box : boxOf(item)

  const setLive = (next: Interaction) => {
    interactionRef.current = next
    setInteraction(next)
  }

  const endGesture = (released: PointerEvent | null) => {
    const g = gestureRef.current
    const int = interactionRef.current
    gestureRef.current = null
    interactionRef.current = null
    setInteraction(null)
    if (!g || !int) return
    const box = int.box
    void setItemBox(g.id, { x: box.x, y: box.y, w: box.w, h: box.h })
    // A real drag that ends on its own tile must not then "click" the tile's
    // inner control (open shortcut/folder/widget button). A shake that snaps
    // back onto the original slot is not a move — let the click through so the
    // trailing release still opens the editor.
    const settled =
      box.x !== g.base.x || box.y !== g.base.y || box.w !== g.base.w || box.h !== g.base.h
    if (g.mode === 'move' && g.moved && settled && released) {
      const t = released.target as Element | null
      if (t?.closest?.(`[data-tile-id="${g.id}"]`)) suppressClickRef.current = true
    }
  }

  const onWinMove = (e: PointerEvent) => {
    const g = gestureRef.current
    const canvas = canvasRef.current
    if (!g || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const dx = e.clientX - rect.left - g.originCX
    const dy = e.clientY - rect.top - g.originCY

    if (g.mode === 'move') {
      // Only claim a drag once the pointer clears one lattice pitch (SNAP).
      // Anything shorter re-snaps to the same slot anyway, so engaging earlier
      // just swallows ordinary click jitter and bumps z for nothing.
      if (!g.moved && Math.hypot(dx, dy) < SNAP) return
      if (!g.moved) {
        g.moved = true
        // Bring-to-front: persist a z above every other tile the moment the
        // drag engages, so the tile rides above tiles it moves across.
        void setItemBox(g.id, { z: g.maxZ + 1 })
      }
      const proposed: Box = {
        x: g.base.x + dx,
        y: g.base.y + dy,
        w: g.base.w,
        h: g.base.h,
      }
      const res = resolveMove(proposed, g.others, cw, ch, snapStep)
      setLive({ id: g.id, mode: 'move', box: res.valid ? res.box : g.base, guides: res.guides })
    } else {
      const proposed: Box = {
        x: g.base.x,
        y: g.base.y,
        w: g.base.w + dx,
        h: g.base.h + dy,
      }
      const min = MIN_BOX[g.kind]
      const resized = resolveResize(proposed, min, cw, ch, snapStep)
      const others = (items ?? []).filter((i) => i.id !== g.id).map((i) => boxOf(i))
      const box = others.some((other) => boxesOverlap(resized, other)) ? g.base : resized
      setLive({ id: g.id, mode: 'resize', box })
    }
  }

  const onWinUp = (e: PointerEvent) => {
    window.removeEventListener('pointermove', onWinMove)
    window.removeEventListener('pointerup', onWinUp)
    window.removeEventListener('pointercancel', onWinUp)
    endGesture(e)
  }

  const startMove = (e: ReactPointerEvent, item: LayoutItem) => {
    if (!interactive || e.button !== 0) return
    if (isFormTarget(e.target)) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const base = boxOf(item)
    const others = (items ?? [])
      .filter((i) => i.id !== item.id)
      .map((i) => boxOf(i))
      .filter((b) => b.w > 0 && b.h > 0)
    const maxZ = (items ?? []).reduce((m, i) => Math.max(m, i.z ?? 0), 0)
    gestureRef.current = {
      id: item.id,
      kind: item.kind,
      mode: 'move',
      originCX: e.clientX - rect.left,
      originCY: e.clientY - rect.top,
      base,
      others,
      maxZ,
      moved: false,
    }
    window.addEventListener('pointermove', onWinMove)
    window.addEventListener('pointerup', onWinUp)
    window.addEventListener('pointercancel', onWinUp)
  }

  const startResize = (e: ReactPointerEvent, item: LayoutItem) => {
    if (!interactive) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const base = boxOf(item)
    const maxZ = (items ?? []).reduce((m, i) => Math.max(m, i.z ?? 0), 0)
    gestureRef.current = {
      id: item.id,
      kind: item.kind,
      mode: 'resize',
      originCX: e.clientX - rect.left,
      originCY: e.clientY - rect.top,
      base,
      others: [],
      maxZ,
      moved: true,
    }
    window.addEventListener('pointermove', onWinMove)
    window.addEventListener('pointerup', onWinUp)
    window.addEventListener('pointercancel', onWinUp)
  }

  const applyPreset = (item: LayoutItem, s: WidgetSizeId) => {
    const box = boxOf(item)
    const { w, h } = canonicalBoxForWidget(s)
    const resized = resolveResize({ x: box.x, y: box.y, w, h }, MIN_BOX.widget, cw, ch, snapStep)
    const others = (items ?? []).filter((i) => i.id !== item.id).map((i) => boxOf(i))
    if (!others.some((other) => boxesOverlap(resized, other))) void setItemBox(item.id, resized)
    void updateWidgetInstance(item.refId, { size: s })
  }

  const keyAction = (e: ReactKeyboardEvent, item: LayoutItem) => {
    const t = e.target as Element
    // Never hijack typing/selection inside form controls (widget text fields,
    // selects) — the rest of a tile (including its own buttons) is a move
    // surface, so arrows there nudge the tile.
    if (isFormTarget(t)) return
    const step = e.shiftKey ? 8 : 1 // plain arrows = 1px fine nudge; Shift = 8px
    const alt = e.altKey
    const k = e.key
    const isX = k === 'ArrowLeft' || k === 'ArrowRight'
    const isY = k === 'ArrowUp' || k === 'ArrowDown'
    if (!isX && !isY) return
    e.preventDefault()
    const sign = k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 1
    const box = boxOf(item)
    const delta = sign * step
    if (alt) {
      const min = MIN_BOX[item.kind]
      if (step === 1) {
        // Fine 1px Alt+arrow resize: bypass the magnetic lattice, since
        // resolveResize would snap straight back onto the 8px grid and a single
        // press would never change the box. Clamp only — to the kind's minimum
        // and to the right/bottom canvas edge — monotonic in the arrow direction.
        const maxW = Math.max(min.w, cw - box.x)
        const maxH = Math.max(min.h, ch - box.y)
        const w = isX ? Math.max(min.w, Math.min(box.w + delta, maxW)) : box.w
        const h = isY ? Math.max(min.h, Math.min(box.h + delta, maxH)) : box.h
        void setItemBox(item.id, { x: box.x, y: box.y, w, h })
        return
      }
      const next: Box = {
        x: box.x,
        y: box.y,
        w: isX ? box.w + delta : box.w,
        h: isY ? box.h + delta : box.h,
      }
      void setItemBox(item.id, resolveResize(next, min, cw, ch, snapStep))
      return
    }
    // Precise nudges deliberately bypass the magnetic grid/guides (a 1px push
    // through resolveMove would re-snap back onto the 8px lattice). Clamp only.
    const next: Box = {
      x: Math.max(0, isX ? box.x + delta : box.x),
      y: Math.max(0, isY ? box.y + delta : box.y),
      w: box.w,
      h: box.h,
    }
    const others = (items ?? []).filter((i) => i.id !== item.id).map((i) => boxOf(i))
    const bounded = clampBox(next, cw, ch)
    if (!others.some((other) => boxesOverlap(bounded, other))) {
      void setItemBox(item.id, bounded)
    }
  }

  const payloadCtxFor = (item: LayoutItem): PayloadCtx | null => {
    const shortcut = item.kind === 'shortcut' ? props.shortcutById.get(item.refId) : undefined
    const folder = item.kind === 'folder' ? props.folderById.get(item.refId) : undefined
    const widget =
      item.kind === 'widget' ? (widgetInstances ?? []).find((w) => w?.id === item.refId) : undefined
    if (item.kind === 'shortcut' && !shortcut) return null
    if (item.kind === 'folder' && !folder) return null
    if (item.kind === 'widget' && !widget) return null
    return {
      shortcut,
      folder,
      widget,
      interactive,
      showLabels: props.showLabels,
      iconScale: props.iconScale,
      onEditShortcut: props.onEditShortcut,
      onOpenFolder: (id) => setOpenFolderId(id),
    }
  }

  const labelOf = (item: LayoutItem): string => {
    if (item.kind === 'shortcut') return props.shortcutById.get(item.refId)?.label ?? 'item'
    if (item.kind === 'folder') return props.folderById.get(item.refId)?.name ?? 'folder'
    const w = (widgetInstances ?? []).find((x) => x?.id === item.refId)
    return (w && getWidgetDef(w.type)?.name) || 'widget'
  }

  if (!items) return <section className={styles.page} data-page-id={page.id} />

  const onGridDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ordered = items.map((i) => i.id)
    const from = ordered.indexOf(String(active.id))
    const to = ordered.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    void reorderPageItems(page.id, arrayMove(ordered, from, to))
  }

  if (!freeform) {
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onGridDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className={styles.canvas}>
                {items.map((item) => {
                  const ctx = payloadCtxFor(item)
                  if (!ctx) return null
                  return (
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
                      onOpenFolder={(id) => setOpenFolderId(id)}
                      editMode={editMode}
                      isActive={isActive}
                      showLabels={props.showLabels}
                      iconScale={props.iconScale}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
    )
  }

  // Freeform canvas height = tallest tile bottom + a little breathing room.
  const maxBottom = items.reduce((m, it) => Math.max(m, liveBoxOf(it).y + liveBoxOf(it).h), 0)
  const canvasH = items.length === 0 ? ch : Math.max(240, Math.min(ch, maxBottom + 16))
  const guides = interaction && interaction.mode === 'move' ? interaction.guides : []
  // The tile currently being dragged is drawn above every stored z so it rides
  // over tiles it crosses; the persisted z bump lands at drag-engage.
  const topZ = items.reduce((m, it) => Math.max(m, it.z ?? 0), 0)

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
        <div
          ref={canvasRef}
          className={styles.freeCanvas}
          data-testid="freeform-canvas"
          style={{ height: canvasH }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null)
          }}
        >
          {guides.map((g, i) => (
            <span
              key={i}
              className={g.axis === 'x' ? styles.guideV : styles.guideH}
              style={g.axis === 'x' ? { left: g.at } : { top: g.at }}
              aria-hidden
            />
          ))}
          {items.map((item) => {
            const ctx = payloadCtxFor(item)
            if (!ctx) return null
            const box = liveBoxOf(item)
            const zIndex =
              interaction && interaction.id === item.id ? topZ + 1 : item.z ?? 0
            return (
              <FreeTile
                key={item.id}
                item={item}
                ctx={ctx}
                box={box}
                label={labelOf(item)}
                selected={selectedId === item.id}
                interactive={interactive}
                zIndex={zIndex}
                onRemoveRequest={props.onRemoveRequest}
                onResizePreset={applyPreset}
                onStartMove={startMove}
                onStartResize={startResize}
                onKeyAction={keyAction}
                onToggleSelect={(id) => setSelectedId(id)}
                suppressClickRef={suppressClickRef}
              />
            )
          })}
        </div>
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
  const editBarRef = useRef<HTMLDivElement>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingRemove, setPendingRemove] = useState<LayoutItem | null>(null)
  const [removeLabel, setRemoveLabel] = useState('this item')
  const freeform = useFreeformCanvas(settings?.canvasMaxWidth)

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
    // The confirm dialog hands focus back to the tile's Remove button, which is
    // gone with the tile, so focus would drop to <body>. Land on the first
    // edit-bar control instead so keyboard edit mode keeps a target.
    window.requestAnimationFrame(() => {
      const bar = editBarRef.current
      if (!bar) return
      const first = bar.querySelector<HTMLElement>('button:not([disabled])')
      first?.focus()
    })
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
            freeform={freeform}
            showLabels={showLabels}
            iconScale={iconScale}
            gridSnap={settings?.gridSnap ?? SNAP}
            shortcutById={shortcutById}
            folderById={folderById}
            onEditShortcut={(s) => setDialog({ type: 'shortcut', editing: s })}
            onRemoveRequest={askRemove}
          />
        ))}
      </div>

      {editMode && (
        <div className={styles.editBar} ref={editBarRef}>
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
