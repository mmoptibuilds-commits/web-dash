import {
  Clock3,
  Image,
  Link2,
  Search,
  type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { WidgetInstance, WidgetSizeId } from '@/types/domain'
import type { WidgetType } from '@/types/widgets'
import { ClockWidget } from './builtins/ClockWidget'
import { SearchWidget } from './builtins/SearchWidget'
import { PhotoWidget } from './builtins/PhotoWidget'
import { EmbedWidget } from './builtins/EmbedWidget'

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
 * Shared widget registry (coordinator-owned contract). V1 ships the four
 * self-contained built-ins below; the Notes / Tasks / Calendar / Links widget
 * entries are wired here by the coordinator once their feature modules land
 * in Phase 2 — lanes never edit this file directly.
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

/** Widget picker order for Edit Mode (stable; built-ins first). */
export const ADDABLE_WIDGETS: WidgetDef[] = [
  WIDGET_REGISTRY.clock,
  WIDGET_REGISTRY.search,
].filter((d): d is WidgetDef => Boolean(d))
