import type { CategorySummary } from '@/features/summary'
import { formatMonth } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import { formatShare } from './format'
import type {
  CategoryHistory,
  CategoryMonth,
  MonthTotal,
  SpendingBreakdown,
} from './insights'

/*
 * One-sentence text summaries shown above each chart, so the main point is
 * readable without the picture (and by screen readers, before the detail).
 */

const list = new Intl.ListFormat('en-NZ', {
  style: 'long',
  type: 'conjunction',
})

/** "Rent was the largest category at 42% of $2,100.00." */
export function breakdownSummary(breakdown: SpendingBreakdown): string {
  const [top] = breakdown.items
  if (!top) return 'No spending this month.'
  const total = formatCents(breakdown.totalCents)
  if (breakdown.items.length === 1) {
    return `All ${total} went on ${top.category.name}.`
  }
  const share = formatShare(top.spentCents, breakdown.totalCents) ?? ''
  return `${top.category.name} was the largest category at ${share} of ${total}.`
}

/** The month with the most spending (the latest of any tie), if any. */
function highest<T extends { month: string; spentCents: number }>(
  months: readonly T[],
): T | null {
  let best: T | null = null
  for (const month of months) {
    if (
      month.spentCents > 0 &&
      (!best || month.spentCents >= best.spentCents)
    ) {
      best = month
    }
  }
  return best
}

/**
 * "October 2026: $200.00. The highest month was August 2026 at $500.00."
 * The last month is the selected one.
 */
export function trendSummary(totals: readonly MonthTotal[]): string {
  const last = totals.at(-1)
  const top = highest(totals)
  if (!last || !top) {
    return `No spending in these ${String(totals.length)} months.`
  }
  if (top.month === last.month) {
    return `${formatMonth(last.month)} was the highest of these ${String(totals.length)} months at ${formatCents(last.spentCents)}.`
  }
  return `${formatMonth(last.month)}: ${formatCents(last.spentCents)}. The highest month was ${formatMonth(top.month)} at ${formatCents(top.spentCents)}.`
}

/**
 * "1 of 3 budgeted categories is over budget: Groceries." Only categories
 * with a budget count; the budget-0 rule from task 13 applies.
 */
export function budgetSummary(rows: readonly CategorySummary[]): string {
  const budgeted = rows.filter((row) => row.kind === 'budgeted')
  if (budgeted.length === 0) return 'No categories have a budget set.'
  const over = budgeted
    .filter((row) => row.isOverBudget)
    .map((row) => row.category.name)
  const of = budgeted.length === 1 ? 'category' : 'categories'
  if (over.length === 0) {
    return budgeted.length === 1
      ? `${budgeted[0]?.category.name ?? 'The budgeted category'} is within budget.`
      : `All ${String(budgeted.length)} budgeted ${of} are within budget.`
  }
  const verb = over.length === 1 ? 'is' : 'are'
  return `${String(over.length)} of ${String(budgeted.length)} budgeted ${of} ${verb} over budget: ${list.format(over)}.`
}

/**
 * "Groceries was highest in October 2026 at $450.00. Over its current
 * budget in 1 of 6 months."
 */
export function categorySummary(history: CategoryHistory): string {
  const { category, budgetCents, months } = history
  const count = String(months.length)
  const top = highest<CategoryMonth>(months)
  if (!top) return `No spending on ${category.name} in these ${count} months.`
  const peak = `${category.name} was highest in ${formatMonth(top.month)} at ${formatCents(top.spentCents)}.`
  if (budgetCents === null) return peak
  const over = months.filter((m) => m.spentCents > budgetCents).length
  return over === 0
    ? `${peak} Within its current budget every month.`
    : `${peak} Over its current budget in ${String(over)} of ${count} months.`
}
