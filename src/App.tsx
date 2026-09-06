import { useEffect } from 'react'
import { useUi } from '@/state/ui'
import { useSettings } from '@/hooks/data'
import { resolveTheme, applyThemeAttributes } from '@/app/theme'
import { usePrefersDark } from '@/hooks/useMedia'
import { Backdrop } from '@/components/shell/Backdrop'
import { MenuBar } from '@/components/shell/MenuBar'
import { Dock } from '@/components/shell/Dock'
import { HomeMode } from '@/features/home/HomeMode'
import { FolderView } from '@/features/home/FolderView'
import { WindowsHost } from '@/components/shell/WindowsHost'
import { MobileSheetHost } from '@/features/dashboard/DashboardMode'
import { AppLauncher } from '@/components/shell/AppLauncher'
import { SearchOverlay } from '@/features/search/SearchOverlay'

function ThemeSync() {
  const settings = useSettings()
  const prefersDark = usePrefersDark()
  useEffect(() => {
    if (!settings) return
    applyThemeAttributes(
      resolveTheme(settings.theme, prefersDark),
      settings.reducedEffects,
      settings.glass ?? 'standard',
      settings.glassTranslucency,
      settings,
    )
  }, [settings, prefersDark])
  return null
}

function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        const s = useUi.getState()
        s.setSearchOpen(!s.searchOpen)
        return
      }
      if (e.key !== 'Escape') return
      const t = e.target as HTMLElement | null
      if (t?.isContentEditable || t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA') return
      const s = useUi.getState()
      if (s.openFolderId) s.setOpenFolderId(null)
      else if (s.launcherOpen) s.setLauncherOpen(false)
      else if (s.controlCenterOpen) s.setControlCenter(false)
      else if (s.searchOpen) s.setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  const launcherOpen = useUi((s) => s.launcherOpen)
  const openFolderId = useUi((s) => s.openFolderId)
  const searchOpen = useUi((s) => s.searchOpen)
  const hydrateWindows = useUi((s) => s.hydrateWindows)
  useGlobalKeys()

  useEffect(() => { void hydrateWindows() }, [hydrateWindows])

  return (
    <>
      <ThemeSync />
      <Backdrop />
      <MenuBar />
      <HomeMode />
      <WindowsHost />
      <MobileSheetHost />
      {openFolderId && <FolderView />}
      {launcherOpen && <AppLauncher />}
      <Dock />
      {searchOpen && <SearchOverlay />}
    </>
  )
}
