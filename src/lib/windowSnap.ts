import type { WindowBounds, WindowSnapMode } from '@/types/domain'

export type { WindowBounds, WindowSnapMode } from '@/types/domain'

export interface WorkArea {
  left: number
  top: number
  right: number
  bottom: number
}

export interface SnappableBounds extends WindowBounds {
  snapMode?: WindowSnapMode | null
  restoreBounds?: WindowBounds
}

export function snapBounds(mode: WindowSnapMode, area: WorkArea): WindowBounds {
  const width = Math.max(0, area.right - area.left)
  const height = Math.max(0, area.bottom - area.top)
  const halfW = Math.round(width / 2)
  const halfH = Math.round(height / 2)
  const rightW = width - halfW
  const bottomH = height - halfH

  switch (mode) {
    case 'left':
      return { x: area.left, y: area.top, w: halfW, h: height }
    case 'right':
      return { x: area.left + halfW, y: area.top, w: rightW, h: height }
    case 'top-left':
      return { x: area.left, y: area.top, w: halfW, h: halfH }
    case 'top-right':
      return { x: area.left + halfW, y: area.top, w: rightW, h: halfH }
    case 'bottom-left':
      return { x: area.left, y: area.top + halfH, w: halfW, h: bottomH }
    case 'bottom-right':
      return { x: area.left + halfW, y: area.top + halfH, w: rightW, h: bottomH }
    case 'maximize':
      return { x: area.left, y: area.top, w: width, h: height }
  }
}

/** Resolve a drag release near the work-area edge into a native snap target. */
export function resolveSnapMode(
  point: { x: number; y: number },
  area: WorkArea,
  edge = 24,
): WindowSnapMode | null {
  const left = point.x <= area.left + edge
  const right = point.x >= area.right - edge
  const top = point.y <= area.top + edge
  const bottom = point.y >= area.bottom - edge
  if (left && top) return 'top-left'
  if (right && top) return 'top-right'
  if (left && bottom) return 'bottom-left'
  if (right && bottom) return 'bottom-right'
  if (left) return 'left'
  if (right) return 'right'
  if (top) return 'maximize'
  return null
}

export function applyWindowSnap<T extends SnappableBounds>(
  state: T,
  mode: WindowSnapMode,
  area: WorkArea,
): T & { snapMode: WindowSnapMode; restoreBounds: WindowBounds } {
  const restoreBounds = state.restoreBounds ?? {
    x: state.x,
    y: state.y,
    w: state.w,
    h: state.h,
  }
  return { ...state, ...snapBounds(mode, area), snapMode: mode, restoreBounds }
}

export function restoreWindowBounds(state: SnappableBounds): WindowBounds {
  return state.restoreBounds ?? { x: state.x, y: state.y, w: state.w, h: state.h }
}
