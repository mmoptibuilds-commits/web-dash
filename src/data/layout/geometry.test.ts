import { describe, expect, it } from 'vitest'
import {
  FREE_CANVAS_W,
  assignDefaultGeometry,
  clampBoxX,
  findFreeSpot,
  freeBoxForKind,
  itemBox,
  resolveMove,
  resolveResize,
  snapTo,
  type Box,
} from './geometry'

function box(x: number, y: number, w: number, h: number): Box {
  return { x, y, w, h }
}

describe('freeBoxForKind', () => {
  it('gives icons a 1×1 canonical cell and widgets a canonical size', () => {
    for (const k of ['shortcut', 'folder'] as const) {
      const b = freeBoxForKind(k)
      expect(b.w).toBe(170)
      expect(b.h).toBe(110)
    }
    expect(freeBoxForKind('widget', 'small')).toEqual({ x: 0, y: 0, w: 170, h: 110 })
    expect(freeBoxForKind('widget', 'medium')).toEqual({ x: 0, y: 0, w: 360, h: 240 })
    expect(freeBoxForKind('widget', 'large')).toEqual({ x: 0, y: 0, w: 740, h: 240 })
  })

  it('defaults widget size to medium when unspecified', () => {
    expect(freeBoxForKind('widget')).toEqual(freeBoxForKind('widget', 'medium'))
  })
})

describe('itemBox', () => {
  it('prefers persisted geometry over the canonical fallback', () => {
    expect(
      itemBox({ kind: 'widget', x: 10, y: 20, w: 300, h: 150 }, 'medium'),
    ).toEqual(box(10, 20, 300, 150))
  })

  it('falls back to canonical per-kind when geometry is absent', () => {
    expect(itemBox({ kind: 'shortcut' })).toEqual(box(0, 0, 170, 110))
    expect(itemBox({ kind: 'widget' }, 'large')).toEqual(box(0, 0, 740, 240))
  })
})

describe('findFreeSpot', () => {
  it('places the first item at the origin', () => {
    expect(findFreeSpot([], 170, 110)).toEqual({ x: 0, y: 0 })
  })

  it('moves to the next column when a row is occupied', () => {
    const placed = [box(0, 0, 170, 110)]
    expect(findFreeSpot(placed, 170, 110)).toEqual({ x: 190, y: 0 })
  })

  it('walks down the row after the last column is taken', () => {
    const fullRow = Array.from({ length: 6 }, (_, i) => box(i * 190, 0, 170, 110))
    expect(findFreeSpot(fullRow, 170, 110)).toEqual({ x: 0, y: 130 })
  })

  it('skips occupied slots and never overlaps', () => {
    const placed = [box(0, 0, 190, 240)] // covers first column + row 0 area
    const p = findFreeSpot(placed, 170, 110)
    const probe = { ...p, w: 170, h: 110 }
    for (const b of placed) {
      const overlap = probe.x < b.x + b.w && probe.x + probe.w > b.x
      expect(overlap).toBe(false)
    }
  })

  it('falls back below everything on a dense canvas', () => {
    // Fill the whole first two rows (6 columns × 2 rows); the first free slot
    // lands at the start of the third.
    const placed = [0, 130].flatMap((y) =>
      Array.from({ length: 6 }, (_, i) => box(i * 190, y, 170, 110)),
    )
    const p = findFreeSpot(placed, 170, 110)
    expect(p.x).toBe(0)
    expect(p.y).toBeGreaterThanOrEqual(260)
  })
})

describe('assignDefaultGeometry', () => {
  it('packs items deterministically by order, mirroring the V1 grid', () => {
    const rows = [
      { id: 'a', order: 0, w: 170, h: 110 },
      { id: 'b', order: 1, w: 170, h: 110 },
      { id: 'c', order: 2, w: 360, h: 240 },
    ]
    const m = assignDefaultGeometry(rows)
    expect(m.get('a')).toEqual({ x: 0, y: 0 })
    expect(m.get('b')).toEqual({ x: 190, y: 0 })
    // Medium widget starts at column 2 (x=380) and still fits the 1120 canvas.
    expect(m.get('c')).toEqual({ x: 380, y: 0 })
  })

  it('is order-stable regardless of input ordering', () => {
    const base = [
      { id: 'a', order: 0, w: 170, h: 110 },
      { id: 'b', order: 1, w: 170, h: 110 },
    ]
    const rev = [...base].reverse()
    expect(assignDefaultGeometry(base)).toEqual(assignDefaultGeometry(rev))
  })
})

