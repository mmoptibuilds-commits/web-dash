import { db } from '@/data/db/db'
import { defaultSettings } from '@/data/defaults'
import type { AppWindowState, BuiltinAppId } from '@/types/domain'

const MIN_W = 300
const MIN_H = 220
const DEFAULT_X = 120
const DEFAULT_Y = 86

export interface WindowViewport {
  width: number
  height: number
  top: number
  bottom: number
  inset: number
}

export function clampWindowState(
  state: Pick<AppWindowState, 'x' | 'y' | 'w' | 'h' | 'maximized' | 'minimized' | 'open' | 'appId' | 'lastOpenedAt' | 'updatedAt'>,
  viewport: WindowViewport,
): AppWindowState {
  const w = Math.max(MIN_W, Math.min(Math.round(state.w), viewport.width - viewport.inset * 2))
  const h = Math.max(MIN_H, Math.min(Math.round(state.h), viewport.bottom - viewport.top - viewport.inset * 2))
  const maxX = Math.max(viewport.inset, viewport.width - viewport.inset - w)
  const minX = Math.max(viewport.inset, Math.min(viewport.inset - w + 120, maxX))
  const maxY = Math.max(viewport.top + viewport.inset, viewport.bottom - viewport.inset - h)
  const x = Math.max(minX, Math.min(Math.round(state.x), maxX))
  const y = Math.max(viewport.top + viewport.inset, Math.min(Math.round(state.y), maxY))
  return { ...state, x, y, w, h, updatedAt: Date.now() }
}

export async function listWindowStates(): Promise<AppWindowState[]> {
  return db.windowStates.toArray()
}

export async function getWindowState(appId: BuiltinAppId): Promise<AppWindowState | undefined> {
  return db.windowStates.get(appId)
}

export async function putWindowState(state: AppWindowState): Promise<void> {
  await db.windowStates.put({ ...state, updatedAt: Date.now() })
}

export async function markWindowClosed(appId: BuiltinAppId): Promise<void> {
  const current = await db.windowStates.get(appId)
  if (current) await putWindowState({ ...current, open: false, minimized: false })
}

export async function clearWindowStates(): Promise<void> {
  await db.windowStates.clear()
}

export function defaultWindowState(appId: BuiltinAppId, count = 0): AppWindowState {
  const settings = defaultSettings()
  const now = Date.now()
  return {
    appId,
    x: DEFAULT_X + (count % 5) * 28,
    y: DEFAULT_Y + (count % 5) * 24,
    w: settings.defaultWindowWidth,
    h: settings.defaultWindowHeight,
    maximized: false,
    minimized: false,
    open: true,
    lastOpenedAt: now,
    updatedAt: now,
  }
}
