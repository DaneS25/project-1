import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import { centsToAmountInput } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Transaction } from '@/shared/types'
import { useTransactionDraft } from '../hooks/useTransactionDraft'
import styles from './EditTransactionDialog.module.css'
import formStyles from './TransactionForm.module.css'
import { TransactionFields } from './TransactionFields'

type EditTransactionDialogProps = {
  transaction: Transaction
  onSave: (transaction: Transaction) => void
  onCancel: () => void
}

/**
 * A modal form, pre-filled with a transaction, for changing it. Uses the
 * native <dialog>, which traps focus while open and puts it on the first
 * field. The dialog closes itself before telling the parent, so focus can
 * go back to the page.
 */
export function EditTransactionDialog({
  transaction,
  onSave,
  onCancel,
}: EditTransactionDialogProps) {
  const { data, updateTransaction } = useAppData()
  const form = useTransactionDraft({
    amount: centsToAmountInput(transaction.amountCents),
    date: transaction.date,
    categoryId: transaction.categoryId,
    note: transaction.note ?? '',
  })
  const [isRejected, setIsRejected] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingId = useId()

  // An allowed effect: opening a modal dialog is only possible through the
  // DOM API. The dialog is mounted only while editing, and the cleanup
  // closes it, which also handles StrictMode running the effect twice.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => {
      dialog.close()
    }
  }, [])

  function finish(notify: () => void) {
    dialogRef.current?.close()
    notify()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsRejected(false)
    const changes = form.validate(data.categories)
    if (!changes) return
    const updated = { id: transaction.id, ...changes }
    if (!updateTransaction(updated)) {
      setIsRejected(true)
      return
    }
    finish(() => {
      onSave(updated)
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={headingId}
      onCancel={(event) => {
        // Escape: close through the same path as the Cancel button.
        event.preventDefault()
        finish(onCancel)
      }}
    >
      <form className={formStyles.form} noValidate onSubmit={handleSubmit}>
        <h2 id={headingId} className={styles.title}>
          Edit transaction
        </h2>
        <TransactionFields
          form={form}
          categories={data.categories}
          onChange={form.change}
        />
        {isRejected && (
          <p className={formStyles.formError} role="alert">
            These changes couldn&apos;t be saved. Check the details and try
            again.
          </p>
        )}
        <div className={formStyles.actions}>
          <button className={formStyles.submit} type="submit">
            Save changes
          </button>
          <button
            className={formStyles.secondary}
            type="button"
            onClick={() => {
              finish(onCancel)
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  )
}
