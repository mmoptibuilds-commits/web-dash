import { useEffect, useState } from 'react'

function subscribe(query: string, cb: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const update = () => setMatches(window.matchMedia(query).matches)
    update()
    return subscribe(query, update)
  }, [query])
  return matches
}

/** Desktop chrome (menu bar + floating windows) at >= 1024px. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

const FREEFORM_VIEWPORT_MIN = 1168
const FREEFORM_CANVAS_MIN = 1120

/**
 * Freeform coordinates are persisted in the canonical 1120px coordinate
 * space. Rendering that model into a smaller canvas and clamping each tile on
 * its own folds right-edge tiles over their neighbours. Keep the responsive
 * grid active unless both the viewport and configured canvas can contain the
 * coordinate space unchanged.
 */
export function canUseFreeformCanvas(viewportWidth: number, canvasMaxWidth: number): boolean {
  return viewportWidth >= FREEFORM_VIEWPORT_MIN && canvasMaxWidth >= FREEFORM_CANVAS_MIN
}

/**
 * True when the Home freeform canvas can actually contain the canonical
 * FREE_CANVAS_W layout (1120px + the page's 2×24px padding = 1168px). Between
 * the 1024px desktop breakpoint and this width the canvas measures under 1120px
 * and persisted px geometry would overflow onto neighbours, so Home stays on
 * the reflowing ordered grid there.
 */
export function useFreeformCanvas(canvasMaxWidth = FREEFORM_CANVAS_MIN): boolean {
  const viewportFits = useMediaQuery(`(min-width: ${FREEFORM_VIEWPORT_MIN}px)`)
  return viewportFits && canUseFreeformCanvas(window.innerWidth, canvasMaxWidth)
}

export function usePrefersDark(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** Live current time (updates every `intervalMs`, default 30s). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
