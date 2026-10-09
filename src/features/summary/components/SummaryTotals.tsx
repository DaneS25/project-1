import { formatCents } from '@/shared/lib/money'
import type { MonthTotals } from '../logic/summary'
import { OverBudgetIcon } from './OverBudgetIcon'
import styles from './MonthlySummary.module.css'

type SummaryTotalsProps = {
  totals: MonthTotals
}

/**
 * The month's totals. "Spent in total" includes categories with no budget,
 * while the budget figures only cover categories that have one, so each
 * figure is labelled to make that clear.
 */
export function SummaryTotals({ totals }: SummaryTotalsProps) {
  const hasBudget = totals.budgetCents > 0

  return (
    <dl className={styles.totals}>
      <div className={styles.total}>
        <dt>Spent in total</dt>
        <dd>{formatCents(totals.spentCents)}</dd>
      </div>
      {hasBudget ? (
        <>
          <div className={styles.total}>
            <dt>Total budget</dt>
            <dd>{formatCents(totals.budgetCents)}</dd>
          </div>
          <div className={styles.total}>
            <dt>Spent in budgeted categories</dt>
            <dd>{formatCents(totals.budgetedSpentCents)}</dd>
          </div>
          {totals.isOverBudget ? (
            <div className={[styles.total, styles.over].join(' ')}>
              <dt>Over budget by</dt>
              <dd>
                <OverBudgetIcon />
                {formatCents(-totals.remainingCents)}
              </dd>
            </div>
          ) : (
            <div className={styles.total}>
              <dt>Remaining</dt>
              <dd>{formatCents(totals.remainingCents)}</dd>
            </div>
          )}
        </>
      ) : (
        <div className={styles.total}>
          <dt>Total budget</dt>
          <dd>No budgets set</dd>
        </div>
      )}
    </dl>
  )
}
