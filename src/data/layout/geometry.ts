import type { LayoutItemKind, WidgetSizeId } from '@/types/domain'

/**
 * Freeform desktop canvas geometry.
 *
 * Desktop Home (>= 1024px, matching the shell's window/sheet breakpoint) is a
 * genuine freeform canvas: every layout item has an explicit x/y/w/h/z stored
 * on the LayoutItem row, tiles are absolutely positioned, neighbours never
 * auto-reflow, and overlap is allowed with bring-to-front.
 *
 * Compact widths (< 1024px) keep the ordered grid and ignore these fields, so
 * desktop arrangements and phone arrangements never corrupt one another.
 *
 * The canonical sizes below mirror the old 6-column grid at its 1120px cap so
 * freshly seeded / migrated items land on the same visual rhythm as V1.
 * All functions here are pure so they are unit-testable under jsdom and reused
 * by the DB migration (Dexie upgrade) and the live add paths alike.
 */

/* ------------------------- Canonical scale -------------------------- */

export const FREE_COLS = 6
export const FREE_COL_W = 170 // px per column
export const FREE_ROW_H = 110 // px per row
export const FREE_GAP = 20 // px gutter between columns / rows
export const FREE_CANVAS_W = FREE_COLS * FREE_COL_W + (FREE_COLS - 1) * FREE_GAP // 1120

/** Column/row pitch used when placing items (width + gap). */
export const COL_PITCH = FREE_COL_W + FREE_GAP
export const ROW_PITCH = FREE_ROW_H + FREE_GAP

/** Soft magnetic grid — positions and sizes snap to multiples of this. */
export const SNAP = 8

/** How close an edge must be to another tile's edge for an alignment guide. */
export const GUIDE_TOL = 6

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Minimum freeform size for a tile, keyed by payload kind. */
export const MIN_BOX: Record<LayoutItemKind, { w: number; h: number }> = {
  shortcut: { w: 120, h: 84 },
  folder: { w: 120, h: 84 },
  // Widgets can be as small as their canonical 'small' preset — the min must
  // never exceed a shipped default, or "shrink" would grow the tile.
  widget: { w: FREE_COL_W, h: FREE_ROW_H }, // 170×110 == freeBoxForKind('widget','small')
}

/** Canonical desktop box for a payload kind (widgets keyed by their preset). */
export function freeBoxForKind(kind: LayoutItemKind, size?: WidgetSizeId): Box {
  if (kind !== 'widget') return { x: 0, y: 0, w: FREE_COL_W, h: FREE_ROW_H }
  switch (size ?? 'medium') {
    case 'small':
      return { x: 0, y: 0, w: FREE_COL_W, h: FREE_ROW_H }
    case 'large':
      return { x: 0, y: 0, w: 4 * FREE_COL_W + 3 * FREE_GAP, h: 2 * FREE_ROW_H + FREE_GAP }
    default: // medium
      return { x: 0, y: 0, w: 2 * FREE_COL_W + FREE_GAP, h: 2 * FREE_ROW_H + FREE_GAP }
  }
}

/** Canonical width for a widget preset (for size chips / resize presets). */
export function canonicalBoxForWidget(size: WidgetSizeId): { w: number; h: number } {
  const { w, h } = freeBoxForKind('widget', size)
  return { w, h }
}

/**
 * Resolved box for a stored layout item: its persisted freeform geometry when
 * present, else a canonical default (icons 1×1; widgets by their size preset).
 * Used by renderers, the collision set for new placements and resizing presets.
 */
export function itemBox(
  it: { kind: LayoutItemKind; x?: number; y?: number; w?: number; h?: number },
  size?: WidgetSizeId,
): Box {
  if (
    typeof it.x === 'number' &&
    typeof it.y === 'number' &&
    typeof it.w === 'number' &&
    typeof it.h === 'number'
  ) {
    return { x: it.x, y: it.y, w: it.w, h: it.h }
  }
  const def = freeBoxForKind(it.kind, size)
  return { x: it.x ?? 0, y: it.y ?? 0, w: def.w, h: def.h }
}

/* ------------------------- Placement helpers ------------------------ */

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * First free slot for a `w`×`h` box placed on the canonical column/row pitch,
 * left-to-right / top-to-bottom, that does not overlap any existing box.
 * Bounded by the canonical canvas width; rows may extend below without limit.
 */
export function findFreeSpot(existing: Box[], w: number, h: number): { x: number; y: number }
export function findFreeSpot(existing: Box[], w: number, h: number, maxHeight: number): { x: number; y: number } | null
export function findFreeSpot(existing: Box[], w: number, h: number, maxHeight?: number): { x: number; y: number } | null {
  const maxX = FREE_CANVAS_W - w
  for (let row = 0; row < 400; row++) {
    const y = row * ROW_PITCH
    if (maxHeight !== undefined && y + h > maxHeight) break
    for (let col = 0; col < FREE_COLS; col++) {
      const x = Math.max(0, col * COL_PITCH)
      if (x > maxX) break
      const probe: Box = { x, y, w, h }
      if (!existing.some((b) => boxesOverlap(b, probe))) return { x, y }
    }
  }
  // Extremely dense canvas: fall back to a position below everything.
  if (maxHeight !== undefined && Number.isFinite(maxHeight)) return null
  const bottom = existing.reduce((m, b) => Math.max(m, b.y + b.h), 0)
  return { x: 0, y: bottom + ROW_PITCH }
}

