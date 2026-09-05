import {
  Bookmark,
  CalendarDays,
  Clock3,
  Image,
  Link2,
  ListTodo,
  Search,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { WidgetInstance, WidgetSizeId } from '@/types/domain'
import type { WidgetType } from '@/types/widgets'
import { ClockWidget } from './builtins/ClockWidget'
import { SearchWidget } from './builtins/SearchWidget'
import { PhotoWidget } from './builtins/PhotoWidget'
import { EmbedWidget } from './builtins/EmbedWidget'
import { NotesWidget } from '@/features/notes'
import { TasksWidget } from '@/features/tasks'
import { CalendarWidget } from '@/features/calendar'
import { BookmarksWidget } from '@/features/bookmarks'

export interface WidgetComponentProps {
  instance: WidgetInstance
  editMode?: boolean
}

export interface WidgetDef {
  type: WidgetType
  name: string
  description: string
  icon: LucideIcon
  /** Sizes the user may pick in Edit Mode. */
  sizes: WidgetSizeId[]
  defaultSize: WidgetSizeId
  component: ComponentType<WidgetComponentProps>
}

/**
 * Shared widget registry (coordinator-owned contract). One entry per V1
 * widget type in the specification's built-in list: clock/search core,
 * the four productivity companions beside their mini-app features, and the
 * generic photo/embed widgets.
 */
export const WIDGET_REGISTRY: Partial<Record<WidgetType, WidgetDef>> = {
  clock: {
    type: 'clock',
    name: 'Clock',
    description: 'Time and date.',
    icon: Clock3,
    sizes: ['small', 'medium'],
    defaultSize: 'small',
    component: ClockWidget,
  },
  search: {
    type: 'search',
    name: 'Search',
    description: 'Address bar + search engine.',
    icon: Search,
    sizes: ['medium', 'large'],
    defaultSize: 'medium',
    component: SearchWidget,
  },
  notes: {
    type: 'notes',
    name: 'Notes',
    description: 'Your recent notes.',
    icon: StickyNote,
    sizes: ['small', 'medium'],
    defaultSize: 'medium',
    component: NotesWidget,
  },
  tasks: {
    type: 'tasks',
    name: 'Tasks',
    description: 'Open checklist items.',
    icon: ListTodo,
    sizes: ['medium', 'large'],
    defaultSize: 'medium',
    component: TasksWidget,
  },
  calendar: {
    type: 'calendar',
    name: 'Calendar',
    description: 'Current month at a glance.',
    icon: CalendarDays,
    sizes: ['medium', 'large'],
    defaultSize: 'medium',
    component: CalendarWidget,
  },
  bookmarks: {
    type: 'bookmarks',
    name: 'Links',
    description: 'Your saved shortcuts.',
    icon: Bookmark,
    sizes: ['medium', 'large'],
    defaultSize: 'medium',
    component: BookmarksWidget,
  },
  photo: {
    type: 'photo',
    name: 'Photo',
    description: 'Show an image.',
    icon: Image,
    sizes: ['small', 'medium', 'large'],
    defaultSize: 'medium',
    component: PhotoWidget,
  },
  embed: {
    type: 'embed',
    name: 'Embed',
    description: 'Embed a web page.',
    icon: Link2,
    sizes: ['medium', 'large'],
    defaultSize: 'large',
    component: EmbedWidget,
  },
}

export function getWidgetDef(type: string): WidgetDef | undefined {
  return WIDGET_REGISTRY[type as WidgetType]
}

/** Add-widget order in Edit Mode (stable; matches the spec's built-in list). */
export const ADDABLE_WIDGETS: WidgetDef[] = (
  [
    'clock',
    'search',
    'notes',
    'tasks',
    'calendar',
    'bookmarks',
    'photo',
    'embed',
  ] as WidgetType[]
)
  .map((type) => WIDGET_REGISTRY[type])
  .filter((d): d is WidgetDef => Boolean(d))
