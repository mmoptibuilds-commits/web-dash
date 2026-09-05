import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { focusLayer, restoreFocus, trapTab } from '@/lib/focus'
import styles from './Modal.module.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Constrain width (px). Defaults to 400. */
  width?: number
  children: ReactNode
}

/** Lightweight, accessible modal used by every dialog/sheet in the shell. */
export function Modal({ open, onClose, title, width = 400, children }: ModalProps) {
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (cardRef.current) trapTab(e, cardRef.current)
    }
    window.addEventListener('keydown', onKey, true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Children may carry native autofocus (applied at commit); focus falls back
    // to the first focusable control once the dialog is on screen.
    const raf = window.requestAnimationFrame(() => {
      if (cardRef.current) focusLayer(cardRef.current)
    })
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
      window.cancelAnimationFrame(raf)
      restoreFocus(prevFocus instanceof Element ? prevFocus : null)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={styles.veil}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={cardRef}
        className={`${styles.card} anim-pop`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth: width }}
      >
        {title !== undefined && (
          <header className={styles.head}>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close dialog"
              onClick={onClose}
            >
              <X size={18} aria-hidden />
            </button>
          </header>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}

interface ConfirmProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Standard two-button confirmation dialog. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width={380}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          autoFocus
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
