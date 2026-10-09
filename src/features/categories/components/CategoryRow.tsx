import type { Category } from '@/shared/types'
import { Button } from '@/shared/components/Button'
import { budgetLabel } from '../logic/budgetText'
import { transactionCountLabel } from '../logic/usage'
import styles from './CategoryList.module.css'

type CategoryRowProps = {
  category: Category
  transactionCount: number
  /** Receive the buttons so the list can return focus to them. */
  editButtonRef: (button: HTMLButtonElement | null) => void
  deleteButtonRef: (button: HTMLButtonElement | null) => void
  onEdit: () => void
  onDelete: () => void
}

/** One category in the list, with its budget, usage and buttons. */
export function CategoryRow({
  category,
  transactionCount,
  editButtonRef,
  deleteButtonRef,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  const budget = budgetLabel(category.monthlyBudgetCents)
  // Accessible names start with the visible word and say which row.
  const description = `${category.name}, ${budget}`

  return (
    <li className={styles.item}>
      <div className={styles.details}>
        <p className={styles.name}>{category.name}</p>
        <p className={styles.budget}>{budget}</p>
        <p className={styles.usage}>
          {transactionCountLabel(transactionCount)}
        </p>
      </div>
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
    </li>
  )
}
