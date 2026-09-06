import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/db/db'
import { clampWindowState, putWindowState, getWindowState } from './windowStates'
import type { AppWindowState } from '@/types/domain'

const base: AppWindowState = {
  appId: 'notes',
  x: 40,
  y: 60,
  w: 720,
  h: 520,
  maximized: false,
  minimized: false,
  open: true,
  lastOpenedAt: 1,
  updatedAt: 1,
}

describe('window state persistence', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('round-trips Hearth-owned geometry and lifecycle flags', async () => {
    await putWindowState(base)
    expect(await getWindowState('notes')).toMatchObject({ ...base, updatedAt: expect.any(Number) })
  })

  it('clamps a restored window to the usable viewport', () => {
    const result = clampWindowState(
      { ...base, x: 1400, y: -40, w: 1600, h: 1400 },
      { width: 1280, height: 800, top: 46, bottom: 704, inset: 8 },
    )
    expect(result.x + result.w).toBeLessThanOrEqual(1272)
    expect(result.y).toBeGreaterThanOrEqual(54)
    expect(result.y + result.h).toBeLessThanOrEqual(704)
    expect(result.w).toBeGreaterThanOrEqual(300)
    expect(result.h).toBeGreaterThanOrEqual(220)
  })
})
