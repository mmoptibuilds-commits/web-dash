/**
 * Minimal focus-management helpers shared by modal layers (dialogs, the
 * full-screen folder view, the control-center popover). Implements the
 * WAI-ARIA dialog/focus pattern: focus moves into the layer on open, Tab is
 * trapped inside it, and focus returns to the opener on close.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),' +
  ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Focusable elements inside `root`, in DOM order, excluding hidden ones. */
export function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0,
  )
}

/**
 * Move focus into `root`: an element with a native `autofocus` if one exists
 * (a control that already claimed focus this commit wins), otherwise the first
 * focusable element. Returns the focused element or null when none focusable.
 */
export function focusLayer(root: HTMLElement): HTMLElement | null {
  if (root.contains(document.activeElement)) return document.activeElement as HTMLElement
  const autofocus = root.querySelector<HTMLElement>('[autofocus]')
  if (autofocus) {
    autofocus.focus()
    return autofocus
  }
  const first = focusableIn(root)[0]
  if (first) {
    first.focus()
    return first
  }
  root.focus() // caller gives `root` tabIndex={-1} so the layer is focusable
  return root
}

/** Trap Tab navigation inside `root` (call from a keydown handler). */
export function trapTab(e: KeyboardEvent, root: HTMLElement): void {
  if (e.key !== 'Tab') return
  const items = focusableIn(root)
  if (items.length === 0) {
    e.preventDefault()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (e.shiftKey) {
    if (active === first || !root.contains(active)) {
      e.preventDefault()
      last.focus()
    }
  } else if (active === last || !root.contains(active)) {
    e.preventDefault()
    first.focus()
  }
}

/** Return focus to `node` if it is still connected and focusable. */
export function restoreFocus(node: Element | null): void {
  if (!node || !node.isConnected) return
  const el = node as HTMLElement
  if (typeof el.focus !== 'function') return
  el.focus({ preventScroll: true })
}
