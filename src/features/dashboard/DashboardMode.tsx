import { ChevronLeft } from 'lucide-react'
import { windowApps } from '@/types/apps'
import { useUi } from '@/state/ui'
import { useIsDesktop } from '@/hooks/useMedia'
import { launchApp } from '@/state/nav'
import { AppContent } from '@/components/shell/appContent'
import { WindowsHost } from '@/components/shell/WindowsHost'
import { hueFor } from '@/components/common/Glyph'
import type { BuiltinAppId } from '@/types/domain'
import styles from './dashboard.module.css'

function AppCard({ appId }: { appId: BuiltinAppId }) {
  const app = windowApps().find((a) => a.id === appId)!
  const Icon = app.icon
  const h = hueFor(app.name)
  return (
    <button type="button" className={styles.card} onClick={() => launchApp(appId)}>
      <span
        className={styles.cardGlyph}
        style={{
          backgroundImage: `linear-gradient(150deg, hsl(${h} 50% 54%), hsl(${(h + 40) % 360} 56% 40%))`,
        }}
      >
        <Icon size={26} strokeWidth={1.8} aria-hidden />
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardName}>{app.name}</span>
        <span className={styles.cardDesc}>{app.description}</span>
      </span>
      <ChevronLeft className={styles.cardChev} size={16} aria-hidden />
    </button>
  )
}

function Overview() {
  return (
    <div className={styles.overview}>
      <header className={styles.overviewHead}>
        <h1 className={styles.overviewTitle}>Dashboard</h1>
        <p className={styles.overviewSub}>Notes, tasks, calendar and links — your mini apps.</p>
      </header>
      <div className={styles.grid}>
        {windowApps().map((a) => (
          <AppCard key={a.id} appId={a.id} />
        ))}
      </div>
    </div>
  )
}

function MobileSheet({ appId }: { appId: BuiltinAppId }) {
  const openMobile = useUi((s) => s.openMobile)
  const app = windowApps().find((a) => a.id === appId)
  if (!app) return null
  const Icon = app.icon
  return (
    <div className={`${styles.sheet} anim-slide-up`} role="dialog" aria-label={`${app.name} sheet`}>
      <div className={styles.sheetTop}>
        <button
          type="button"
          className={styles.sheetBack}
          aria-label="Back to dashboard"
          onClick={() => openMobile(null)}
        >
          <ChevronLeft size={20} aria-hidden />
          <span>Dashboard</span>
        </button>
        <span className={styles.sheetTitle}>
          <Icon size={16} aria-hidden />
          {app.name}
        </span>
        <span className={styles.sheetPad} aria-hidden />
      </div>
      <div className={styles.sheetBody}>
        <AppContent appId={appId} />
      </div>
    </div>
  )
}

/** Dashboard surface: desktop = floating windows; mobile = sheets + overview. */
export function DashboardMode() {
  const desktop = useIsDesktop()
  const focusOrder = useUi((s) => s.focusOrder)
  const mobileAppId = useUi((s) => s.mobileAppId)

  if (desktop) {
    return (
      <>
        {focusOrder.length === 0 && <Overview />}
        <WindowsHost />
      </>
    )
  }
  return mobileAppId ? <MobileSheet appId={mobileAppId} /> : <Overview />
}
