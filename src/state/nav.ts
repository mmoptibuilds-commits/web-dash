import type { BuiltinAppId } from '@/types/domain'
import { isWindowApp } from '@/types/apps'
import { useUi } from '@/state/ui'

/** True at mobile/tablet widths, where window-apps open as full-screen sheets. */
function usesSheets(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
}

/**
 * Primary launch entry point for every built-in app surface (dock, menu bar,
 * dashboard overview, home tiles). Mode-navigation apps switch the whole mode;
 * window apps open a floating desktop window or a full-screen mobile sheet.
 */
export function launchApp(appId: BuiltinAppId): void {
  const ui = useUi.getState()
  if (appId === 'dashboard') {
    ui.setMode('home')
    ui.setLauncherOpen(true)
    return
  }
  if (!isWindowApp(appId)) {
    ui.setMode('home')
    return
  }
  if (usesSheets()) {
    ui.setMode('home')
    ui.openMobile(appId)
  } else {
    ui.setMode('home')
    ui.openApp(appId)
  }
}

export function goHome(): void {
  useUi.getState().setMode('home')
}

export function goDashboard(): void {
  // Compatibility alias for older callers. v1.1 keeps Home as the only
  // workspace and exposes Apps through the Launchpad overlay.
  useUi.getState().setLauncherOpen(true)
}
