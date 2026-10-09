import { useEffect, useId, useRef, useState } from 'react'
import { formatIsoDate } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Transaction } from '@/shared/types'
import { useModalDialog } from '@/shared/hooks/useModalDialog'
import styles from '@/shared/components/Dialog.module.css'
import formStyles from '@/shared/components/Form.module.css'

type DeleteTransactionDialogProps = {
  transaction: Transaction
  categoryName: string
  onDelete: (transaction: Transaction) => void
  onCancel: () => void
}

/**
 * Asks before deleting a transaction, naming its category, amount and
 * date. Focus starts on Cancel, so pressing Enter by habit doesn't delete.
 */
export function DeleteTransactionDialog({
  transaction,
  categoryName,
  onDelete,
  onCancel,
}: DeleteTransactionDialogProps) {
  const { deleteTransaction } = useAppData()
  const { dialogRef, closeThen } = useModalDialog()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [isRejected, setIsRejected] = useState(false)
  const headingId = useId()
  const messageId = useId()

  // Runs after useModalDialog's effect has opened the dialog. React's
  // autoFocus would fire before showModal(), while the dialog is closed.
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  function handleDelete() {
    if (!deleteTransaction(transaction.id)) {
      setIsRejected(true)
      return
    }
    closeThen(() => {
      onDelete(transaction)
    })
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
          Delete this transaction?
        </h2>
        <p id={messageId} className={styles.message}>
          {categoryName}, {formatCents(transaction.amountCents)} on{' '}
          {formatIsoDate(transaction.date)} will be deleted. This can&apos;t be
          undone.
        </p>
        {isRejected && (
          <p className={formStyles.formError} role="alert">
            This transaction couldn&apos;t be deleted. It may already have been
            removed.
          </p>
        )}
        <div className={formStyles.actions}>
          <button
            className={formStyles.danger}
            type="button"
            onClick={handleDelete}
          >
            Delete
          </button>
          <button
            ref={cancelRef}
            className={formStyles.secondary}
            type="button"
            onClick={() => {
              closeThen(onCancel)
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  )
}
