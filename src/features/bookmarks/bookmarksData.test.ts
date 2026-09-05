import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/data/db/db'
import { shortcutRepo } from '@/data/repositories'

async function resetDb() {
  await db.delete()
  await db.open()
}

describe('shortcut create validation (shared store)', () => {
  beforeEach(resetDb)

  it('rejects unsafe schemes and reports a reason', async () => {
    const bad = await shortcutRepo.createShortcut({ label: 'x', url: 'javascript:alert(1)' })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.reason.length).toBeGreaterThan(0)
    expect(await db.shortcuts.count()).toBe(0)
  })

  it('normalizes input on create', async () => {
    const good = await shortcutRepo.createShortcut({ label: 'GitHub', url: 'github.com' })
    expect(good.ok).toBe(true)
    if (good.ok) {
      expect(good.shortcut.url).toBe('https://github.com/')
      expect(good.shortcut.label).toBe('GitHub')
    }
  })

  it('falls back to the host as the label when none is given', async () => {
    const res = await shortcutRepo.createShortcut({ label: '', url: 'https://example.com' })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.shortcut.label).toBe('example.com')
  })
})
