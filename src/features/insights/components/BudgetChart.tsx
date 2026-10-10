import { OverBudgetNote } from '@/features/summary'
import { useFirstView } from '@/shared/hooks/useFirstView'
import { formatMonth } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import type { AppData, MonthKey } from '@/shared/types'
import { barPercent, budgetChartMax, budgetChartRows } from '../logic/budget'
import { budgetVsActual } from '../logic/insights'
import { budgetSummary } from '../logic/summaries'
import parts from './ChartParts.module.css'
import { TableToggle } from './TableToggle'
import styles from './BudgetChart.module.css'

type BudgetChartProps = {
  data: AppData
  month: MonthKey
}

/**
 * "Budget vs actual": per category, the budget as an outlined bar and the
 * spending as a filled bar on one shared scale. Each row also states its
 * amounts, so neither colour nor bar length is the only cue; over-budget
 * rows use the summary's red "Over budget by" note with its icon, and
 * categories with no budget show spending only, labelled "No budget set".
 * A summary sentence leads and "Show as table" gives the figures as a
 * table. No tooltips: every row already states its figures.
 */
export function BudgetChart({ data, month }: BudgetChartProps) {
  const { ref: viewRef, seen } = useFirstView()
  const result = budgetVsActual(data, month)
  if (!result.ok) {
    return (
      <p className={styles.message}>
        These totals are too large to chart. Check for an amount entered by
        mistake.
      </p>
    )
  }

  const rows = budgetChartRows(result.value)
  if (rows.length === 0) {
    return <p className={styles.message}>No categories to compare yet.</p>
  }
  const max = budgetChartMax(rows)
  const label = `Budget vs actual by category in ${formatMonth(month)}`

  return (
    <figure
      ref={viewRef}
      className={styles.chart}
      aria-label={label}
      data-seen={seen || undefined}
    >
      <p className={parts.summary}>{budgetSummary(rows)}</p>
      <p className={styles.key} aria-hidden="true">
        <span className={styles.keyBudget} /> Budget
        <span className={styles.keySpent} /> Spent
      </p>
      <ul className={styles.rows} aria-label="Categories, by name">
        {rows.map((summary) => (
          <li
            key={summary.category.id}
            className={styles.row}
            data-category={summary.category.id}
          >
            <p className={styles.name}>{summary.category.name}</p>
            <p className={styles.amounts}>
              {summary.kind === 'budgeted'
                ? `${formatCents(summary.spentCents)} spent of ${formatCents(summary.budgetCents)}`
                : `${formatCents(summary.spentCents)} spent`}
            </p>
            {/* Decorative: the text above and below carries the figures. */}
            <div className={styles.bars} aria-hidden="true">
              {summary.kind === 'budgeted' && (
                <span
                  className={styles.budgetBar}
                  data-bar="budget"
                  style={{
                    inlineSize: `${String(barPercent(summary.budgetCents, max))}%`,
                  }}
                />
              )}
              {summary.spentCents > 0 && (
                <span
                  className={styles.spentBar}
                  data-bar="spent"
                  style={{
                    inlineSize: `${String(barPercent(summary.spentCents, max))}%`,
                  }}
                />
              )}
            </div>
            {summary.kind === 'unbudgeted' ? (
              <p className={styles.standing}>No budget set</p>
            ) : summary.isOverBudget ? (
              <OverBudgetNote
                overCents={-summary.remainingCents}
                className={styles.standing}
              />
            ) : (
              <p className={styles.standing}>
                {formatCents(summary.remainingCents)} remaining
              </p>
            )}
          </li>
        ))}
      </ul>
      <TableToggle>
        <table className={parts.table}>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Spent</th>
              <th scope="col">Budget</th>
              <th scope="col">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((summary) => (
              <tr key={summary.category.id}>
                <th scope="row">{summary.category.name}</th>
                <td>{formatCents(summary.spentCents)}</td>
                {summary.kind === 'budgeted' ? (
                  <>
                    <td>{formatCents(summary.budgetCents)}</td>
                    <td>
                      {summary.isOverBudget
                        ? `Over by ${formatCents(-summary.remainingCents)}`
                        : formatCents(summary.remainingCents)}
                    </td>
                  </>
                ) : (
                  <td colSpan={2}>No budget set</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </figure>
  )
}
