import { describe, expect, it } from 'vitest'
import { canUseFreeformCanvas } from './useMedia'

describe('canUseFreeformCanvas', () => {
  it('keeps Home on the responsive grid until the canonical canvas fits', () => {
    expect(canUseFreeformCanvas(1024, 1120)).toBe(false)
    expect(canUseFreeformCanvas(1167, 1120)).toBe(false)
    expect(canUseFreeformCanvas(1168, 1120)).toBe(true)
  })

  it('does not independently clamp and overlap tiles when a custom canvas is too small', () => {
    expect(canUseFreeformCanvas(1440, 960)).toBe(false)
    expect(canUseFreeformCanvas(1440, 1120)).toBe(true)
  })
})
