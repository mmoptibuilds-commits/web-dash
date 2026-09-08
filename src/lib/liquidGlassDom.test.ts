import { describe, expect, it } from 'vitest'
import { selectLiquidGlassSurfaces } from './liquidGlassDom'

describe('selectLiquidGlassSurfaces', () => {
  it('selects only direct high-value shell surfaces from the capture root', () => {
    document.body.innerHTML = `
      <div id="root">
        <div id="hearth-shell">
          <div data-glass-role="statusbar"></div>
          <main data-glass-role="window"></main>
          <div data-glass-role="dock"></div>
        </div>
        <div data-glass-role="dock"></div>
      </div>
    `

    const selection = selectLiquidGlassSurfaces(document)

    expect(selection?.root.id).toBe('hearth-shell')
    expect(Array.from(selection?.elements ?? [], (element) => element.dataset.glassRole)).toEqual([
      'statusbar',
      'dock',
    ])
  })

  it('returns null until both the status bar and Dock are mounted', () => {
    document.body.innerHTML = `
      <div id="hearth-shell">
        <div data-glass-role="statusbar"></div>
      </div>
    `

    expect(selectLiquidGlassSurfaces(document)).toBeNull()
  })
})
