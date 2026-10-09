import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { useModalDialog } from '@/shared/hooks/useModalDialog'
import styles from './Dialog.module.css'
import formStyles from './Form.module.css'

type ConfirmDialogProps = {
  title: string
  /** Says exactly what will happen; read out as the dialog's description. */
  message: ReactNode
  confirmLabel: string
  /** Shown if `onConfirm` reports that the action failed. */
  failureMessage: string
  /** Does the action. Return false if it failed; the dialog stays open. */
  onConfirm: () => boolean
  /** Called after a successful confirm, once the dialog has closed. */
  onConfirmed: () => void
  onCancel: () => void
}

/**
 * A modal confirmation for a destructive action (`role="alertdialog"`).
 * Focus starts on Cancel, so pressing Enter by habit doesn't confirm.
 * Escape and Cancel close it without acting.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  failureMessage,
  onConfirm,
  onConfirmed,
  onCancel,
}: ConfirmDialogProps) {
  const { dialogRef, closeThen } = useModalDialog()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [hasFailed, setHasFailed] = useState(false)
  const headingId = useId()
  const messageId = useId()

  // Runs after useModalDialog's effect has opened the dialog. React's
  // autoFocus would fire before showModal(), while the dialog is closed.
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  function handleConfirm() {
    if (!onConfirm()) {
      setHasFailed(true)
      return
    }
    closeThen(onConfirmed)
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      role="alertdialog"
      aria-labelledby={headingId}
      aria-describedby={messageId}
      onCancel={(event) => {
        // Escape: close through the same path as the Cancel button.
        event.preventDefault()
        closeThen(onCancel)
      }}
    >
      <div className={styles.content}>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        <p id={messageId} className={styles.message}>
          {message}
        </p>
        {hasFailed && (
          <p className={formStyles.formError} role="alert">
            {failureMessage}
          </p>
        )}
        <div className={formStyles.actions}>
          <Button variant="danger" type="button" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
          <Button
            ref={cancelRef}
            variant="secondary"
            type="button"
            onClick={() => {
              closeThen(onCancel)
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </dialog>
  )
}
