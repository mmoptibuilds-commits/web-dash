import { useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight, CornerDownLeft, Search as SearchIcon } from 'lucide-react'
import type { HistoryEntry } from '@/types/domain'
import { useSettings } from '@/hooks/data'
import { historyRepo } from '@/data/repositories'
import { searchEngineById } from '@/lib/search'
import { hostOf } from '@/lib/url'
import { recordAndOpen } from '@/lib/nav'
import { executeAddress } from '@/lib/run'
import { useUi } from '@/state/ui'
import styles from './search.module.css'

type Suggestion = { kind: 'query' | 'launch'; entry: HistoryEntry }

function suggestionMeta(s: Suggestion, engineLabel: string): string {
  return s.kind === 'launch' ? (s.entry.url ? hostOf(s.entry.url) : 'Link') : engineLabel
}

/** Global omnibox overlay — ⌘K / search icon. Same semantics as the widget. */
export function SearchOverlay() {
  const open = useUi((s) => s.searchOpen)
  const close = useUi((s) => s.setSearchOpen)
  const settings = useSettings()
  const engine = settings?.defaultSearchEngine ?? 'google'
  const engineDef = searchEngineById(engine)

  const [value, setValue] = useState('')
  const [active, setActive] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const activeId = active >= 0 && active < suggestions.length ? `${listId}-o-${active}` : undefined

  // The overlay is mounted on open, so state starts fresh; just focus the box.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 30)
      return () => window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let alive = true
    const t = window.setTimeout(async () => {
      const [queries, launches] = await Promise.all([
        historyRepo.suggestHistory('query', value, 5),
        historyRepo.suggestHistory('launch', value, 5),
      ])
      if (!alive) return
      const merged: Suggestion[] = []
      const seen = new Set<string>()
      for (const entry of [
        ...queries.map((e) => ({ kind: 'query' as const, entry: e })),
        ...launches.map((e) => ({ kind: 'launch' as const, entry: e })),
      ]) {
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
  }, [value, open])

  function finish() {
    setSuggestions([])
    setActive(-1)
    setError(null)
  }

  function pick(s: Suggestion) {
    if (s.kind === 'launch' && s.entry.url) {
      finish()
      close(false)
      recordAndOpen(s.entry.text || hostOf(s.entry.url), s.entry.url)
      return
    }
    const outcome = executeAddress(s.entry.text, engine)
    if (outcome.kind === 'error') {
      finish()
      setError(outcome.reason)
      return
    }
    finish()
    close(false)
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (suggestions[active]) {
      pick(suggestions[active])
      return
    }
    const q = value.trim()
    if (!q) return
    const outcome = executeAddress(q, engine)
    if (outcome.kind === 'error') {
      finish()
      setError(outcome.reason)
      return
    }
    finish()
    close(false)
  }

  function onKeyDown(ev: React.KeyboardEvent) {
    if (ev.key === 'ArrowDown' && suggestions.length) {
      ev.preventDefault()
      setActive((a) => (a + 1) % suggestions.length)
    } else if (ev.key === 'ArrowUp' && suggestions.length) {
      ev.preventDefault()
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1))
    } else if (ev.key === 'Escape') {
      close(false)
    }
  }

  if (!open) return null
  const showList = suggestions.length > 0

  return (
    <div
      className={styles.veil}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close(false)
      }}
    >
      <div className={`${styles.panel} anim-rise`} role="dialog" aria-label="Search">
        <form className={styles.bar} onSubmit={submit} role="search">
          <SearchIcon size={19} className={styles.icon} aria-hidden />
          <input
            ref={inputRef}
            className={styles.input}
            value={value}
            onChange={(ev) => {
              setValue(ev.target.value)
              setActive(-1)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search the web or open a link…"
            aria-label="Search the web or open a URL"
            role="combobox"
            aria-expanded={showList}
            aria-controls={showList ? listId : undefined}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
          />
          <kbd className={styles.kbd}>esc</kbd>
          <button type="submit" className={styles.go} aria-label="Go" tabIndex={-1}>
            <CornerDownLeft size={15} aria-hidden />
          </button>
        </form>

        {error ? (
          <p className={`${styles.hint} ${styles.error}`} role="alert">
            {error}
          </p>
        ) : (
          <p className={styles.hint}>
            {engineDef.label} search · or type a website name · press ↵ to go
          </p>
        )}

        {showList && (
          <ul id={listId} className={styles.list} role="listbox" aria-label="Suggestions">
            {suggestions.map((s, i) => (
              <li
                key={`${s.kind}:${s.entry.text}`}
                id={`${listId}-o-${i}`}
                role="option"
                aria-selected={i === active}
                className={`${styles.item} ${i === active ? styles.itemActive : ''}`}
                onMouseDown={(ev) => {
                  // Keep focus in the box; this press picks the suggestion.
                  ev.preventDefault()
                  pick(s)
                }}
                onPointerMove={() => {
                  if (active !== i) setActive(i)
                }}
              >
                {s.kind === 'launch' ? (
                  <ArrowUpRight size={15} aria-hidden />
                ) : (
                  <SearchIcon size={15} aria-hidden />
                )}
                <span className={styles.itemText}>{s.entry.text}</span>
                <span className={styles.itemMeta}>{suggestionMeta(s, engineDef.label)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
