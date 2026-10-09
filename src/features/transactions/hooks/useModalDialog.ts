import { useEffect, useRef } from 'react'

/**
 * Opens a native <dialog> as a modal while the component is mounted. The
 * browser traps focus inside it and makes the page behind inert.
 * `closeThen` closes the dialog before running the callback, so the page is
 * no longer inert when the caller moves focus back to it.
 */
export function useModalDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // An allowed effect: opening a modal dialog is only possible through the
  // DOM API. The dialog is mounted only while it's needed, and the cleanup
  // closes it, which also handles StrictMode running the effect twice.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => {
      dialog.close()
    }
  }, [])

  function closeThen(notify: () => void) {
    dialogRef.current?.close()
    notify()
  }

  return { dialogRef, closeThen }
}
