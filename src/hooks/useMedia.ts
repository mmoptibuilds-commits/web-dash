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

/**
 * True when the Home freeform canvas can actually contain the canonical
 * FREE_CANVAS_W layout (1120px + the page's 2×24px padding = 1168px). Between
 * the 1024px desktop breakpoint and this width the canvas measures under 1120px
 * and persisted px geometry would overflow onto neighbours, so Home stays on
 * the reflowing ordered grid there.
 */
export function useFreeformCanvas(): boolean {
  return useMediaQuery('(min-width: 1168px)')
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