export interface Placeable {
  id: string
  order: number
  w: number
  h: number
}

/**
 * Deterministic default placement for a whole page's items (sorted by order):
 * each item takes the first free canonical slot. Used by the DB migration and
 * mirrors the V1 dense ordered-grid packing.
 */
export function assignDefaultGeometry(rows: Placeable[]): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>()
  const placed: Box[] = []
  const sorted = [...rows].sort((a, b) => a.order - b.order)
  for (const r of sorted) {
    const pos = findFreeSpot(placed, r.w, r.h)
    placed.push({ x: pos.x, y: pos.y, w: r.w, h: r.h })
    out.set(r.id, pos)
  }
  return out
}

/* ---------------------- Whole-page default planning ---------------- */

export interface PlanItem {
  id: string
  pageId: string
  order: number
  kind: LayoutItemKind
  /** Payload id — resolves widget presets for canonical sizing. */
  refId: string
}

export interface GeometryPlan {
  id: string
  box: Box
  /** Stacking order within the page (index in `order`-sorted items). */
  z: number
}

/**
 * Deterministic freeform geometry for whole pages: group rows by page, sort
 * each page by `order`, and run the shared first-fit packer over the canonical
 * boxes. Returns each item's box + stacking `z`. Shared by the v1→v2 Dexie
 * migration and the restore/backfill path so fresh installs, upgrades and
 * imported pre-freeform backups converge on identical canonical layout.
 */
export function planFreeformGeometry(
  items: PlanItem[],
  sizeOf: (refId: string, kind: LayoutItemKind) => WidgetSizeId | undefined,
): Map<string, GeometryPlan> {
  const byPage = new Map<string, PlanItem[]>()
  for (const it of items) {
    const list = byPage.get(it.pageId)
    if (list) list.push(it)
    else byPage.set(it.pageId, [it])
  }
  const plan = new Map<string, GeometryPlan>()
  for (const pageItems of byPage.values()) {
    const sorted = [...pageItems].sort((a, b) => a.order - b.order)
    const canonical = sorted.map((it) => {
      const box = freeBoxForKind(
        it.kind,
        it.kind === 'widget' ? sizeOf(it.refId, it.kind) : undefined,
      )
      return { id: it.id, order: it.order, w: box.w, h: box.h }
    })
    const placed = assignDefaultGeometry(canonical)
    sorted.forEach((it, z) => {
      const pos = placed.get(it.id)
      if (!pos) return
      const box = freeBoxForKind(
        it.kind,
        it.kind === 'widget' ? sizeOf(it.refId, it.kind) : undefined,
      )
      plan.set(it.id, { id: it.id, box: { x: pos.x, y: pos.y, w: box.w, h: box.h }, z })
    })
  }
  return plan
}

/* ------------------------- Snap + alignment ------------------------- */

/** Round `v` to the nearest multiple of `step`. */
export function snapTo(v: number, step = SNAP): number {
  return Math.round(v / step) * step
}

/** Clamp a box so it stays fully inside a `width`-wide canvas (≥ 0 on x). */
export function clampBoxX(box: Box, width: number): Box {
  const x = Math.max(0, Math.min(box.x, Math.max(0, width - box.w)))
  return x === box.x ? box : { ...box, x }
}

/** Clamp a box to the complete usable canvas when a height is known. */
export function clampBox(box: Box, width: number, height = Number.POSITIVE_INFINITY): Box {
  const w = Math.min(box.w, Math.max(0, width))
  const h = Math.min(box.h, Math.max(0, height))
  return {
    ...box,
    x: Math.max(0, Math.min(box.x, Math.max(0, width - w))),
    y: Math.max(0, Math.min(box.y, Math.max(0, height - h))),
    w,
    h,
  }
}

function validPosition(candidate: Box, others: Box[], width: number, height: number): boolean {
  return candidate.x >= 0 && candidate.y >= 0 && candidate.x + candidate.w <= width + 0.001 &&
    candidate.y + candidate.h <= height + 0.001 && !others.some((other) => boxesOverlap(candidate, other))
}

