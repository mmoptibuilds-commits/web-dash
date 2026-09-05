import type { ComponentType } from 'react'
import { NotesMiniApp } from '@/features/notes'
import { TasksMiniApp } from '@/features/tasks'
import { CalendarMiniApp } from '@/features/calendar'
import { BookmarksMiniApp } from '@/features/bookmarks'
import { SettingsMiniApp } from '@/features/settings'
import type { BuiltinAppId } from '@/types/domain'

/**
 * Window-content resolver. Each feature exports a self-contained component
 * that fills 100% of its parent with no outer chrome. Every window-capable
 * app has an entry here; anything else is a nav-only id and renders nothing.
 */
const MINI_APPS: Partial<Record<BuiltinAppId, ComponentType>> = {
  notes: NotesMiniApp,
  tasks: TasksMiniApp,
  calendar: CalendarMiniApp,
  bookmarks: BookmarksMiniApp,
  settings: SettingsMiniApp,
}

/** Component that renders a window-app's content for its app id. */
export function AppContent({ appId }: { appId: BuiltinAppId }) {
  const Content = MINI_APPS[appId]
  return Content ? <Content /> : null
}
