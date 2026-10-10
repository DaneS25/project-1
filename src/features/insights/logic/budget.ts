import type { CategorySummary } from '@/features/summary'
import type { Cents } from '@/shared/types'

/**
 * The categories worth a row in the budget vs actual chart: every category
 * with a budget (even with nothing spent yet), and categories without one
 * only if they have spending. Keeps the input order.
 */
export function budgetChartRows(
  categories: readonly CategorySummary[],
): CategorySummary[] {
  return categories.filter(
    (summary) => summary.kind === 'budgeted' || summary.spentCents > 0,
  )
}

/**
 * The amount the longest bar stands for: the largest spend or budget across
 * the rows, so every bar shares one scale. 0 when there is nothing to draw.
 */
export function budgetChartMax(rows: readonly CategorySummary[]): Cents {
  return Math.max(
    0,
    ...rows.flatMap((summary) =>
      summary.kind === 'budgeted'
        ? [summary.spentCents, summary.budgetCents]
        : [summary.spentCents],
    ),
  )
}

/**
 * A bar's length as a percentage of the track. The amounts are integer
 * cents; the division here is geometry only, never shown as a figure.
 */
export function barPercent(cents: Cents, maxCents: Cents): number {
  return maxCents === 0 ? 0 : (cents / maxCents) * 100
}
