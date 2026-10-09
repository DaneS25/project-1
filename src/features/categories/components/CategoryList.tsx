import { useLayoutEffect, useRef, useState } from 'react'
import { EmptyState } from '@/shared/components/EmptyState'
import { sortCategoriesByName } from '@/shared/lib/categories'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Category, Id } from '@/shared/types'
import { describeBudget } from '../logic/budgetText'
import {
  countTransactionsByCategory,
  transactionCountLabel,
} from '../logic/usage'
import { CategoryRow } from './CategoryRow'
import styles from './CategoryList.module.css'
import { DeleteCategoryDialog } from './DeleteCategoryDialog'
import { EditCategoryDialog } from './EditCategoryDialog'

type OpenDialog = { kind: 'edit'; id: Id } | { kind: 'delete'; id: Id }

/** Where focus goes once the list has re-rendered after a dialog closes. */
type FocusTarget =
  { kind: 'editButton' | 'deleteButton'; id: Id } | { kind: 'list' }

/**
 * Categories sorted by name with their budgets and how many transactions
 * use them. Each can be edited in a dialog, or deleted after a
 * confirmation if no transactions use it.
 */
export function CategoryList() {
  const { data } = useAppData()
  const [openDialog, setOpenDialog] = useState<OpenDialog | null>(null)
  const [status, setStatus] = useState('')
  const editButtons = useRef(new Map<Id, HTMLButtonElement>())
  const deleteButtons = useRef(new Map<Id, HTMLButtonElement>())
  const listRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<FocusTarget | null>(null)

  // Focus is synced to the DOM after the commit, not in the handler: the
  // row may have moved (rename) or gone (delete) by then.
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

  const sorted = sortCategoriesByName(data.categories)
  const counts = countTransactionsByCategory(data.transactions)
  const dialogCategory = data.categories.find((c) => c.id === openDialog?.id)

  function closeDialog(focusTarget: FocusTarget) {
    pendingFocus.current = focusTarget
    setOpenDialog(null)
  }

  /** The next row's Edit button, else the previous row's, else the list. */
  function focusTargetAfterDelete(id: Id): FocusTarget {
    const index = sorted.findIndex((c) => c.id === id)
    const neighbour = sorted[index + 1] ?? sorted[index - 1]
    return neighbour
      ? { kind: 'editButton', id: neighbour.id }
      : { kind: 'list' }
  }

  function handleDelete(category: Category) {
    const count = counts.get(category.id) ?? 0
    if (count > 0) {
      // Blocked: explain instead of opening a confirmation. Focus stays
      // on the Delete button.
      const users =
        count === 1
          ? '1 transaction uses it'
          : `${transactionCountLabel(count)} use it`
      setStatus(
        `${category.name} can't be deleted because ${users}. Move those transactions to another category or delete them first.`,
      )
      return
    }
    setStatus('')
    setOpenDialog({ kind: 'delete', id: category.id })
  }

  return (
    <div ref={listRef} className={styles.container} tabIndex={-1}>
      <p className={styles.status} role="status">
        {status}
      </p>
      {sorted.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add a category to start budgeting."
        />
      ) : (
        <ul className={styles.list}>
          {sorted.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              transactionCount={counts.get(category.id) ?? 0}
              editButtonRef={(button) => {
                if (button) editButtons.current.set(category.id, button)
                else editButtons.current.delete(category.id)
              }}
              deleteButtonRef={(button) => {
                if (button) deleteButtons.current.set(category.id, button)
                else deleteButtons.current.delete(category.id)
              }}
              onEdit={() => {
                setStatus('')
                setOpenDialog({ kind: 'edit', id: category.id })
              }}
              onDelete={() => {
                handleDelete(category)
              }}
            />
          ))}
        </ul>
      )}
      {openDialog?.kind === 'edit' && dialogCategory && (
        <EditCategoryDialog
          key={dialogCategory.id}
          category={dialogCategory}
          onSave={(saved) => {
            setStatus(
              `Saved ${saved.name} with ${describeBudget(saved.monthlyBudgetCents)}.`,
            )
            closeDialog({ kind: 'editButton', id: saved.id })
          }}
          onCancel={() => {
            closeDialog({ kind: 'editButton', id: dialogCategory.id })
          }}
        />
      )}
      {openDialog?.kind === 'delete' && dialogCategory && (
        <DeleteCategoryDialog
          key={dialogCategory.id}
          category={dialogCategory}
          onDelete={(deleted) => {
            setStatus(`Deleted ${deleted.name}.`)
            closeDialog(focusTargetAfterDelete(deleted.id))
          }}
          onCancel={() => {
            closeDialog({ kind: 'deleteButton', id: dialogCategory.id })
          }}
        />
      )}
    </div>
  )
}
