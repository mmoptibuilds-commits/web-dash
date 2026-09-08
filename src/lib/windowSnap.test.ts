import { describe, expect, it } from 'vitest'
import { applyWindowSnap, restoreWindowBounds, resolveSnapMode, snapBounds } from './windowSnap'

const area = { left: 8, top: 52, right: 1432, bottom: 798 }

describe('snapBounds', () => {
  it('returns bounded halves and four corners', () => {
    expect(snapBounds('left', area)).toEqual({ x: 8, y: 52, w: 712, h: 746 })
    expect(snapBounds('right', area)).toEqual({ x: 720, y: 52, w: 712, h: 746 })
    expect(snapBounds('top-left', area)).toEqual({ x: 8, y: 52, w: 712, h: 373 })
    expect(snapBounds('bottom-right', area)).toEqual({ x: 720, y: 425, w: 712, h: 373 })
  })

  it('uses the complete work area for maximize', () => {
    expect(snapBounds('maximize', area)).toEqual({ x: 8, y: 52, w: 1424, h: 746 })
  })
})

describe('resolveSnapMode', () => {
  it('maps drag release edges and corners to snap targets', () => {
    expect(resolveSnapMode({ x: 2, y: 120 }, area)).toBe('left')
    expect(resolveSnapMode({ x: 1437, y: 120 }, area)).toBe('right')
    expect(resolveSnapMode({ x: 5, y: 50 }, area)).toBe('top-left')
    expect(resolveSnapMode({ x: 1436, y: 50 }, area)).toBe('top-right')
    expect(resolveSnapMode({ x: 700, y: 49 }, area)).toBe('maximize')
    expect(resolveSnapMode({ x: 700, y: 400 }, area)).toBeNull()
  })
})

describe('snap restoration', () => {
  it('captures the floating bounds once and restores them after switching snap modes', () => {
    const floating = { x: 180, y: 110, w: 720, h: 520 }
    const left = applyWindowSnap({ ...floating }, 'left', area)
    expect(left.restoreBounds).toEqual(floating)
    const corner = applyWindowSnap(left, 'top-right', area)
    expect(corner.restoreBounds).toEqual(floating)
    expect(restoreWindowBounds(corner)).toEqual(floating)
  })
})