/** Find the closest non-overlapping position around the proposed box. */
function nearestValidPosition(proposed: Box, others: Box[], width: number, height: number): Box | null {
  const base = clampBox(proposed, width, height)
  if (validPosition(base, others, width, height)) return base
  const candidates: Box[] = []
  for (const other of others) {
    candidates.push(
      { ...base, x: other.x - base.w - FREE_GAP },
      { ...base, x: other.x + other.w + FREE_GAP },
      { ...base, y: other.y - base.h - FREE_GAP },
      { ...base, y: other.y + other.h + FREE_GAP },
      { ...base, x: other.x - base.w - FREE_GAP, y: other.y - base.h - FREE_GAP },
      { ...base, x: other.x + other.w + FREE_GAP, y: other.y + other.h + FREE_GAP },
    )
  }
  const valid = candidates
    .map((candidate) => clampBox(candidate, width, height))
    .filter((candidate) => validPosition(candidate, others, width, height))
    .sort((a, b) => Math.hypot(a.x - proposed.x, a.y - proposed.y) - Math.hypot(b.x - proposed.x, b.y - proposed.y))
  if (valid[0]) return valid[0]
  const fallback = findFreeSpot(others, base.w, base.h, height)
  return fallback ? { ...base, x: fallback.x, y: fallback.y } : null
}

/**
 * Resolve a proposed move: first try to snap to the closest matching alignment
 * guide against the OTHER tiles (moving left/centre/right onto their
 * left/centre/right, top/middle/bottom onto theirs); when no guide engages,
 * fall back to the 8px grid. Always clamp inside the canvas and above y=0.
 * Returns the resolved box plus any guide lines to draw while dragging.
 */
export function resolveMove(
  proposed: Box,
  others: Box[],
  canvasW: number,
  canvasH = Number.POSITIVE_INFINITY,
  snapStep = SNAP,
): { box: Box; guides: Array<{ axis: 'x' | 'y'; at: number }>; valid: boolean } {
  const guides: Array<{ axis: 'x' | 'y'; at: number }> = []
  const { w, h } = proposed
  let x = proposed.x
  let y = proposed.y

  // x: candidate deltas to align the moving box's left/centre/right with the
  // matching edge of any other tile. Smallest |delta| within tolerance wins.
  const xDeltas: Array<{ dx: number; at: number }> = []
  for (const b of others) {
    xDeltas.push({ dx: b.x - x, at: b.x })
    xDeltas.push({ dx: b.x + b.w / 2 - (x + w / 2), at: b.x + b.w / 2 })
    xDeltas.push({ dx: b.x + b.w - (x + w), at: b.x + b.w })
  }
  const xBest = xDeltas
    .filter((m) => Math.abs(m.dx) <= GUIDE_TOL)
    .sort((a, b) => Math.abs(a.dx) - Math.abs(b.dx))[0]
  if (xBest) {
    x += xBest.dx
    guides.push({ axis: 'x', at: xBest.at })
  } else {
    x = snapTo(x, snapStep)
  }

  // y: same over top/middle/bottom.
  const yDeltas: Array<{ dy: number; at: number }> = []
  for (const b of others) {
    yDeltas.push({ dy: b.y - y, at: b.y })
    yDeltas.push({ dy: b.y + b.h / 2 - (y + h / 2), at: b.y + b.h / 2 })
    yDeltas.push({ dy: b.y + b.h - (y + h), at: b.y + b.h })
  }
  const yBest = yDeltas
    .filter((m) => Math.abs(m.dy) <= GUIDE_TOL)
    .sort((a, b) => Math.abs(a.dy) - Math.abs(b.dy))[0]
  if (yBest) {
    y += yBest.dy
    guides.push({ axis: 'y', at: yBest.at })
  } else {
    y = snapTo(y, snapStep)
  }

  const snapped = clampBox({ ...proposed, x, y: Math.max(0, y) }, canvasW, canvasH)
  const box = nearestValidPosition(snapped, others, canvasW, canvasH)
  return { box: box ?? clampBoxX(snapped, canvasW), guides, valid: box !== null }
}

/**
 * Snap a resize (keeps the top-left anchor; right/bottom follow the grid).
 *
 * Growth is capped at the canvas edge measured from the anchored corner, so
 * enlarging a tile toward/past the right edge narrows the growth instead of
 * sliding the anchor (the corner the pointer is pulling away from) leftward.
 * Every reachable box satisfies x + w <= canvasW (moves clamp), so
 * `canvasW - proposed.x` >= the current width and the min never re-triggers
 * outside degenerate, already-persisted states.
 */
export function resolveResize(
  proposed: Box,
  min: { w: number; h: number },
  canvasW: number,
  canvasH = Number.POSITIVE_INFINITY,
  snapStep = SNAP,
): Box {
  const maxW = Math.max(min.w, canvasW - proposed.x)
  const w = Math.max(min.w, Math.min(snapTo(proposed.w, snapStep), maxW))
  const maxH = Math.max(min.h, canvasH - proposed.y)
  const h = Math.max(min.h, Math.min(snapTo(proposed.h, snapStep), maxH))
  return { x: Math.max(0, proposed.x), y: Math.max(0, proposed.y), w, h }
}
