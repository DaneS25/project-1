import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EmptyState } from '@/shared/components/EmptyState'
import { formatCents } from '@/shared/lib/money'
import { canAnimateExit } from '@/shared/lib/motion'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Id, Transaction } from '@/shared/types'
import { withLeavingRow, type LeavingRow } from '../logic/leavingRow'
import { sortNewestFirst } from '../logic/sortTransactions'
import { DeleteTransactionDialog } from './DeleteTransactionDialog'
import { EditTransactionDialog } from './EditTransactionDialog'
import styles from './TransactionList.module.css'
import { TransactionRow } from './TransactionRow'

/**
 * Longest a deleted row is kept while it fades out (the CSS fade is
 * --dur-base, 250 ms). A fallback: the row normally goes on transitionend,
 * but nothing waits on that event alone.
 */
export const LEAVE_FALLBACK_MS = 350

type OpenDialog = { kind: 'edit'; id: Id } | { kind: 'delete'; id: Id }

/** Where focus goes once the list has re-rendered after a dialog closes. */
type FocusTarget =
  { kind: 'editButton' | 'deleteButton'; id: Id } | { kind: 'list' }

/**
 * All transactions, newest first, or an empty state when there are none.
 * Each row can be edited or deleted through a dialog.
 */
export function TransactionList() {
  const { data } = useAppData()
  const [openDialog, setOpenDialog] = useState<OpenDialog | null>(null)
  const [status, setStatus] = useState('')
  const editButtons = useRef(new Map<Id, HTMLButtonElement>())
  const deleteButtons = useRef(new Map<Id, HTMLButtonElement>())
  const listRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<FocusTarget | null>(null)
  const [leaving, setLeaving] = useState<LeavingRow | null>(null)

  // Focus is synced to the DOM after the commit, not in the handler: the
  // row may have moved (edit) or gone (delete) by then.
  useLayoutEffect(() => {
    const target = pendingFocus.current
    if (target === null) return
    pendingFocus.current = null
    switch (target.kind) {
      case 'editButton':
        editButtons.current.get(target.id)?.focus()
        break
      case 'deleteButton':
        deleteButtons.current.get(target.id)?.focus()
        break
      case 'list':
        listRef.current?.focus()
        break
      default: {
        const unhandled: never = target
        return unhandled
      }
    }
  })

  // An allowed effect: the fallback timer that clears a fading-out row.
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => {
      setLeaving(null)
    }, LEAVE_FALLBACK_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [leaving])

  const sorted = sortNewestFirst(data.transactions)
  const rows = withLeavingRow(sorted, leaving)
  const categoryNames = new Map(data.categories.map((c) => [c.id, c.name]))
  const categoryName = (transaction: Transaction) =>
    categoryNames.get(transaction.categoryId) ?? 'Unknown category'
  const dialogTransaction = data.transactions.find(
    (t) => t.id === openDialog?.id,
  )

  function closeDialog(focusTarget: FocusTarget) {
    pendingFocus.current = focusTarget
    setOpenDialog(null)
  }

  /**
   * After a delete, focus the row that took the deleted row's place (the
   * next, older one), else the one before it, else the list itself.
   */
  function focusTargetAfterDelete(id: Id): FocusTarget {
    const index = sorted.findIndex((t) => t.id === id)
    const neighbour = sorted[index + 1] ?? sorted[index - 1]
    return neighbour
      ? { kind: 'editButton', id: neighbour.id }
      : { kind: 'list' }
  }

  return (
    <div ref={listRef} className={styles.container} tabIndex={-1}>
      <p className={styles.status} role="status">
        {status}
      </p>
      {rows.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Transactions you add will appear here."
          pinkEmoji="🧸"
        />
      ) : (
        <ul className={styles.list}>
          {rows.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isLeaving={leaving?.transaction.id === transaction.id}
              onLeft={() => {
                setLeaving(null)
              }}
              categoryName={categoryName(transaction)}
              editButtonRef={(button) => {
                if (button) editButtons.current.set(transaction.id, button)
                else editButtons.current.delete(transaction.id)
              }}
              deleteButtonRef={(button) => {
                if (button) deleteButtons.current.set(transaction.id, button)
                else deleteButtons.current.delete(transaction.id)
              }}
              onEdit={() => {
                setStatus('')
                setOpenDialog({ kind: 'edit', id: transaction.id })
              }}
              onDelete={() => {
                setStatus('')
                setOpenDialog({ kind: 'delete', id: transaction.id })
              }}
            />
          ))}
        </ul>
      )}
      {openDialog?.kind === 'edit' && dialogTransaction && (
        <EditTransactionDialog
          key={dialogTransaction.id}
          transaction={dialogTransaction}
          onSave={(saved) => {
            setStatus(
              `Saved ${formatCents(saved.amountCents)} in ${categoryName(saved)}.`,
            )
            closeDialog({ kind: 'editButton', id: saved.id })
          }}
          onCancel={() => {
            closeDialog({ kind: 'editButton', id: dialogTransaction.id })
          }}
        />
      )}
      {openDialog?.kind === 'delete' && dialogTransaction && (
        <DeleteTransactionDialog
          key={dialogTransaction.id}
          transaction={dialogTransaction}
          categoryName={categoryName(dialogTransaction)}
          onDelete={(deleted) => {
            setStatus(
              `Deleted ${formatCents(deleted.amountCents)} from ${categoryName(deleted)}.`,
            )
            // The store has already removed it; keep a copy on screen to
            // fade out where it was, unless motion is off.
            if (canAnimateExit()) {
              setLeaving({
                transaction: deleted,
                index: sorted.findIndex((t) => t.id === deleted.id),
              })
            }
            closeDialog(focusTargetAfterDelete(deleted.id))
          }}
          onCancel={() => {
            closeDialog({ kind: 'deleteButton', id: dialogTransaction.id })
          }}
        />
      )}
    </div>
  )
}
