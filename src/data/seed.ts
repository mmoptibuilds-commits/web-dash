import { db } from '@/data/db/db'
import { defaultSettings } from '@/data/defaults'
import { hasSettingsRow } from '@/data/repositories/settings'
import { createPage } from '@/data/repositories/pages'
import { createShortcut } from '@/data/repositories/shortcuts'
import { addItemToPage } from '@/data/repositories/layout'
import { createFolder, addShortcutToFolder } from '@/data/repositories/folders'
import { createWidgetInstance } from '@/data/repositories/widgets'
import type { BuiltinAppId } from '@/types/domain'

/**
 * First-run starter experience. Generic, public-repo-safe content only.
 * Runs exactly once (when the settings row is absent). Idempotent guard on
 * top of the write so parallel tabs can't double-seed.
 */
export async function ensureBootData(): Promise<boolean> {
  if (await hasSettingsRow()) return false

  // Reserve settings first (acts as the "initialized" flag).
  await db.settings.put(defaultSettings())

  const page = await createPage('Home')

  // Built-in starter widgets.
  const search = await createWidgetInstance('search', 'medium')
  const clock = await createWidgetInstance('clock', 'small')

  // Starter web shortcuts (generic, public-repo-safe).
  const starter: Array<[string, string]> = [
    ['Google', 'https://google.com'],
    ['YouTube', 'https://youtube.com'],
    ['GitHub', 'https://github.com'],
    ['Gmail', 'https://mail.google.com'],
    ['Wikipedia', 'https://wikipedia.org'],
  ]

  await addItemToPage(page.id, 'widget', search.id)
  for (const [label, url] of starter) {
    const res = await createShortcut({ label, url })
    if (res.ok) await addItemToPage(page.id, 'shortcut', res.shortcut.id)
  }
  await addItemToPage(page.id, 'widget', clock.id)

  // A folder demo with developer links.
  const dev = await createFolder('Dev')
  for (const [label, url] of [
    ['MDN', 'https://developer.mozilla.org'],
    ['Stack Overflow', 'https://stackoverflow.com'],
  ] as Array<[string, string]>) {
    const res = await createShortcut({ label, url })
    if (res.ok) await addShortcutToFolder(dev.id, res.shortcut.id)
  }
  await addItemToPage(page.id, 'folder', dev.id)

  // Default dock.
  const apps: BuiltinAppId[] = [
    'dashboard',
    'notes',
    'tasks',
    'calendar',
    'bookmarks',
    'settings',
  ]
  await db.dockItems.bulkPut(
    apps.map((appId, i) => ({
      id: `dock-default-${i}-${appId}`,
      order: i,
      appId,
      shortcutId: null,
    })),
  )

  return true
}

/** Complete data reset used by Settings → Reset. */
export async function wipeAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.settings,
      db.homePages,
      db.layoutItems,
      db.shortcuts,
      db.folders,
      db.widgetInstances,
      db.notes,
      db.tasks,
      db.history,
      db.wallpapers,
      db.dockItems,
    ],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.homePages.clear(),
        db.layoutItems.clear(),
        db.shortcuts.clear(),
        db.folders.clear(),
        db.widgetInstances.clear(),
        db.notes.clear(),
        db.tasks.clear(),
        db.history.clear(),
        db.wallpapers.clear(),
        db.dockItems.clear(),
      ])
    },
  )
  // Seed the full first-run state again. ensureBootData() reserves the
  // settings row itself as its "initialized" flag, so writing it here first
  // would make the guard bail out early and leave Home/dock unseeded.
  await ensureBootData()
}
