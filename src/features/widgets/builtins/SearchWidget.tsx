import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CornerDownLeft, Search as SearchIcon } from 'lucide-react'
import type { HistoryEntry } from '@/types/domain'
import { useSettings } from '@/hooks/data'
import { historyRepo } from '@/data/repositories'
import { searchEngineById } from '@/lib/search'
import { hostOf } from '@/lib/url'
import { recordAndOpen } from '@/lib/nav'
import { executeAddress } from '@/lib/run'
import type { WidgetComponentProps } from '../registry'
import styles from './builtins.module.css'

type Suggestion = { kind: 'query' | 'launch'; entry: HistoryEntry }

function suggestionMeta(s: Suggestion, engineLabel: string): string {
  return s.kind === 'launch' ? (s.entry.url ? hostOf(s.entry.url) : 'Link') : engineLabel
}

export function SearchWidget(_props: WidgetComponentProps) {
  const settings = useSettings()
  const engine = settings?.defaultSearchEngine ?? 'google'
  const engineDef = searchEngineById(engine)

  const [value, setValue] = useState('')
  const [active, setActive] = useState(-1)
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Suggest from local history while the field has focus (debounced).
  useEffect(() => {
    if (!focused) return
    let alive = true
    const t = window.setTimeout(async () => {
      const [queries, launches] = await Promise.all([
        historyRepo.suggestHistory('query', value, 5),
        historyRepo.suggestHistory('launch', value, 5),
      ])
      if (!alive) return
      const merged: Suggestion[] = []
      const seen = new Set<string>()
      for (const entry of [...queries.map((e) => ({ kind: 'query' as const, entry: e })), ...launches.map((e) => ({ kind: 'launch' as const, entry: e }))]) {
        const key = entry.entry.text.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(entry)
        if (merged.length >= 6) break
      }
      setSuggestions(merged)
    }, 120)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [value, focused])

  function pick(s: Suggestion) {
    setSuggestions([])
    setActive(-1)
    setError(null)
    inputRef.current?.blur()
    if (s.kind === 'launch' && s.entry.url) {
      recordAndOpen(s.entry.text || hostOf(s.entry.url), s.entry.url)
    } else {
      const outcome = executeAddress(s.entry.text, engine)
      if (outcome.kind === 'error') setError(outcome.reason)
    }
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (suggestions[active]) {
      pick(suggestions[active])
      return
    }
    const q = value.trim()
    if (!q) return
    setSuggestions([])
    setActive(-1)
    setError(null)
    const outcome = executeAddress(q, engine)
    if (outcome.kind === 'error') setError(outcome.reason)
    else inputRef.current?.blur()
  }

  function onKeyDown(ev: React.KeyboardEvent) {
    if (ev.key === 'ArrowDown' && suggestions.length) {
      ev.preventDefault()
      setActive((a) => (a + 1) % suggestions.length)
    } else if (ev.key === 'ArrowUp' && suggestions.length) {
      ev.preventDefault()
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1))
    } else if (ev.key === 'Escape') {
      inputRef.current?.blur()
      setSuggestions([])
      setActive(-1)
    }
  }

  const showList = focused && suggestions.length > 0

  return (
    <div className={styles.search}>
      <form className={styles.searchBar} onSubmit={submit} role="search" aria-label="Web search">
        <SearchIcon size={18} className={styles.searchIcon} aria-hidden />
        <input
          ref={inputRef}
          className={styles.searchInput}
          value={value}
          onChange={(ev) => {
            setValue(ev.target.value)
            setActive(-1)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search or paste a link…"
          aria-label="Search the web or open a URL"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
        />
        <button
          type="submit"
          className={styles.searchGo}
          aria-label="Go"
          tabIndex={-1}
        >
          <CornerDownLeft size={15} aria-hidden />
        </button>
      </form>

      {error ? (
        <p className={`${styles.searchHint} ${styles.searchError}`} role="alert">
          {error}
        </p>
      ) : (
        <p className={styles.searchHint}>
          {engineDef.label} search · or just type a website name
        </p>
      )}

      {showList && (
        <ul className={styles.suggestions} role="listbox" aria-label="Suggestions">
          {suggestions.map((s, i) => (
            <li key={`${s.kind}:${s.entry.text}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`${styles.suggestion} ${i === active ? styles.isActive : ''}`}
                onMouseDown={(ev) => {
                  ev.preventDefault()
                  pick(s)
                }}
              >
                {s.kind === 'launch' ? (
                  <ArrowUpRight size={15} aria-hidden />
                ) : (
                  <SearchIcon size={15} aria-hidden />
                )}
                <span className={styles.suggestionText}>{s.entry.text}</span>
                <span className={styles.suggestionMeta}>{suggestionMeta(s, engineDef.label)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
