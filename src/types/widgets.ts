import type { WidgetSizeId } from '@/types/domain'

/**
 * Built-in widget types. The registry maps these to components + metadata.
 * `clock` and `search` are core; productivity widgets (notes, tasks,
 * calendar, bookmarks) live beside their mini-app feature; photo/embed are
 * small generic widgets.
 */
export const WIDGET_TYPES = [
  'clock',
  'search',
  'notes',
  'tasks',
  'calendar',
  'bookmarks',
  'photo',
  'embed',
] as const

export type WidgetType = (typeof WIDGET_TYPES)[number]

export function isWidgetType(value: string): value is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(value)
}

/** Labels for the size picker in Edit Mode. */
export const WIDGET_SIZE_LABELS: Record<WidgetSizeId, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
}
