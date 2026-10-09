import { formatCents } from '@/shared/lib/money'
import type { CategorySummary } from '../logic/summary'
import styles from './MonthlySummary.module.css'
import { OverBudgetIcon } from './OverBudgetIcon'

type CategorySummaryListProps = {
  categories: readonly CategorySummary[]
}

/**
 * Spending per category. A category with a budget shows spent of budget and
 * what's left (or how far over, in words and with an icon, not only red);
 * one with no budget shows only what was spent.
 */
export function CategorySummaryList({ categories }: CategorySummaryListProps) {
  return (
    <ul className={styles.categories}>
      {categories.map((summary) => (
        <li key={summary.category.id} className={styles.category}>
          <p className={styles.categoryName}>{summary.category.name}</p>
          {summary.kind === 'budgeted' ? (
            <>
              <p className={styles.spent}>
                {formatCents(summary.spentCents)} spent of{' '}
                {formatCents(summary.budgetCents)}
              </p>
              {summary.isOverBudget ? (
                <p className={[styles.standing, styles.over].join(' ')}>
                  <OverBudgetIcon />
                  Over budget by {formatCents(-summary.remainingCents)}
                </p>
              ) : (
                <p className={styles.standing}>
                  {formatCents(summary.remainingCents)} remaining
                </p>
              )}
            </>
          ) : (
            <>
              <p className={styles.spent}>
                {formatCents(summary.spentCents)} spent
              </p>
              <p className={styles.standing}>No budget set</p>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
