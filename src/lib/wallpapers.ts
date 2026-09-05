import type { BuiltinWallpaperId } from '@/types/domain'

/**
 * Built-in gradient wallpaper presets — original, wallpaper-aware and
 * public-repo-safe (no proprietary imagery). `dark: true` presets are tuned
 * for a dark chrome; light presets pair with the light theme.
 */
export interface BuiltinWallpaper {
  id: BuiltinWallpaperId
  name: string
  /** A CSS background value (gradient). */
  css: string
  /** Renders better with a light chrome theme. */
  light: boolean
}

export const BUILTIN_WALLPAPERS: BuiltinWallpaper[] = [
  {
    id: 'ember',
    name: 'Ember',
    light: false,
    css: 'radial-gradient(120% 120% at 15% 0%, #2a1208 0%, #57230e 38%, #8a3a16 70%, #d15f24 100%)',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    light: false,
    css: 'radial-gradient(130% 120% at 80% 0%, #0b0d24 0%, #241844 42%, #52307a 78%, #8b4b7e 100%)',
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    light: false,
    css: 'radial-gradient(80% 58% at 82% 100%, rgb(202 89 66 / 0.7) 0%, rgb(202 89 66 / 0) 68%), radial-gradient(72% 70% at 7% 2%, #244b76 0%, rgb(36 75 118 / 0) 74%), linear-gradient(160deg, #081728 0%, #0d2c4a 46%, #0b596a 100%)',
  },
  {
    id: 'meadow',
    name: 'Meadow',
    light: false,
    css: 'radial-gradient(130% 130% at 75% 100%, #06180f 0%, #123f26 46%, #2c6b38 84%, #4f8a45 100%)',
  },
  {
    id: 'slate',
    name: 'Slate',
    light: false,
    css: 'radial-gradient(140% 120% at 50% -10%, #0c0f14 0%, #191e26 52%, #2b333f 100%)',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    light: false,
    css: 'radial-gradient(130% 120% at 30% 0%, #261019 0%, #4a1b2b 42%, #7e3242 80%, #b0555f 100%)',
  },
  {
    id: 'mono-light',
    name: 'Cloud',
    light: true,
    css: 'radial-gradient(130% 110% at 50% -10%, #ffffff 0%, #eef0f4 48%, #d8dde6 100%)',
  },
]

const BUILTIN_BY_ID = new Map(BUILTIN_WALLPAPERS.map((w) => [w.id, w]))

export function getBuiltinWallpaper(id: BuiltinWallpaperId): BuiltinWallpaper | undefined {
  return BUILTIN_BY_ID.get(id)
}
