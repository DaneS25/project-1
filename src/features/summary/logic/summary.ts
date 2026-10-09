import { isMonthKey, monthOf } from '@/shared/lib/dates'
import type { AppData, Category, Cents, MonthKey, Result } from '@/shared/types'

/**
 * One category's month. A budget of 0 means "no budget set": such a
 * category is `unbudgeted` and has no remaining figure or over-budget flag,
 * so the UI can't show one by mistake.
 */
export type CategorySummary =
  | {
      kind: 'budgeted'
      category: Category
      transactionCount: number
      spentCents: Cents
      budgetCents: Cents
      /** Budget minus spent; negative when over budget. */
      remainingCents: Cents
      /** True only when spent is more than the budget, not equal to it. */
      isOverBudget: boolean
    }
  | {
      kind: 'unbudgeted'
      category: Category
      transactionCount: number
      spentCents: Cents
    }

export type MonthTotals = {
  /** All spending in the month, including categories with no budget. */
  spentCents: Cents
  /** Sum of the budgets that are set; categories with budget 0 add nothing. */
  budgetCents: Cents
  /** Spending in categories that have a budget, measured against it. */
  budgetedSpentCents: Cents
  /** `budgetCents - budgetedSpentCents`; negative when over. */
  remainingCents: Cents
  isOverBudget: boolean
}

export type MonthSummary = {
  month: MonthKey
  /** True if any transaction falls in the month (for the empty state). */
  hasTransactions: boolean
  /** Every category, in the store's order, including ones with no spending. */
  categories: CategorySummary[]
  totals: MonthTotals
}

/** A total would be larger than `Number.MAX_SAFE_INTEGER` cents. */
export type SummaryError = 'tooLarge'

/**
 * Spent vs budget per category for one `YYYY-MM` month. Transactions are
 * matched to the month by the text of their date. Every sum is checked
 * against the safe-integer limit; past it the result is a `tooLarge` error,
 * never a rounded total.
 */
export function summarizeMonth(
  data: AppData,
  month: MonthKey,
): Result<MonthSummary, SummaryError> {
  if (!isMonthKey(month)) {
    throw new RangeError(`Expected a YYYY-MM month, got "${month}"`)
  }

  const spentByCategory = new Map<string, { cents: Cents; count: number }>()
  for (const transaction of data.transactions) {
    if (monthOf(transaction.date) !== month) continue
    const current = spentByCategory.get(transaction.categoryId) ?? {
      cents: 0,
      count: 0,
    }
    const cents = addCents(current.cents, transaction.amountCents)
    if (cents === null) return { ok: false, error: 'tooLarge' }
    spentByCategory.set(transaction.categoryId, {
      cents,
      count: current.count + 1,
    })
  }

  const categories: CategorySummary[] = []
  let spentCents = 0
  let budgetCents = 0
  let budgetedSpentCents = 0
  for (const category of data.categories) {
    const spent = spentByCategory.get(category.id) ?? { cents: 0, count: 0 }
    const nextSpent = addCents(spentCents, spent.cents)
    if (nextSpent === null) return { ok: false, error: 'tooLarge' }
    spentCents = nextSpent

    if (category.monthlyBudgetCents === 0) {
      categories.push({
        kind: 'unbudgeted',
        category,
        transactionCount: spent.count,
        spentCents: spent.cents,
      })
      continue
    }

    const nextBudget = addCents(budgetCents, category.monthlyBudgetCents)
    const nextBudgetedSpent = addCents(budgetedSpentCents, spent.cents)
    if (nextBudget === null || nextBudgetedSpent === null) {
      return { ok: false, error: 'tooLarge' }
    }
    budgetCents = nextBudget
    budgetedSpentCents = nextBudgetedSpent
    categories.push({
      kind: 'budgeted',
      category,
      transactionCount: spent.count,
      spentCents: spent.cents,
      budgetCents: category.monthlyBudgetCents,
      // Both are safe non-negative integers, so the difference is safe too.
      remainingCents: category.monthlyBudgetCents - spent.cents,
      isOverBudget: spent.cents > category.monthlyBudgetCents,
    })
  }

  return {
    ok: true,
    value: {
      month,
      hasTransactions: spentByCategory.size > 0,
      categories,
      totals: {
        spentCents,
        budgetCents,
        budgetedSpentCents,
        remainingCents: budgetCents - budgetedSpentCents,
        isOverBudget: budgetedSpentCents > budgetCents,
      },
    },
  }
}

/** Adds two cent amounts, or returns null if the sum isn't a safe integer. */
function addCents(a: Cents, b: Cents): Cents | null {
  const sum = a + b
  return Number.isSafeInteger(sum) ? sum : null
}
