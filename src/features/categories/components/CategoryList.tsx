import { useLayoutEffect, useRef, useState } from 'react'
import { EmptyState } from '@/shared/components/EmptyState'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Id } from '@/shared/types'
import { budgetLabel, describeBudget } from '../logic/budgetText'
import { sortByName } from '../logic/categoryDraft'
import styles from './CategoryList.module.css'
import { EditCategoryDialog } from './EditCategoryDialog'

/**
 * Categories sorted by name with their monthly budgets. Each can be renamed
 * or given a new budget in a dialog; focus returns to its Edit button.
 */
export function CategoryList() {
  const { data } = useAppData()
  const [editingId, setEditingId] = useState<Id | null>(null)
  const [status, setStatus] = useState('')
  const editButtons = useRef(new Map<Id, HTMLButtonElement>())
  const pendingFocus = useRef<Id | null>(null)

  // Focus is synced to the DOM after the commit: a rename can move the row.
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (id === null) return
    pendingFocus.current = null
    editButtons.current.get(id)?.focus()
  })

  const editing = data.categories.find((c) => c.id === editingId)

  function closeEditor(id: Id) {
    pendingFocus.current = id
    setEditingId(null)
  }

  return (
    <div>
      <p className={styles.status} role="status">
        {status}
      </p>
      {data.categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add a category to start budgeting."
        />
      ) : (
        <ul className={styles.list}>
          {sortByName(data.categories).map((category) => {
            const budget = budgetLabel(category.monthlyBudgetCents)
            return (
              <li key={category.id} className={styles.item}>
                <div className={styles.details}>
                  <p className={styles.name}>{category.name}</p>
                  <p className={styles.budget}>{budget}</p>
                </div>
                <button
                  ref={(button) => {
                    if (button) editButtons.current.set(category.id, button)
                    else editButtons.current.delete(category.id)
                  }}
                  className={styles.edit}
                  type="button"
                  aria-label={`Edit ${category.name}, ${budget}`}
                  onClick={() => {
                    setStatus('')
                    setEditingId(category.id)
                  }}
                >
                  Edit
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <EditCategoryDialog
          key={editing.id}
          category={editing}
          onSave={(saved) => {
            setStatus(
              `Saved ${saved.name} with ${describeBudget(saved.monthlyBudgetCents)}.`,
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
