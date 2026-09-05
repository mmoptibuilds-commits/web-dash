import type { SearchEngineId } from '@/types/domain'

export interface SearchEngineDef {
  id: SearchEngineId
  label: string
  /** Host shown in results, e.g. `google.com`. */
  host: string
  /** Search results URL template for the engine. */
  url: string
}

export const SEARCH_ENGINES: SearchEngineDef[] = [
  { id: 'google', label: 'Google', host: 'google.com', url: 'https://www.google.com/search?q=' },
  { id: 'bing', label: 'Bing', host: 'bing.com', url: 'https://www.bing.com/search?q=' },
  {
    id: 'duckduckgo',
    label: 'DuckDuckGo',
    host: 'duckduckgo.com',
    url: 'https://duckduckgo.com/?q=',
  },
]

export function searchEngineById(id: SearchEngineId): SearchEngineDef {
  return SEARCH_ENGINES.find((e) => e.id === id) ?? SEARCH_ENGINES[0]
}

/** Build a search-results URL for a query on the given engine. */
export function buildSearchUrl(engineId: SearchEngineId, query: string): string {
  const engine = searchEngineById(engineId)
  return engine.url + encodeURIComponent(query.trim())
}
