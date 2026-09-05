import { create } from 'zustand'
import type { BuiltinAppId } from '@/types/domain'

export type Mode = 'home' | 'dashboard'

export interface WindowState {
  appId: BuiltinAppId
  z: number
  x: number
  y: number
  w: number
  h: number
  maximized: boolean
  /** Hidden into the dock (macOS "minimize"): the window stays open (dock dot
   * lit) but leaves the visible stage until the dock tile is activated again. */
  minimized: boolean
}

interface UiStore {
  mode: Mode
  activePageId: string | null
  editMode: boolean
  /** One window per window-app; keyed by app id (desktop only). */
  windows: Partial<Record<BuiltinAppId, WindowState>>
  /** Focus order, last = frontmost. */
  focusOrder: BuiltinAppId[]
  /** Full-screen sheet app id on non-desktop widths; null = dashboard overview. */
  mobileAppId: BuiltinAppId | null
  controlCenterOpen: boolean
  searchOpen: boolean
  openFolderId: string | null

  setMode: (mode: Mode) => void
  setActivePageId: (id: string | null) => void
  setEditMode: (on: boolean) => void
  toggleEditMode: () => void

  openApp: (appId: BuiltinAppId) => void
  /** Open/close the full-screen app sheet on mobile (null = back to overview). */
  openMobile: (appId: BuiltinAppId | null) => void
  closeApp: (appId: BuiltinAppId) => void
  focusApp: (appId: BuiltinAppId) => void
  toggleMaximize: (appId: BuiltinAppId) => void
  /** Hide a desktop window into the dock; activating its dock tile restores it. */
  minimizeApp: (appId: BuiltinAppId) => void
  moveWindow: (appId: BuiltinAppId, x: number, y: number) => void
  resizeWindow: (appId: BuiltinAppId, w: number, h: number) => void
  closeAllWindows: () => void

  setControlCenter: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  setOpenFolderId: (id: string | null) => void
}

let zCounter = 10

function nextZ(): number {
  zCounter += 1
  return zCounter
}

/** Cascade offset so successive windows don't stack exactly. */
const CASCADE = { x: 28, y: 24 }

export const useUi = create<UiStore>((set, get) => ({
  mode: 'home',
  activePageId: null,
  editMode: false,
  windows: {},
  focusOrder: [],
  mobileAppId: null,
  controlCenterOpen: false,
  searchOpen: false,
  openFolderId: null,

  setMode: (mode) => {
    if (mode === get().mode) return
    set({
      mode,
      editMode: false,
      mobileAppId: null,
      openFolderId: null,
      searchOpen: false,
    })
  },

  setActivePageId: (id) => set({ activePageId: id }),
  setEditMode: (on) => set({ editMode: on }),
  toggleEditMode: () => {
    const next = !get().editMode
    set({ editMode: next, controlCenterOpen: false })
  },

  openApp: (appId) => {
    const state = get()
    // Mode nav handled by callers; window apps open here.
    const existing = state.windows[appId]
    if (existing) {
      const next = [...state.focusOrder.filter((a) => a !== appId), appId]
      // A minimized window is not on the stage; activating it again restores it
      // (macOS: dock click re-opens a minimized window).
      if (existing.minimized) {
        set({
          windows: { ...state.windows, [appId]: { ...existing, minimized: false } },
          focusOrder: next,
        })
      } else {
        set({ focusOrder: next })
      }
      return
    }
    const count = state.focusOrder.length
    const win: WindowState = {
      appId,
      z: nextZ(),
      x: 120 + ((count % 5) * CASCADE.x),
      y: 90 + ((count % 5) * CASCADE.y),
      w: 720,
      h: 520,
      maximized: false,
      minimized: false,
    }
    set({
      windows: { ...state.windows, [appId]: win },
      focusOrder: [...state.focusOrder, appId],
    })
  },

  openMobile: (appId) => {
    set({
      mobileAppId: appId,
      // Transient overlays drop, but the desktop window stage is deliberately
      // left untouched: the store is shared across breakpoints, and a resize to
      // phone width (or a sheet launched from the dock) must not destroy the
      // windows a user had arranged at desktop width — they simply aren't
      // rendered while sheets are shown, and come back on widening.
      controlCenterOpen: false,
      searchOpen: false,
      openFolderId: null,
    })
  },

  closeApp: (appId) => {
    const state = get()
    const windows = { ...state.windows }
    delete windows[appId]
    set({
      windows,
      focusOrder: state.focusOrder.filter((a) => a !== appId),
      openFolderId: null,
    })
  },

  focusApp: (appId) => {
    const state = get()
    if (!state.windows[appId]) return
    const next = [...state.focusOrder.filter((a) => a !== appId), appId]
    set({
      focusOrder: next,
      windows: {
        ...state.windows,
        [appId]: { ...state.windows[appId]!, z: nextZ() },
      },
    })
  },

  toggleMaximize: (appId) => {
    const state = get()
    const win = state.windows[appId]
    if (!win) return
    set({
      windows: { ...state.windows, [appId]: { ...win, maximized: !win.maximized, z: nextZ() } },
      focusOrder: [...state.focusOrder.filter((a) => a !== appId), appId],
    })
  },

  minimizeApp: (appId) => {
    const state = get()
    const win = state.windows[appId]
    if (!win || win.minimized) return
    set({
      windows: { ...state.windows, [appId]: { ...win, minimized: true } },
      // Leaving focusOrder removes it from the stage (WindowsHost iterates
      // focusOrder) and lets the window behind keep focus. The dock dot stays
      // lit because the window is still present in `windows`.
      focusOrder: state.focusOrder.filter((a) => a !== appId),
    })
  },

  moveWindow: (appId, x, y) => {
    const state = get()
    const win = state.windows[appId]
    if (!win) return
    set({ windows: { ...state.windows, [appId]: { ...win, x, y } } })
  },

  resizeWindow: (appId, w, h) => {
    const state = get()
    const win = state.windows[appId]
    if (!win) return
    set({ windows: { ...state.windows, [appId]: { ...win, w, h } } })
  },

  closeAllWindows: () => set({ windows: {}, focusOrder: [] }),

  setControlCenter: (open) =>
    set({ controlCenterOpen: open, searchOpen: open ? false : get().searchOpen }),
  setSearchOpen: (open) => set({ searchOpen: open, controlCenterOpen: open ? false : get().controlCenterOpen }),
  setOpenFolderId: (id) => set({ openFolderId: id, controlCenterOpen: false, searchOpen: false }),
}))
