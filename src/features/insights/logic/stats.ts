import { monthOf } from '@/shared/lib/dates'
import type {
  AppData,
  Category,
  Cents,
  MonthKey,
  Result,
  Transaction,
} from '@/shared/types'
import type { SummaryError } from '@/features/summary'
import { monthlyTotals, monthsEndingWith } from './insights'

export type MonthlyAverage = {
  /** The months averaged over, oldest first (always `count` of them). */
  months: MonthKey[]
  /** Spending across those months. */
  totalCents: Cents
  /** `totalCents / count`, rounded half up to the cent. */
  averageCents: Cents
}

/**
 * Average monthly spending over the `count` months ending with `endMonth`
 * (the selected month included). Every month counts, so a month with no
 * spending pulls the average down. The total is summed as a BigInt, so six
 * safe totals can't overflow, and the average is rounded half up to a
 * whole cent with integer maths. Null when nothing was spent in any of them.
 */
export function averageMonthlySpend(
  data: AppData,
  endMonth: MonthKey,
  count = 6,
): Result<MonthlyAverage | null, SummaryError> {
  const totals = monthlyTotals(data, endMonth, count)
  if (!totals.ok) return totals
  const total = totals.value.reduce((sum, t) => sum + BigInt(t.spentCents), 0n)
  if (total === 0n) return { ok: true, value: null }
  const months = BigInt(count)
  // round(total / count), half up: (2 * total + count) / (2 * count).
  const average = (total * 2n + months) / (months * 2n)
  const totalCents = Number(total)
  if (!Number.isSafeInteger(totalCents)) return { ok: false, error: 'tooLarge' }
  return {
    ok: true,
    value: {
      months: monthsEndingWith(endMonth, count),
      totalCents,
      averageCents: Number(average),
    },
  }
}

export type LargestTransaction = {
  transaction: Transaction
  /** Its category, or null if the category no longer exists. */
  category: Category | null
}

/**
 * The single largest transaction in `month`. Ties go to the earlier date,
 * then to the one entered first. Null when the month has no transactions.
 */
export function largestTransaction(
  data: AppData,
  month: MonthKey,
): LargestTransaction | null {
  let largest: Transaction | null = null
  for (const transaction of data.transactions) {
    if (monthOf(transaction.date) !== month) continue
    if (
      !largest ||
      transaction.amountCents > largest.amountCents ||
      (transaction.amountCents === largest.amountCents &&
        transaction.date < largest.date)
    ) {
      largest = transaction
    }
  }
  if (!largest) return null
  const { categoryId } = largest
  return {
    transaction: largest,
    category: data.categories.find((c) => c.id === categoryId) ?? null,
  }
}
