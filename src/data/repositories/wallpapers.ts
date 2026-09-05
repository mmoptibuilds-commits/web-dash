import { db } from '@/data/db/db'
import type { Wallpaper, WallpaperMediaKind } from '@/types/domain'
import { now } from '@/types/domain'
import { uid } from '@/lib/id'

export type MediaCheck =
  | { ok: true; kind: WallpaperMediaKind }
  | { ok: false; reason: string }

/** V1 size/type guardrails — no transcoding in V1. */
const LIMITS: Record<WallpaperMediaKind, number> = {
  image: 15 * 1024 * 1024,
  animated: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024,
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg'])

export function checkMediaFile(file: File): MediaCheck {
  if (VIDEO_TYPES.has(file.type)) {
    if (file.size > LIMITS.video) {
      return { ok: false, reason: 'Videos must be under 50 MB.' }
    }
    return { ok: true, kind: 'video' }
  }
  if (file.type === 'image/gif') {
    if (file.size > LIMITS.animated) return { ok: false, reason: 'Animated images must be under 20 MB.' }
    return { ok: true, kind: 'animated' }
  }
  if (IMAGE_TYPES.has(file.type)) {
    if (file.size > LIMITS.image) return { ok: false, reason: 'Images must be under 15 MB.' }
    return { ok: true, kind: 'image' }
  }
  return { ok: false, reason: 'Use a PNG, JPEG, WebP, GIF or an MP4/WebM video.' }
}

export async function addWallpaperMedia(file: File, name?: string): Promise<Wallpaper> {
  const check = checkMediaFile(file)
  if (!check.ok) throw new Error(check.reason)
  const wall: Wallpaper = {
    id: uid('wall'),
    name: name?.trim().slice(0, 60) || file.name.slice(0, 60),
    kind: check.kind,
    mime: file.type,
    blob: file,
    size: file.size,
    addedAt: now(),
  }
  await db.wallpapers.put(wall)
  return wall
}

export async function listWallpapers(): Promise<Wallpaper[]> {
  const items = await db.wallpapers.toArray()
  return [...items].sort((a, b) => b.addedAt - a.addedAt)
}

export async function deleteWallpaper(id: string): Promise<void> {
  await db.wallpapers.delete(id)
}
