import { useId, useState, type SubmitEvent } from 'react'
import { Button } from '@/shared/components/Button'
import { centsToAmountInput } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Transaction } from '@/shared/types'
import { useFormDraft } from '@/shared/hooks/useFormDraft'
import {
  validateTransactionDraft,
  type TransactionDraft,
} from '../logic/transactionDraft'
import { useModalDialog } from '@/shared/hooks/useModalDialog'
import styles from '@/shared/components/Dialog.module.css'
import formStyles from '@/shared/components/Form.module.css'
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
  const form = useFormDraft<TransactionDraft>({
    amount: centsToAmountInput(transaction.amountCents),
    date: transaction.date,
    categoryId: transaction.categoryId,
    note: transaction.note ?? '',
  })
  const [isRejected, setIsRejected] = useState(false)
  const { dialogRef, closeThen } = useModalDialog()
  const headingId = useId()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsRejected(false)
    const changes = form.check((draft) =>
      validateTransactionDraft(draft, data.categories),
    )
    if (!changes) return
    const updated = { id: transaction.id, ...changes }
    if (!updateTransaction(updated)) {
      setIsRejected(true)
      return
    }
    closeThen(() => {
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
        closeThen(onCancel)
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
          <Button variant="primary" type="submit">
            Save changes
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              closeThen(onCancel)
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </dialog>
  )
}
