import { historyRepo } from '@/data/repositories'

/**
 * Navigation helpers. External destinations and search results open in the
 * SAME tab (this is a start page, not an app launcher). Recording history is
 * fire-and-forget so navigation is never blocked on the write.
 */

export function sameTab(url: string): void {
  window.location.assign(url)
}

export function recordAndOpen(label: string, url: string): void {
  void historyRepo.recordLaunch(label, url)
  // Give IndexedDB a beat to flush before we navigate away.
  window.setTimeout(() => sameTab(url), 0)
}

export function recordAndSearch(query: string, engineUrl: string): void {
  void historyRepo.recordQuery(query)
  window.setTimeout(() => sameTab(engineUrl), 0)
}
