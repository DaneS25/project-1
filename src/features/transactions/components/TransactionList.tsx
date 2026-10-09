import { useLayoutEffect, useRef, useState } from 'react'
import { EmptyState } from '@/shared/components/EmptyState'
import { formatIsoDate } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Id, Transaction } from '@/shared/types'
import { sortNewestFirst } from '../logic/sortTransactions'
import { EditTransactionDialog } from './EditTransactionDialog'
import styles from './TransactionList.module.css'

/**
 * All transactions, newest first, or an empty state when there are none.
 * Each row can be edited in a dialog; focus returns to its Edit button.
 */
export function TransactionList() {
  const { data } = useAppData()
  const [editingId, setEditingId] = useState<Id | null>(null)
  const [status, setStatus] = useState('')
  const editButtons = useRef(new Map<Id, HTMLButtonElement>())
  // The Edit button to focus once the list has re-rendered after an edit.
  const pendingFocus = useRef<Id | null>(null)

  // Focus is synced to the DOM after the commit, not in the handler: a
  // changed date moves the row, and browsers drop focus from a moved node.
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (id === null) return
    pendingFocus.current = null
    editButtons.current.get(id)?.focus()
  })

  const categoryNames = new Map(data.categories.map((c) => [c.id, c.name]))
  const categoryName = (transaction: Transaction) =>
    categoryNames.get(transaction.categoryId) ?? 'Unknown category'
  const editing = data.transactions.find((t) => t.id === editingId)

  function closeEditor(id: Id) {
    pendingFocus.current = id
    setEditingId(null)
  }

  return (
    <div>
      <p className={styles.status} role="status">
        {status}
      </p>
      {data.transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Transactions you add will appear here."
        />
      ) : (
        <ul className={styles.list}>
          {sortNewestFirst(data.transactions).map((transaction) => {
            const amount = formatCents(transaction.amountCents)
            const date = formatIsoDate(transaction.date)
            return (
              <li key={transaction.id} className={styles.item}>
                <div className={styles.details}>
                  <p className={styles.category}>{categoryName(transaction)}</p>
                  {transaction.note && (
                    <p className={styles.note}>{transaction.note}</p>
                  )}
                  <time className={styles.date} dateTime={transaction.date}>
                    {date}
                  </time>
                </div>
                <div className={styles.side}>
                  <p className={styles.amount}>{amount}</p>
                  <button
                    ref={(button) => {
                      if (button) {
                        editButtons.current.set(transaction.id, button)
                      } else {
                        editButtons.current.delete(transaction.id)
                      }
                    }}
                    className={styles.edit}
                    type="button"
                    aria-label={`Edit ${categoryName(transaction)}, ${amount}, ${date}`}
                    onClick={() => {
                      setStatus('')
                      setEditingId(transaction.id)
                    }}
                  >
                    Edit
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <EditTransactionDialog
          key={editing.id}
          transaction={editing}
          onSave={(saved) => {
            setStatus(
              `Saved ${formatCents(saved.amountCents)} in ${categoryName(saved)}.`,
            )
            closeEditor(saved.id)
          }}
          onCancel={() => {
            closeEditor(editing.id)
          }}
        />
      )}
    </div>
  )
}
