import { useState } from 'react'
import { ArrowLeftRight, PencilLine, RotateCcw, Save } from 'lucide-react'
import { useCurrencyRates } from '@/hooks/data'
import { currencyRatesRepo } from '@/data/repositories'
import {
  convert,
  currencyName,
  formatAmount,
  formatCrossRate,
} from './currency'
import styles from './calculator.module.css'

const DEFAULT_FROM = 'USD'
const DEFAULT_TO = 'EUR'

const str = (n: number): string => String(n)

/**
 * Currency mode — offline converter over the user-editable USD-anchored rates
 * table. The pair converts with `convert()`, and an editor writes edited rates
 * straight back to IndexedDB (local-first: never a live feed).
 */
export function CurrencyMode() {
  const row = useCurrencyRates()
  const rates = row?.rates

  const [amount, setAmount] = useState('')
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const codes = rates ? Object.keys(rates) : []
  // Fallbacks guard against a rate table that lacks the stored selection.
  const effFrom =
    rates && from in rates ? from : rates && 'USD' in rates ? DEFAULT_FROM : (codes[0] ?? '')
  const effTo =
    rates && to in rates
      ? to
      : rates && effFrom !== DEFAULT_TO && DEFAULT_TO in rates
        ? DEFAULT_TO
        : (codes.find((c) => c !== effFrom) ?? effFrom)

  const num = Number.parseFloat(amount)
  const hasAmount = amount !== '' && Number.isFinite(num)
  const output =
    hasAmount && rates && effFrom !== effTo
      ? convert(num, rates[effFrom], rates[effTo])
      : null
  const cross =
    rates && effFrom !== effTo
      ? rates[effTo] / rates[effFrom]
      : null

  function openEditor() {
    setEditing(true)
    setError(null)
  }
  function closeEditor() {
    setEditing(false)
    setDraft(null)
    setError(null)
  }
  function setRate(code: string, value: string) {
    const base = rates ?? {}
    setDraft((prev) => ({
      ...(prev ?? Object.fromEntries(codes.map((c) => [c, str(base[c])]))),
      [code]: value,
    }))
  }
  async function saveRates() {
    if (!rates) return
    const next: Record<string, number> = {}
    for (const code of codes) {
      const value = Number(draft?.[code] ?? rates[code])
      if (!Number.isFinite(value) || value <= 0) {
        setError(`Enter a positive rate for ${code}.`)
        return
      }
      next[code] = value
    }
    setBusy(true)
    setError(null)
    try {
      await currencyRatesRepo.saveCurrencyRates(next)
      setDraft(null)
      setEditing(false)
    } catch {
      setError('Could not save rates.')
    } finally {
      setBusy(false)
    }
  }
  async function resetRates() {
    setBusy(true)
    setError(null)
    try {
      await currencyRatesRepo.resetCurrencyRates()
      setDraft(null)
    } catch {
      setError('Could not reset rates.')
    } finally {
      setBusy(false)
    }
  }

  if (!rates) {
    return (
      <div className={styles.currencyBody}>
        <div className={styles.emptyHint}>Loading offline rates…</div>
      </div>
    )
  }

  return (
    <div className={styles.currencyBody}>
      <div className={styles.convCard}>
        <label className={styles.convAmountLabel} htmlFor="calc-amount">
          Amount
        </label>
        <input
          id="calc-amount"
          className={styles.convAmount}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0"
          aria-label="Amount"
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
        />

        <div className={styles.convPair}>
          <label className={styles.convField}>
            <span className={styles.convFieldLabel}>From</span>
            <select
              className={styles.convSelect}
              aria-label="From currency"
              value={effFrom}
              onChange={(ev) => setFrom(ev.target.value)}
            >
              {codes.map((code) => (
                <option key={code} value={code}>
                  {code} · {currencyName(code)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={styles.swapBtn}
            aria-label="Swap currencies"
            title="Swap currencies"
            onClick={() => {
              setFrom(effTo)
              setTo(effFrom)
            }}
          >
            <ArrowLeftRight size={16} aria-hidden />
          </button>

          <label className={styles.convField}>
            <span className={styles.convFieldLabel}>To</span>
            <select
              className={styles.convSelect}
              aria-label="To currency"
              value={effTo}
              onChange={(ev) => setTo(ev.target.value)}
            >
              {codes.map((code) => (
                <option key={code} value={code}>
                  {code} · {currencyName(code)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.convResult}>
          {hasAmount && output !== null && cross !== null ? (
            <>
              <span className={styles.convResultLine}>
                {formatAmount(num)} {effFrom} =
              </span>
              <output className={styles.convResultStrong} data-testid="currency-output">
                {formatAmount(output)} {effTo}
              </output>
              <span className={styles.convCross} data-testid="cross-rate">
                1 {effFrom} = {formatCrossRate(cross)} {effTo}
              </span>
            </>
          ) : (
            <span className={styles.convResultPlaceholder}>
              Enter an amount to convert.
            </span>
          )}
        </div>
      </div>

      <div className={styles.ratesSection}>
        <div className={styles.ratesHead}>
          <button
            type="button"
            className={styles.ratesToggle}
            aria-expanded={editing}
            onClick={editing ? closeEditor : openEditor}
          >
            <PencilLine size={14} aria-hidden />
            <span>{editing ? 'Close rate editor' : 'Edit rates'}</span>
          </button>
          {row?.editedAt !== null && !editing && (
            <span className={styles.manualChip}>manual</span>
          )}
        </div>

        {editing && (
          <div className={styles.ratesPanel}>
            <p className={styles.ratesNote}>
              Offline, manual rates per 1 {rates.base ?? 'USD'} — stored on this device only,
              never fetched. Update any and save.
            </p>
            <div className={styles.rateList}>
              {codes.map((code) => (
                <div className={styles.rateRow} key={code}>
                  <span className={styles.rateLabel}>
                    <span className={styles.rateCode}>{code}</span>
                    <span className={styles.rateName}>{currencyName(code)}</span>
                  </span>
                  <input
                    type="number"
                    className={styles.rateInput}
                    min="0.000001"
                    step="any"
                    inputMode="decimal"
                    aria-label={`${code} rate per USD`}
                    value={draft?.[code] ?? str(rates[code])}
                    onChange={(ev) => setRate(code, ev.target.value)}
                  />
                </div>
              ))}
            </div>
            {error && (
              <p className={styles.ratesError} role="alert">
                {error}
              </p>
            )}
            <div className={styles.rateActions}>
              <button
                type="button"
                className={styles.rateBtn}
                disabled={busy}
                onClick={resetRates}
              >
                <RotateCcw size={14} aria-hidden />
                <span>Reset rates</span>
              </button>
              <button
                type="button"
                className={`${styles.rateBtn} ${styles.rateBtnPrimary}`}
                disabled={busy}
                onClick={saveRates}
              >
                <Save size={14} aria-hidden />
                <span>Save rates</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
