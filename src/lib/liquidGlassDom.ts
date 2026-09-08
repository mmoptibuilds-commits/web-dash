export interface LiquidGlassSurfaces {
  root: HTMLElement
  elements: HTMLElement[]
}

/** Resolve the one capture root and its two approved direct WebGL surfaces. */
export function selectLiquidGlassSurfaces(doc: Document): LiquidGlassSurfaces | null {
  const root = doc.getElementById('hearth-shell')
  if (!root) return null
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>(
      ':scope > [data-glass-role="statusbar"], :scope > [data-glass-role="dock"]',
    ),
  )
  const roles = new Set(elements.map((element) => element.dataset.glassRole))
  if (!roles.has('statusbar') || !roles.has('dock')) return null
  return { root, elements }
}
