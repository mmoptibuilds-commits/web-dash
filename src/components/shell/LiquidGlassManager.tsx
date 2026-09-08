import { useEffect } from 'react'
import { useSettings } from '@/hooks/data'
import { liquidGlassConfig, resolveLiquidGlassTier, supportsWebGL } from '@/lib/liquidGlass'
import { selectLiquidGlassSurfaces } from '@/lib/liquidGlassDom'

/** Owns the single selective ybouane renderer and all graceful fallbacks. */
export function LiquidGlassManager() {
  const settings = useSettings()

  useEffect(() => {
    if (!settings) return
    let disposed = false
    let instance: { destroy(): void; fps: number } | undefined
    let fpsTimer: number | undefined
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    const tier = resolveLiquidGlassTier({
      mode: settings.liquidGlassMode,
      webgl: supportsWebGL(),
      reducedEffects: settings.reducedEffects,
      reducedTransparency: settings.reducedTransparency,
      deviceMemory,
      coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    })
    document.documentElement.dataset.materialTier = tier

    if (tier !== 'webgl') return
    const surfaces = selectLiquidGlassSurfaces(document)
    if (!surfaces) {
      document.documentElement.dataset.materialTier = 'css'
      return
    }
    const { root, elements } = surfaces

    const start = async () => {
      try {
        const { LiquidGlass } = await import('@ybouane/liquidglass')
        if (disposed) return
        const chosen = liquidGlassConfig(settings.liquidGlassMode, {
          blur: settings.liquidGlassBlur,
          refraction: settings.liquidGlassRefraction,
          chromatic: settings.liquidGlassChromatic,
        })
        for (const element of elements) {
          const role = element.dataset.glassRole
          element.dataset.config = JSON.stringify({
            cornerRadius: role === 'dock' ? 18 : 0,
            zRadius: role === 'dock' ? 16 : 4,
            blurAmount: Math.min(1, chosen.blur / 10),
            refraction: chosen.refraction,
            chromAberration: chosen.chromaticAberration,
            edgeHighlight: role === 'dock' ? 0.06 : 0.025,
            specular: role === 'dock' ? 0.025 : 0.01,
            fresnel: role === 'dock' ? 0.2 : 0.1,
            opacity: role === 'dock' ? 0.92 : 0.82,
            shadowOpacity: role === 'dock' ? 0.16 : 0.06,
            floating: false,
            button: false,
          })
        }
        instance = await LiquidGlass.init({
          root,
          glassElements: elements,
          defaults: {
            blurAmount: Math.min(1, chosen.blur / 10),
            refraction: chosen.refraction,
            chromAberration: chosen.chromaticAberration,
            edgeHighlight: 0.04,
            specular: 0.02,
            fresnel: 0.18,
            distortion: 0,
            opacity: 0.9,
            shadowOpacity: 0.16,
            floating: false,
            button: false,
          },
        })
        if (disposed) instance.destroy()
        fpsTimer = window.setTimeout(() => {
          if (instance && instance.fps > 0 && instance.fps < 35) {
            instance.destroy()
            instance = undefined
            document.documentElement.dataset.materialTier = 'css'
          }
        }, 4500)
      } catch {
        document.documentElement.dataset.materialTier = 'css'
      }
    }
    const idle = window.setTimeout(() => void start(), 350)
    return () => {
      disposed = true
      window.clearTimeout(idle)
      if (fpsTimer) window.clearTimeout(fpsTimer)
      instance?.destroy()
    }
  }, [settings])

  return null
}
