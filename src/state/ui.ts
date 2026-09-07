import { create } from 'zustand'
import type { AppWindowState, BuiltinAppId } from '@/types/domain'
import { getSettings } from '@/data/repositories/settings'
import {
  defaultWindowState,
  listWindowStates,
  markWindowClosed,
  putWindowState,
} from '@/data/repositories/windowStates'

export type Mode = 'home' | 'dashboard'

/** Immediate window state used by the shell. Durable fields mirror Dexie's record. */
export type WindowState = AppWindowState

interface UiStore {
  /** Kept as a compatibility field for old imports; the visible workspace is always Home. */
  mode: Mode
  activePageId: string | null
  editMode: boolean
  windows: Partial<Record<BuiltinAppId, WindowState>>
  /** Saved geometry/state, including closed apps that can be reopened later. */
  savedWindows: Partial<Record<BuiltinAppId, WindowState>>
  focusOrder: BuiltinAppId[]
  mobileAppId: BuiltinAppId | null
  launcherOpen: boolean
  controlCenterOpen: boolean
  searchOpen: boolean
  openFolderId: string | null
  hydrated: boolean

  setMode: (mode: Mode) => void
  setActivePageId: (id: string | null) => void
  setEditMode: (on: boolean) => void
  toggleEditMode: () => void
  hydrateWindows: () => Promise<void>

  openApp: (appId: BuiltinAppId) => void
  openMobile: (appId: BuiltinAppId | null) => void
  closeApp: (appId: BuiltinAppId) => void
  focusApp: (appId: BuiltinAppId) => void
  toggleMaximize: (appId: BuiltinAppId) => void
  minimizeApp: (appId: BuiltinAppId) => void
  moveWindow: (appId: BuiltinAppId, x: number, y: number) => void
  resizeWindow: (appId: BuiltinAppId, w: number, h: number) => void
  closeAllWindows: () => void

  setLauncherOpen: (open: boolean) => void
  setControlCenter: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  setOpenFolderId: (id: string | null) => void
}

let zCounter = 10
const persistTimers = new Map<BuiltinAppId, ReturnType<typeof setTimeout>>()

function persistSoon(state: WindowState): void {
  const previous = persistTimers.get(state.appId)
  if (previous) clearTimeout(previous)
  persistTimers.set(
    state.appId,
    setTimeout(() => {
      persistTimers.delete(state.appId)
      void putWindowState(state)
    }, 140),
  )
}

function withFocus(state: UiStore, appId: BuiltinAppId): Pick<UiStore, 'focusOrder' | 'windows'> {
  const next = [...state.focusOrder.filter((id) => id !== appId), appId]
  const current = state.windows[appId]
  if (!current) return { focusOrder: next, windows: state.windows }
  const focused = { ...current, lastOpenedAt: Date.now(), updatedAt: Date.now() }
  return {
    focusOrder: next,
    windows: { ...state.windows, [appId]: focused },
  }
}

