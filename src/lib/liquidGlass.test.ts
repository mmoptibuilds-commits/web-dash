import { describe, expect, it } from 'vitest'
import { liquidGlassConfig, resolveLiquidGlassTier } from './liquidGlass'

describe('Liquid Glass policy', () => {
  it('uses solid surfaces for explicit accessibility preferences', () => {
    expect(resolveLiquidGlassTier({ mode: 'balanced', webgl: true, reducedEffects: true, reducedTransparency: false })).toBe('solid')
    expect(resolveLiquidGlassTier({ mode: 'high', webgl: true, reducedEffects: false, reducedTransparency: true })).toBe('solid')
  })

  it('falls back to CSS if WebGL is unavailable or adaptive performance is poor', () => {
    expect(resolveLiquidGlassTier({ mode: 'balanced', webgl: false, reducedEffects: false, reducedTransparency: false })).toBe('css')
    expect(resolveLiquidGlassTier({ mode: 'performance', webgl: true, reducedEffects: false, reducedTransparency: false, deviceMemory: 2 })).toBe('css')
    expect(resolveLiquidGlassTier({ mode: 'balanced', webgl: true, reducedEffects: false, reducedTransparency: false, coarsePointer: true })).toBe('css')
  })

  it('maps presets and custom controls to renderer configuration', () => {
    expect(liquidGlassConfig('performance')).toMatchObject({ blur: 2, refraction: 0.36 })
    expect(liquidGlassConfig('balanced')).toMatchObject({ blur: 5, refraction: 0.58 })
    expect(liquidGlassConfig('high')).toMatchObject({ blur: 8, refraction: 0.78 })
    expect(liquidGlassConfig('custom', { blur: 7, refraction: 0.7, chromatic: 0.08 })).toMatchObject({ blur: 7, refraction: 0.7, chromaticAberration: 0.08 })
    expect(liquidGlassConfig('custom', { blur: 99, refraction: 2, chromatic: 1 })).toEqual({
      blur: 10,
      refraction: 1,
      chromaticAberration: 0.12,
    })
  })
})
