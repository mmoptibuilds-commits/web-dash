import type { ComponentType } from 'react'
import {
  Bookmark,
  Calculator,
  CalendarDays,
  Home,
  LayoutDashboard,
  ListTodo,
  Settings,
  StickyNote,
  type LucideProps,
} from 'lucide-react'
import type { BuiltinAppId } from '@/types/domain'

/** Icons used in manifests/registry must be compatible with this shape. */
export type AppIcon = ComponentType<LucideProps>

export interface BuiltinAppDescriptor {
  id: BuiltinAppId
  name: string
  description: string
  icon: AppIcon
  /** 'nav' switches mode; 'window' opens a desktop window / mobile sheet. */
  kind: 'nav' | 'window'
}

export const BUILTIN_APPS: Record<BuiltinAppId, BuiltinAppDescriptor> = {
  home: {
    id: 'home',
    name: 'Home',
    description: 'Your launcher pages.',
    icon: Home,
    kind: 'nav',
  },
  dashboard: {
    id: 'dashboard',
    name: 'Apps',
    description: 'Open the Launchpad app inventory.',
    icon: LayoutDashboard,
    kind: 'nav',
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    description: 'Lightweight local notes.',
    icon: StickyNote,
    kind: 'window',
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    description: 'A simple checklist.',
    icon: ListTodo,
    kind: 'window',
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'Month view calendar.',
    icon: CalendarDays,
    kind: 'window',
  },
  bookmarks: {
    id: 'bookmarks',
    name: 'Links',
    description: 'All your shortcuts in one place.',
    icon: Bookmark,
    kind: 'window',
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    description: 'Arithmetic, dates and currency.',
    icon: Calculator,
    kind: 'window',
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    description: 'Appearance, wallpaper, data.',
    icon: Settings,
    kind: 'window',
  },
}

export function isWindowApp(id: BuiltinAppId): boolean {
  return BUILTIN_APPS[id]?.kind === 'window'
}

/** Window-capable apps, in a stable display order. */
export function windowApps(): BuiltinAppDescriptor[] {
  return Object.values(BUILTIN_APPS).filter((a) => a.kind === 'window')
}
