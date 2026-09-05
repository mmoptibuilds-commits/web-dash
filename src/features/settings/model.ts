import type { AppSettings } from '@/types/domain'

/** A partial settings patch safe for `settingsRepo.updateSettings`. */
export type SettingsPatch = Partial<Omit<AppSettings, 'id' | 'createdAt'>>

/** Persists a settings patch (fire-and-forget from event handlers). */
export type PersistFn = (patch: SettingsPatch) => void
