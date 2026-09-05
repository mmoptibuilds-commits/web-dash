import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import styles from './settings.module.css'
import { exportBackupJson, importBackupJson } from '@/data/repositories/backup'
import { wipeAllData } from '@/data/seed'

type ImportStage = 'idle' | 'confirm' | 'working' | 'done' | 'error'
type ResetStage = 'idle' | 'confirm' | 'working' | 'done' | 'error'

function reload(): void {
  window.location.reload()
}

export function BackupControls() {
  const importRef = useRef<HTMLInputElement>(null)

  const [exportState, setExportState] = useState<{ kind: 'idle' } | { kind: 'message'; text: string }>(
    { kind: 'idle' },
  )
  const [importStage, setImportStage] = useState<ImportStage>('idle')
  const [importText, setImportText] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [resetStage, setResetStage] = useState<ResetStage>('idle')

  async function handleExport() {
    setExportState({ kind: 'idle' })
    try {
      const json = await exportBackupJson()
      const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
      const blobUrl = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `hearth-backup-${stamp}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      setExportState({ kind: 'message', text: 'Backup downloaded.' })
    } catch (err) {
      setExportState({
        kind: 'message',
        text: `Export failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      })
    }
  }

  function pickImportFile() {
    importRef.current?.click()
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportStage('idle')
    setImportMessage(null)
    try {
      const text = await file.text()
      setImportText(text)
      setImportStage('confirm')
    } catch {
      setImportMessage('Could not read that file.')
      setImportStage('error')
    }
  }

  async function confirmImport() {
    if (!importText) return
    setImportStage('working')
    setImportMessage(null)
    const result = await importBackupJson(importText)
    if (result.ok) {
      setImportMessage('Backup restored. Reload to refresh every window.')
      setImportStage('done')
    } else {
      setImportMessage(result.reason)
      setImportStage('error')
    }
  }

  function cancelImport() {
    setImportStage('idle')
    setImportText(null)
    setImportMessage(null)
  }

  async function confirmReset() {
    setResetStage('working')
    try {
      await wipeAllData()
      setResetStage('done')
    } catch {
      setResetStage('error')
    }
  }

  function cancelReset() {
    setResetStage('idle')
  }

  return (
    <>
      {/* ---- Export ---- */}
      <div className={styles.settingBlock}>
        <div className={styles.settingText}>
          <span className={styles.settingTitle}>Export backup</span>
          <span className={styles.settingDesc}>
            Downloads a JSON copy of pages, shortcuts, notes, tasks, settings, history and dock.
            Uploaded wallpaper media is excluded to keep the file lean.
          </span>
        </div>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.btn} onClick={handleExport}>
            <Download size={16} aria-hidden />
            <span>Export JSON</span>
          </button>
          {exportState.kind === 'message' ? (
            <span
              className={
                exportState.text.startsWith('Export failed')
                  ? styles.errorText
                  : styles.statusText
              }
              role="status"
            >
              {exportState.text}
            </span>
          ) : null}
        </div>
      </div>

      {/* ---- Import ---- */}
      <div className={styles.settingBlock}>
        <div className={styles.settingText}>
          <span className={styles.settingTitle}>Import backup</span>
          <span className={styles.settingDesc}>
            Restores from a Hearth JSON file. This replaces your current data.
          </span>
        </div>
        <input
          ref={importRef}
          type="file"
          className={styles.hiddenInput}
          accept="application/json,.json"
          tabIndex={-1}
          aria-hidden
          onChange={handleImportFile}
        />
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.btn}
            onClick={pickImportFile}
            disabled={importStage === 'working'}
          >
            <Upload size={16} aria-hidden />
            <span>Import JSON…</span>
          </button>
        </div>

        {importStage === 'confirm' ? (
          <div className={styles.confirmBox} role="alertdialog" aria-label="Confirm import">
            <p className={styles.confirmText}>
              Importing will replace all current pages, shortcuts, folders, widgets, notes, tasks,
              settings, history and dock items with the backup contents. Continue?
            </p>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.btnDanger} onClick={confirmImport}>
                Import
              </button>
              <button type="button" className={styles.btn} onClick={cancelImport}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {importStage === 'working' ? <p className={styles.statusText}>Importing…</p> : null}
        {importStage === 'done' ? (
          <div className={styles.confirmBox} role="status">
            <p className={styles.confirmText}>{importMessage}</p>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.btn} onClick={reload}>
                Reload now
              </button>
            </div>
          </div>
        ) : null}
        {importStage === 'error' ? (
          <p className={styles.errorText} role="alert">
            {importMessage}
          </p>
        ) : null}
      </div>

      {/* ---- Reset ---- */}
      <div className={styles.settingBlock}>
        <div className={styles.settingText}>
          <span className={styles.settingTitle}>Reset all data</span>
          <span className={styles.settingDesc}>
            Erases everything on this device and restores Hearth to a fresh install. This cannot be
            undone.
          </span>
        </div>

        {resetStage === 'idle' ? (
          <div className={styles.buttonRow}>
            <button type="button" className={styles.btnDanger} onClick={() => setResetStage('confirm')}>
              <Trash2 size={16} aria-hidden />
              <span>Reset all data…</span>
            </button>
          </div>
        ) : null}

        {resetStage === 'confirm' ? (
          <div className={styles.confirmBox} role="alertdialog" aria-label="Confirm reset">
            <p className={styles.confirmText}>
              This permanently deletes all local data. Are you sure?
            </p>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.btnDanger} onClick={confirmReset}>
                Erase everything
              </button>
              <button type="button" className={styles.btn} onClick={cancelReset}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {resetStage === 'working' ? <p className={styles.statusText}>Erasing…</p> : null}
        {resetStage === 'done' ? (
          <div className={styles.confirmBox} role="status">
            <p className={styles.confirmText}>All data has been erased. Reload to start fresh.</p>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.btn} onClick={reload}>
                Reload now
              </button>
            </div>
          </div>
        ) : null}
        {resetStage === 'error' ? (
          <p className={styles.errorText} role="alert">
            Reset failed — close other tabs and try again.
          </p>
        ) : null}
      </div>
    </>
  )
}
