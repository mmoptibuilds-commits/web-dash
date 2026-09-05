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
import { DashboardMode } from '@/features/dashboard/DashboardMode'
import { SearchOverlay } from '@/features/search/SearchOverlay'

/**
 * Keeps <html data-theme / data-effects> in sync with Settings and the OS
 * (auto). Runs for the whole session; the pre-paint apply happens in main.
 */
function ThemeSync() {
  const themePref = useSettings()?.theme
  const reduced = useSettings()?.reducedEffects
  const prefersDark = usePrefersDark()
  useEffect(() => {
    applyThemeAttributes(resolveTheme(themePref ?? 'auto', prefersDark), reduced ?? false)
  }, [themePref, reduced, prefersDark])
  return null
}

/** Global shell shortcuts: ⌘K / Ctrl-K omnibox, Escape to dismiss chrome. */
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
      if (e.key === 'Escape') {
        // Let the field itself handle Escape when typing (rename, search…).
        const t = e.target as HTMLElement | null
        const editing =
          t?.isContentEditable || t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA'
        if (editing) return
        const s = useUi.getState()
        if (s.openFolderId) s.setOpenFolderId(null)
        else if (s.controlCenterOpen) s.setControlCenter(false)
        else if (s.searchOpen) s.setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  const mode = useUi((s) => s.mode)
  const openFolderId = useUi((s) => s.openFolderId)
  const searchOpen = useUi((s) => s.searchOpen)
  useGlobalKeys()

  return (
    <>
      <ThemeSync />
      <Backdrop />
      <MenuBar />
      {mode === 'home' ? (
        <>
          <HomeMode />
          {openFolderId && <FolderView />}
        </>
      ) : (
        <DashboardMode />
      )}
      <Dock />
      {searchOpen && <SearchOverlay />}
    </>
  )
}
