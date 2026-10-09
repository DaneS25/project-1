import { formatIsoDate } from '@/shared/lib/dates'
import { Button } from '@/shared/components/Button'
import { formatCents } from '@/shared/lib/money'
import type { Transaction } from '@/shared/types'
import styles from './TransactionList.module.css'

type TransactionRowProps = {
  transaction: Transaction
  categoryName: string
  /** Receive the buttons so the list can return focus to them. */
  editButtonRef: (button: HTMLButtonElement | null) => void
  deleteButtonRef: (button: HTMLButtonElement | null) => void
  onEdit: () => void
  onDelete: () => void
  /**
   * True for a just-deleted row kept on screen while it fades out. It's
   * inert and hidden from screen readers; the store has already removed it.
   */
  isLeaving?: boolean
  /** Called when the fade-out transition finishes. */
  onLeft?: () => void
}

/** One transaction in the list, with its Edit and Delete buttons. */
export function TransactionRow({
  transaction,
  categoryName,
  editButtonRef,
  deleteButtonRef,
  onEdit,
  onDelete,
  isLeaving = false,
  onLeft,
}: TransactionRowProps) {
  const amount = formatCents(transaction.amountCents)
  const date = formatIsoDate(transaction.date)
  // Accessible names start with the visible word and say which row.
  const description = `${categoryName}, ${amount}, ${date}`

  return (
    <li
      className={
        isLeaving ? [styles.item, styles.leaving].join(' ') : styles.item
      }
      aria-hidden={isLeaving || undefined}
      inert={isLeaving}
      onTransitionEnd={(event) => {
        if (isLeaving && event.target === event.currentTarget) onLeft?.()
      }}
    >
      <div className={styles.details}>
        <p className={styles.category}>{categoryName}</p>
        {transaction.note && <p className={styles.note}>{transaction.note}</p>}
        <time className={styles.date} dateTime={transaction.date}>
          {date}
        </time>
      </div>
      <div className={styles.side}>
        <p className={styles.amount}>{amount}</p>
        <div className={styles.rowActions}>
          <Button
            ref={editButtonRef}
            variant="outline"
            size="small"
            type="button"
            aria-label={`Edit ${description}`}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            ref={deleteButtonRef}
            variant="outline-danger"
            size="small"
            type="button"
            aria-label={`Delete ${description}`}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </li>
  )
}
