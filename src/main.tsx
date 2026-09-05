import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { ensureBootData } from '@/data/seed'
import { getSettings } from '@/data/repositories/settings'
import { resolveTheme, applyThemeAttributes } from '@/app/theme'

/** Minimal fallback shown only if IndexedDB cannot be opened. */
function FatalScreen({ reason }: { reason: string }) {
  return (
    <div style={{ maxWidth: 420, margin: '15vh auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Hearth couldn’t start</h1>
      <p style={{ opacity: 0.75 }}>{reason}</p>
    </div>
  )
}

async function boot() {
  const rootEl = document.getElementById('root')
  if (!rootEl) return

  try {
    await ensureBootData()
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    createRoot(rootEl).render(<FatalScreen reason={reason} />)
    return
  }

  // Apply theme before first paint to avoid a flash of the wrong palette.
  const settings = await getSettings().catch(() => undefined)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyThemeAttributes(
    resolveTheme(settings?.theme ?? 'auto', prefersDark),
    settings?.reducedEffects ?? false,
    settings?.glass ?? 'standard',
    settings?.glassTranslucency ?? 0.5,
  )

  // PWA service worker (autoUpdate; no-op in dev).
  registerSW({ immediate: true })

  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
