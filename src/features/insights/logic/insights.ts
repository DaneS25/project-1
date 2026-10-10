import {
  summarizeMonth,
  type CategorySummary,
  type SummaryError,
} from '@/features/summary'
import { compareCategoryNames } from '@/shared/lib/categories'
import { addMonths } from '@/shared/lib/dates'
import type {
  AppData,
  Category,
  Cents,
  Id,
  MonthKey,
  Result,
} from '@/shared/types'

/** One category's spending in a month, as a part of the month's total. */
export type CategorySpend = {
  category: Category
  spentCents: Cents
}

export type SpendingBreakdown = {
  month: MonthKey
  /** All spending in the month; the denominator for every share. */
  totalCents: Cents
  /** Categories with spending, largest first (ties by name). */
  items: CategorySpend[]
}

export type MonthTotal = {
  month: MonthKey
  spentCents: Cents
  /** Sum of the budgets that are set (0 when none are). */
  budgetCents: Cents
}

export type CategoryMonth = {
  month: MonthKey
  spentCents: Cents
}

export type CategoryHistory = {
  category: Category
  /** The category's budget, or null when none is set (budget 0). */
  budgetCents: Cents | null
  months: CategoryMonth[]
}

export type MonthChange = {
  month: MonthKey
  previousMonth: MonthKey
  currentCents: Cents
  previousCents: Cents
  /** current minus previous; negative when spending went down. */
  changeCents: Cents
  direction: 'up' | 'down' | 'same'
}

export type InsightsError = SummaryError | 'unknownCategory'

/**
 * Spending per category for a month, as amounts in cents. A share is the
 * pair (spentCents, totalCents); round it only for display with
 * `formatShare`. A month with no spending has no items and a total of 0.
 */
export function spendingByCategory(
  data: AppData,
  month: MonthKey,
): Result<SpendingBreakdown, SummaryError> {
  const summary = summarizeMonth(data, month)
  if (!summary.ok) return summary
  const items = summary.value.categories
    .filter((c) => c.spentCents > 0)
    .map(({ category, spentCents }) => ({ category, spentCents }))
    .sort(
      (a, b) =>
        b.spentCents - a.spentCents ||
        compareCategoryNames(a.category, b.category),
    )
  return {
    ok: true,
    value: { month, totalCents: summary.value.totals.spentCents, items },
  }
}

/**
 * Total spending (and total set budget) for each of the `count` months
 * ending with `endMonth`, oldest first. Months with no spending are 0.
 */
export function monthlyTotals(
  data: AppData,
  endMonth: MonthKey,
  count: number,
): Result<MonthTotal[], SummaryError> {
  const totals: MonthTotal[] = []
  for (const month of monthsEndingWith(endMonth, count)) {
    const summary = summarizeMonth(data, month)
    if (!summary.ok) return summary
    totals.push({
      month,
      spentCents: summary.value.totals.spentCents,
      budgetCents: summary.value.totals.budgetCents,
    })
  }
  return { ok: true, value: totals }
}

/**
 * One category's spending for each of the `count` months ending with
 * `endMonth`, oldest first, with its budget (null when none is set).
 */
export function categoryMonthlyTotals(
  data: AppData,
  categoryId: Id,
  endMonth: MonthKey,
  count: number,
): Result<CategoryHistory, InsightsError> {
  const category = data.categories.find((c) => c.id === categoryId)
  if (!category) return { ok: false, error: 'unknownCategory' }
  const months: CategoryMonth[] = []
  for (const month of monthsEndingWith(endMonth, count)) {
    const summary = summarizeMonth(data, month)
    if (!summary.ok) return summary
    const entry = summary.value.categories.find(
      (c) => c.category.id === categoryId,
    )
    months.push({ month, spentCents: entry?.spentCents ?? 0 })
  }
  return {
    ok: true,
    value: {
      category,
      budgetCents:
        category.monthlyBudgetCents === 0 ? null : category.monthlyBudgetCents,
      months,
    },
  }
}

/**
 * Budget vs actual per category for a month, sorted by name. It is the
 * summary's per-category result, so the budget-0 rule from task 13 holds:
 * a category with no budget is `unbudgeted` and has no remaining figure or
 * over-budget flag.
 */
export function budgetVsActual(
  data: AppData,
  month: MonthKey,
): Result<CategorySummary[], SummaryError> {
  const summary = summarizeMonth(data, month)
  if (!summary.ok) return summary
  return {
    ok: true,
    value: [...summary.value.categories].sort((a, b) =>
      compareCategoryNames(a.category, b.category),
    ),
  }
}

/** Spending this month against the month before. */
export function monthOverMonth(
  data: AppData,
  month: MonthKey,
): Result<MonthChange, SummaryError> {
  const previousMonth = addMonths(month, -1)
  const current = summarizeMonth(data, month)
  if (!current.ok) return current
  const previous = summarizeMonth(data, previousMonth)
  if (!previous.ok) return previous
  const currentCents = current.value.totals.spentCents
  const previousCents = previous.value.totals.spentCents
  // Both are safe and non-negative, so the difference is safe too.
  const changeCents = currentCents - previousCents
  return {
    ok: true,
    value: {
      month,
      previousMonth,
      currentCents,
      previousCents,
      changeCents,
      direction: changeCents > 0 ? 'up' : changeCents < 0 ? 'down' : 'same',
    },
  }
}

/** The `count` months ending with `endMonth`, oldest first. */
export function monthsEndingWith(
  endMonth: MonthKey,
  count: number,
): MonthKey[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(
      `Expected a whole number of months, got ${String(count)}`,
    )
  }
  return Array.from({ length: count }, (_, i) =>
    addMonths(endMonth, i - count + 1),
  )
}
