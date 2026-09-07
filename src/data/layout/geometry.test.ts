import { describe, expect, it } from 'vitest'
import {
  FREE_CANVAS_W,
  MIN_BOX,
  assignDefaultGeometry,
  clampBoxX,
  findFreeSpot,
  freeBoxForKind,
  itemBox,
  planFreeformGeometry,
  resolveMove,
  resolveResize,
  snapTo,
  type Box,
  boxesOverlap,
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

  it('never ships a preset below the enforced per-kind minimum', () => {
    // A resize can't shrink below MIN_BOX, so every canonical default (the
    // size a tile is first placed at) must already satisfy it — otherwise
    // "shrink" would grow the tile.
    for (const kind of ['shortcut', 'folder', 'widget'] as const) {
      const sizes = kind === 'widget' ? (['small', 'medium', 'large'] as const) : ([undefined] as const)
      for (const s of sizes) {
        const b = freeBoxForKind(kind, s)
        expect(b.w).toBeGreaterThanOrEqual(MIN_BOX[kind].w)
        expect(b.h).toBeGreaterThanOrEqual(MIN_BOX[kind].h)
      }
    }
    // Widget min equals the smallest shipped preset (small 170×110).
    expect(MIN_BOX.widget).toEqual({ w: 170, h: 110 })
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

describe('planFreeformGeometry', () => {
  const items = [
    { id: 'a', pageId: 'p1', order: 0, kind: 'widget' as const, refId: 'a' },
    { id: 'b', pageId: 'p1', order: 1, kind: 'shortcut' as const, refId: 'b' },
    { id: 'x', pageId: 'p2', order: 0, kind: 'shortcut' as const, refId: 'x' },
  ]

  it('packs each page on its own canonical grid and stacks by order', () => {
    const plan = planFreeformGeometry(items, (refId) => (refId === 'a' ? 'small' : undefined))
    expect(plan.size).toBe(3)
    expect(plan.get('a')?.box).toEqual({ x: 0, y: 0, w: 170, h: 110 })
    expect(plan.get('a')?.z).toBe(0)
    expect(plan.get('b')?.box).toEqual({ x: 190, y: 0, w: 170, h: 110 })
    expect(plan.get('b')?.z).toBe(1)
    // A second page repacks from its own origin.
    expect(plan.get('x')?.box).toEqual({ x: 0, y: 0, w: 170, h: 110 })
    expect(plan.get('x')?.z).toBe(0)
  })

  it('sizes widget boxes from the size lookup (large = 740 wide)', () => {
    const plan = planFreeformGeometry(
      [{ id: 'w', pageId: 'p', order: 0, kind: 'widget' as const, refId: 'w' }],
      () => 'large',
    )
    expect(plan.get('w')?.box).toEqual({ x: 0, y: 0, w: 740, h: 240 })
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
    expect(r.box.x).toBe(310) // nearest valid slot is immediately left of the neighbour
    expect(r.box.y).toBe(0)
    expect(r.guides).toEqual([{ axis: 'x', at: 500 }])
  })

  it('aligns y against top/middle/bottom too', () => {
    const others = [box(0, 0, 170, 240)]
    // Bottom edge 2px above the neighbour's bottom → snaps down to match it.
    const r = resolveMove(box(0, 128, 170, 110), others, canvasW)
    expect(r.box.y).toBe(260) // the snapped position would overlap; resolve below it
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

  it('resolves an occupied move to a bounded, non-overlapping slot', () => {
    const other = box(320, 120, 360, 240)
    const result = resolveMove(box(350, 150, 170, 110), [other], 1120, 520)
    expect(result.valid).toBe(true)
    expect(result.box.x).toBeGreaterThanOrEqual(0)
    expect(result.box.y).toBeGreaterThanOrEqual(0)
    expect(result.box.x + result.box.w).toBeLessThanOrEqual(1120)
    expect(result.box.y + result.box.h).toBeLessThanOrEqual(520)
    expect(boxesOverlap(result.box, other)).toBe(false)
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

  it('caps growth at the canvas edge without moving the anchored corner', () => {
    // A right-hand tile pulled past the edge keeps x and caps the width rather
    // than sliding the anchor (top-left) leftward.
    const r = resolveResize(box(200, 0, 300, 100), min, canvasW)
    expect(r.x).toBe(200)
    expect(r.w).toBe(200) // canvasW - x
    // Growth that still fits stays on the lattice and inside the canvas.
    const fit = resolveResize(box(100, 0, 200, 96), min, canvasW)
    expect(fit).toEqual(box(100, 0, 200, 96))
  })

  it('caps height at the bottom edge', () => {
    const r = resolveResize(box(0, 420, 220, 220), min, 400, 520)
    expect(r.y + r.h).toBeLessThanOrEqual(520)
  })
})
