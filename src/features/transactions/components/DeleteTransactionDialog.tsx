import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatIsoDate } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Transaction } from '@/shared/types'

type DeleteTransactionDialogProps = {
  transaction: Transaction
  categoryName: string
  onDelete: (transaction: Transaction) => void
  onCancel: () => void
}

/** Asks before deleting a transaction, naming its category, amount and date. */
export function DeleteTransactionDialog({
  transaction,
  categoryName,
  onDelete,
  onCancel,
}: DeleteTransactionDialogProps) {
  const { deleteTransaction } = useAppData()

  return (
    <ConfirmDialog
      title="Delete this transaction?"
      message={`${categoryName}, ${formatCents(transaction.amountCents)} on ${formatIsoDate(transaction.date)} will be deleted. This can't be undone.`}
      confirmLabel="Delete"
      failureMessage="This transaction couldn't be deleted. It may already have been removed."
      onConfirm={() => deleteTransaction(transaction.id)}
      onConfirmed={() => {
        onDelete(transaction)
      }}
      onCancel={onCancel}
    />
  )
}
