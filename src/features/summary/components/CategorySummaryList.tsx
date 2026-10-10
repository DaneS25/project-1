import { formatCents } from '@/shared/lib/money'
import { budgetFill } from '../logic/progress'
import type { CategorySummary } from '../logic/summary'
import { BudgetBar } from './BudgetBar'
import styles from './MonthlySummary.module.css'
import { OverBudgetNote } from './OverBudgetNote'

type CategorySummaryListProps = {
  categories: readonly CategorySummary[]
}

/**
 * Spending per category. A category with a budget shows spent of budget and
 * what's left (or how far over, in words and with an icon, not only red);
 * one with no budget shows only what was spent, and no bar.
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
              <BudgetBar fill={budgetFill(summary) ?? 0} />
              {summary.isOverBudget ? (
                <OverBudgetNote
                  overCents={-summary.remainingCents}
                  className={styles.standing}
                />
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
