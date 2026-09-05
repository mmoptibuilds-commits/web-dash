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
  widget: { w: 220, h: 140 },
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

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * First free slot for a `w`×`h` box placed on the canonical column/row pitch,
 * left-to-right / top-to-bottom, that does not overlap any existing box.
 * Bounded by the canonical canvas width; rows may extend below without limit.
 */
export function findFreeSpot(existing: Box[], w: number, h: number): { x: number; y: number } {
  const maxX = FREE_CANVAS_W - w
  for (let row = 0; row < 400; row++) {
    const y = row * ROW_PITCH
    for (let col = 0; col < FREE_COLS; col++) {
      const x = Math.max(0, col * COL_PITCH)
      if (x > maxX) break
      const probe: Box = { x, y, w, h }
      if (!existing.some((b) => overlaps(b, probe))) return { x, y }
    }
  }
  // Extremely dense canvas: fall back to a position below everything.
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
): { box: Box; guides: Array<{ axis: 'x' | 'y'; at: number }> } {
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
    x = snapTo(x)
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
    y = snapTo(y)
  }

  const box = clampBoxX({ ...proposed, x, y: Math.max(0, y) }, canvasW)
  return { box, guides }
}

/** Snap a resize (keeps the top-left anchor; right/bottom follow the grid). */
export function resolveResize(
  proposed: Box,
  min: { w: number; h: number },
  canvasW: number,
): Box {
  const w = Math.max(min.w, snapTo(proposed.w))
  const h = Math.max(min.h, snapTo(proposed.h))
  return clampBoxX({ ...proposed, w, h }, canvasW)
}
