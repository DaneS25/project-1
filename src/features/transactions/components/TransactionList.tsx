import { EmptyState } from '@/shared/components/EmptyState'
import { formatIsoDate } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import { sortNewestFirst } from '../logic/sortTransactions'
import styles from './TransactionList.module.css'

/** All transactions, newest first, or an empty state when there are none. */
export function TransactionList() {
  const { data } = useAppData()

  if (data.transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Transactions you add will appear here."
      />
    )
  }

  const categoryNames = new Map(data.categories.map((c) => [c.id, c.name]))

  return (
    <ul className={styles.list}>
      {sortNewestFirst(data.transactions).map((transaction) => (
        <li key={transaction.id} className={styles.item}>
          <div className={styles.details}>
            <p className={styles.category}>
              {categoryNames.get(transaction.categoryId) ?? 'Unknown category'}
            </p>
            {transaction.note && (
              <p className={styles.note}>{transaction.note}</p>
            )}
            <time className={styles.date} dateTime={transaction.date}>
              {formatIsoDate(transaction.date)}
            </time>
          </div>
          <p className={styles.amount}>
            {formatCents(transaction.amountCents)}
          </p>
        </li>
      ))}
    </ul>
  )
}