export const useUi = create<UiStore>((set, get) => ({
  mode: 'home',
  activePageId: null,
  editMode: false,
  windows: {},
  savedWindows: {},
  focusOrder: [],
  mobileAppId: null,
  launcherOpen: false,
  controlCenterOpen: false,
  searchOpen: false,
  openFolderId: null,
  hydrated: false,

  setMode: () =>
    // v1.1 no longer replaces Home with a Dashboard page. The field remains
    // readable by old callers while the visible surface is always Home.
    set({ mode: 'home' }),

  setActivePageId: (id) => set({ activePageId: id }),
  setEditMode: (on) => set({ editMode: on }),
  toggleEditMode: () => {
    const next = !get().editMode
    set({ editMode: next, controlCenterOpen: false, launcherOpen: false })
  },

  hydrateWindows: async () => {
    const records = await listWindowStates()
    const savedWindows: Partial<Record<BuiltinAppId, WindowState>> = {}
    for (const record of records) savedWindows[record.appId] = record
    const settings = await getSettings()
    const windows: Partial<Record<BuiltinAppId, WindowState>> = {}
    const focusOrder: BuiltinAppId[] = []
    if (settings.restoreWindowsOnReload) {
      for (const record of records
        .filter((item) => item.open)
        .sort((a, b) => a.lastOpenedAt - b.lastOpenedAt)) {
        windows[record.appId] = { ...record }
        if (!record.minimized) focusOrder.push(record.appId)
        zCounter = Math.max(zCounter, record.lastOpenedAt % 100000)
      }
    }
    set({ savedWindows, windows, focusOrder, hydrated: true })
  },

  openApp: (appId) => {
    const state = get()
    const saved = state.savedWindows[appId]
    const win: WindowState = saved
      ? { ...saved, appId, open: true, minimized: false, lastOpenedAt: Date.now(), updatedAt: Date.now() }
      : { ...defaultWindowState(appId, state.focusOrder.length) }
    const current = state.windows[appId]
    if (current) {
      const focused = { ...current, minimized: false, open: true, lastOpenedAt: Date.now(), updatedAt: Date.now() }
      const next = [...state.focusOrder.filter((id) => id !== appId), appId]
      set({ windows: { ...state.windows, [appId]: focused }, savedWindows: { ...state.savedWindows, [appId]: focused }, focusOrder: next })
      persistSoon(focused)
      return
    }
    const next = [...state.focusOrder.filter((id) => id !== appId), appId]
    set({
      windows: { ...state.windows, [appId]: win },
      savedWindows: { ...state.savedWindows, [appId]: win },
      focusOrder: next,
      mode: 'home',
    })
    persistSoon(win)
  },

  openMobile: (appId) => set({
    mobileAppId: appId,
    launcherOpen: false,
    controlCenterOpen: false,
    searchOpen: false,
    openFolderId: null,
  }),

  closeApp: (appId) => {
    const state = get()
    const current = state.windows[appId] ?? state.savedWindows[appId]
    if (current) {
      const closed = { ...current, open: false, minimized: false, updatedAt: Date.now() }
      void markWindowClosed(appId)
      set({
        savedWindows: { ...state.savedWindows, [appId]: closed },
        windows: Object.fromEntries(Object.entries(state.windows).filter(([id]) => id !== appId)),
        focusOrder: state.focusOrder.filter((id) => id !== appId),
        openFolderId: null,
      })
    }
  },

  focusApp: (appId) => {
    const state = get()
    const current = state.windows[appId]
    if (!current) return
    const focused = { ...current, lastOpenedAt: Date.now(), updatedAt: Date.now() }
    const next = [...state.focusOrder.filter((id) => id !== appId), appId]
    set({
      focusOrder: next,
      windows: { ...state.windows, [appId]: focused },
      savedWindows: { ...state.savedWindows, [appId]: focused },
    })
    persistSoon(focused)
  },

  toggleMaximize: (appId) => {
    const state = get()
    const current = state.windows[appId]
    if (!current) return
    const next = { ...current, maximized: !current.maximized, updatedAt: Date.now() }
    const focus = withFocus({ ...state, windows: { ...state.windows, [appId]: next } }, appId)
    set({ ...focus, windows: { ...state.windows, [appId]: next }, savedWindows: { ...state.savedWindows, [appId]: next } })
    persistSoon(next)
  },

  minimizeApp: (appId) => {
    const state = get()
    const current = state.windows[appId]
    if (!current) return
    const minimized = { ...current, minimized: true, updatedAt: Date.now() }
    set({
      windows: { ...state.windows, [appId]: minimized },
      savedWindows: { ...state.savedWindows, [appId]: minimized },
      focusOrder: state.focusOrder.filter((id) => id !== appId),
    })
    persistSoon(minimized)
  },

  moveWindow: (appId, x, y) => {
    const state = get()
    const current = state.windows[appId]
    if (!current) return
    const moved = { ...current, x: Math.round(x), y: Math.round(y), updatedAt: Date.now() }
    set({ windows: { ...state.windows, [appId]: moved }, savedWindows: { ...state.savedWindows, [appId]: moved } })
    persistSoon(moved)
  },

  resizeWindow: (appId, w, h) => {
    const state = get()
    const current = state.windows[appId]
    if (!current) return
    const resized = { ...current, w: Math.round(w), h: Math.round(h), updatedAt: Date.now() }
    set({ windows: { ...state.windows, [appId]: resized }, savedWindows: { ...state.savedWindows, [appId]: resized } })
    persistSoon(resized)
  },

  closeAllWindows: () => {
    const state = get()
    for (const appId of Object.keys(state.windows) as BuiltinAppId[]) void markWindowClosed(appId)
    set({ windows: {}, focusOrder: [] })
  },

  setLauncherOpen: (open) => set({ launcherOpen: open, controlCenterOpen: open ? false : get().controlCenterOpen, searchOpen: open ? false : get().searchOpen }),
  setControlCenter: (open) => set({ controlCenterOpen: open, launcherOpen: open ? false : get().launcherOpen, searchOpen: open ? false : get().searchOpen }),
  setSearchOpen: (open) => set({ searchOpen: open, launcherOpen: open ? false : get().launcherOpen, controlCenterOpen: open ? false : get().controlCenterOpen }),
  setOpenFolderId: (id) => set({ openFolderId: id, launcherOpen: false, controlCenterOpen: false, searchOpen: false }),
}))
