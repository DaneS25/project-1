import { formatIsoDate } from '@/shared/lib/dates'
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
}

/** One transaction in the list, with its Edit and Delete buttons. */
export function TransactionRow({
  transaction,
  categoryName,
  editButtonRef,
  deleteButtonRef,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const amount = formatCents(transaction.amountCents)
  const date = formatIsoDate(transaction.date)
  // Accessible names start with the visible word and say which row.
  const description = `${categoryName}, ${amount}, ${date}`

  return (
    <li className={styles.item}>
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
          <button
            ref={editButtonRef}
            className={styles.rowButton}
            type="button"
            aria-label={`Edit ${description}`}
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            ref={deleteButtonRef}
            className={[styles.rowButton, styles.deleteButton].join(' ')}
            type="button"
            aria-label={`Delete ${description}`}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}
