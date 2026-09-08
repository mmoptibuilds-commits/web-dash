import type { LiquidGlassMode } from '@/types/domain'

export type LiquidGlassTier = 'webgl' | 'css' | 'solid'

interface PolicyInput {
  mode: LiquidGlassMode
  webgl: boolean
  reducedEffects: boolean
  reducedTransparency: boolean
  deviceMemory?: number
  fps?: number
  coarsePointer?: boolean
}

export function resolveLiquidGlassTier(input: PolicyInput): LiquidGlassTier {
  if (input.reducedEffects || input.reducedTransparency) return 'solid'
  if (input.mode === 'off' || !input.webgl) return 'css'
  if (input.coarsePointer && (input.mode === 'performance' || input.mode === 'balanced')) return 'css'
  if (input.mode === 'performance' && input.deviceMemory !== undefined && input.deviceMemory <= 2) return 'css'
  if (input.fps !== undefined && input.fps < 35) return 'css'
  return 'webgl'
}

export function liquidGlassConfig(
  mode: LiquidGlassMode,
  custom: { blur: number; refraction: number; chromatic: number } = { blur: 5, refraction: 0.022, chromatic: 0.002 },
) {
  if (mode === 'custom') {
    return {
      blur: Math.max(0, Math.min(10, custom.blur)),
      refraction: Math.max(0, Math.min(0.08, custom.refraction)),
      chromaticAberration: Math.max(0, Math.min(0.012, custom.chromatic)),
    }
  }
  if (mode === 'performance') return { blur: 2, refraction: 0.012, chromaticAberration: 0 }
  if (mode === 'high') return { blur: 8, refraction: 0.034, chromaticAberration: 0.004 }
  return { blur: 5, refraction: 0.022, chromaticAberration: 0.002 }
}

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
