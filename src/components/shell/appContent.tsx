import type { ComponentType } from 'react'
import { BUILTIN_APPS } from '@/types/apps'
import type { BuiltinAppId } from '@/types/domain'
import styles from './appContent.module.css'

/**
 * Window-content resolver. Feature mini-apps (Notes / Tasks / Calendar /
 * Links / Settings) export a self-contained component that fills 100% of its
 * parent with no outer chrome; the coordinator wires those imports here at
 * integration. Until then a neutral interim panel renders (removed before
 * release — QA gate: no placeholder panels).
 */
const MINI_APPS: Partial<Record<BuiltinAppId, ComponentType>> = {}

/** Component that renders a window-app's content for its app id. */
export function AppContent({ appId }: { appId: BuiltinAppId }) {
  const Content = MINI_APPS[appId]
  if (Content) return <Content />
  return <Interim appId={appId} />
}

function Interim({ appId }: { appId: BuiltinAppId }) {
  const app = BUILTIN_APPS[appId]
  const Icon = app.icon
  return (
    <div className={styles.interim} role="status">
      <span className={styles.interimIcon}>
        <Icon size={34} strokeWidth={1.6} aria-hidden />
      </span>
      <h2 className={styles.name}>{app.name}</h2>
      <p className={styles.note}>Connecting {app.description.toLowerCase()}…</p>
    </div>
  )
}
