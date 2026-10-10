import { describe, expect, it } from 'vitest'
import type { AppData, Category, Transaction } from '@/shared/types'
import { averageMonthlySpend, largestTransaction } from './stats'

const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 0 }

let nextId = 0
function spend(amountCents: number, date: string): Transaction {
  nextId += 1
  return { id: `t${String(nextId)}`, amountCents, date, categoryId: rent.id }
}

const withSpending = (...transactions: Transaction[]): AppData => ({
  categories: [rent],
  transactions,
})

describe('averageMonthlySpend', () => {
  it('averages the 6 months ending with the selected one, empty months included', () => {
    const result = averageMonthlySpend(
      withSpending(
        spend(60000, '2026-10-01'),
        spend(30000, '2026-08-15'),
        // Outside the 6 months: before May, and after October.
        spend(99999, '2026-04-30'),
        spend(99999, '2026-11-01'),
      ),
      '2026-10',
    )

    expect(result).toEqual({
      ok: true,
      value: {
        months: [
          '2026-05',
          '2026-06',
          '2026-07',
          '2026-08',
          '2026-09',
          '2026-10',
        ],
        totalCents: 90000,
        averageCents: 15000,
      },
    })
  })

  it.each([
    // total cents over 6 months, average (rounded half up to the cent)
    [100, 17], // 16.67
    [3, 1], // 0.5 rounds up
    [2, 0], // 0.33 rounds down
    [9, 2], // 1.5 rounds up
  ])('rounds a total of %i cents to an average of %i', (total, average) => {
    const result = averageMonthlySpend(
      withSpending(spend(total, '2026-10-01')),
      '2026-10',
    )
    expect(result.ok && result.value?.averageCents).toBe(average)
  })

  it('reports a 6-month total past the safe-integer limit as too large', () => {
    // Each month is safe, but their sum is not; the BigInt sum catches it.
    const big = Math.floor(Number.MAX_SAFE_INTEGER / 4)
    const transactions = ['05', '06', '07', '08', '09', '10'].map((m) =>
      spend(big, `2026-${m}-01`),
    )
    const result = averageMonthlySpend(withSpending(...transactions), '2026-10')
    expect(result).toEqual({ ok: false, error: 'tooLarge' })
  })

  it('is null when nothing was spent in any of the months', () => {
    expect(
      averageMonthlySpend(withSpending(spend(500, '2026-01-01')), '2026-10'),
    ).toEqual({ ok: true, value: null })
  })
})

describe('largestTransaction', () => {
  it('finds the largest transaction in the month, with its category', () => {
    const largest = spend(80000, '2026-10-20')
    const result = largestTransaction(
      withSpending(
        spend(5000, '2026-10-01'),
        largest,
        spend(999999, '2026-09-30'),
      ),
      '2026-10',
    )
    expect(result).toEqual({ transaction: largest, category: rent })
  })

  it('breaks a tie by the earlier date, then the one entered first', () => {
    const early = spend(5000, '2026-10-02')
    const first = spend(5000, '2026-10-09')
    const result = largestTransaction(
      withSpending(first, spend(5000, '2026-10-09'), early),
      '2026-10',
    )
    expect(result?.transaction).toBe(early)

    const sameDay = largestTransaction(
      withSpending(first, spend(5000, '2026-10-09')),
      '2026-10',
    )
    expect(sameDay?.transaction).toBe(first)
  })

  it('has a null category when the category is gone', () => {
    const result = largestTransaction(
      { categories: [], transactions: [spend(100, '2026-10-01')] },
      '2026-10',
    )
    expect(result?.category).toBeNull()
  })

  it('is null for a month with no transactions', () => {
    expect(largestTransaction(withSpending(), '2026-10')).toBeNull()
  })
})