describe('snap / clamp', () => {
  it('snaps to the 8px grid', () => {
    expect(snapTo(0)).toBe(0)
    expect(snapTo(7)).toBe(8)
    expect(snapTo(194)).toBe(192)
    expect(snapTo(196)).toBe(200)
  })

  it('clamps inside the canvas width', () => {
    expect(clampBoxX(box(0, 0, 170, 110), 400)).toEqual(box(0, 0, 170, 110))
    expect(clampBoxX(box(300, 0, 170, 110), 400)).toEqual(box(230, 0, 170, 110))
    expect(clampBoxX(box(-20, 0, 170, 110), 400)).toEqual(box(0, 0, 170, 110))
  })
})

describe('resolveMove', () => {
  const canvasW = FREE_CANVAS_W

  it('grid-snaps when no guide is close', () => {
    const r = resolveMove(box(194, 6, 170, 110), [], canvasW)
    expect(r.box.x).toBe(192)
    expect(r.box.y).toBe(8)
    expect(r.guides).toEqual([])
  })

  it('aligns to a neighbour edge within tolerance and reports the guide', () => {
    const others = [box(500, 100, 360, 240)]
    // Left edge 5px off the neighbour's left edge → snaps to it (grid would give 192).
    const r = resolveMove(box(495, 0, 170, 110), others, canvasW)
    expect(r.box.x).toBe(500)
    expect(r.box.y).toBe(0) // no y guide nearby; y grid-snaps to its own value
    expect(r.guides).toEqual([{ axis: 'x', at: 500 }])
  })

  it('aligns y against top/middle/bottom too', () => {
    const others = [box(0, 0, 170, 240)]
    // Bottom edge 2px above the neighbour's bottom → snaps down to match it.
    const r = resolveMove(box(0, 128, 170, 110), others, canvasW)
    expect(r.box.y).toBe(130)
    expect(r.box.x).toBe(0)
    expect(r.guides).toContainEqual({ axis: 'y', at: 240 })
  })

  it('aligns centres when edges are far but centres are near', () => {
    const others = [box(300, 0, 100, 100)]
    // moving centre 250+100=350 lands 0px off the neighbour's centre 350.
    const r = resolveMove(box(254, 0, 200, 100), others, canvasW)
    expect(r.box.x).toBe(250)
    expect(r.guides).toContainEqual({ axis: 'x', at: 350 })
  })

  it('clamps x inside the canvas and y above zero', () => {
    const r = resolveMove(box(1100, -4, 170, 110), [], canvasW)
    expect(r.box.x).toBeLessThanOrEqual(canvasW - 170)
    expect(r.box.y).toBe(0)
  })

  it('picks the closer of two competing guides', () => {
    const others = [box(100, 0, 100, 100), box(180, 0, 100, 100)]
    // moving left at ~176 is 4px from 180 but 76px from 100 → picks 180.
    const r = resolveMove(box(176, 0, 50, 50), others, canvasW)
    expect(r.box.x).toBe(180)
  })
})

describe('resolveResize', () => {
  const min = { w: 120, h: 84 }
  const canvasW = 400

  it('snaps sizes to the grid', () => {
    const r = resolveResize(box(0, 0, 167, 105), min, canvasW)
    expect(r.w).toBe(168)
    expect(r.h).toBe(104)
  })

  it('enforces the per-kind minimum', () => {
    const r = resolveResize(box(0, 0, 40, 40), min, canvasW)
    expect(r.w).toBe(min.w)
    expect(r.h).toBe(min.h)
  })

  it('clamps the anchor so the box stays inside the canvas', () => {
    const r = resolveResize(box(360, 0, 300, 200), min, canvasW)
    expect(r.x).toBeLessThanOrEqual(canvasW - r.w)
  })
})
