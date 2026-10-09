import { describe, expect, it } from 'vitest'
import type { AppData, Category, Transaction } from '@/shared/types'
import { summarizeMonth, type CategorySummary } from './summary'

const groceries: Category = {
  id: 'groceries',
  name: 'Groceries',
  monthlyBudgetCents: 60000,
}
const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 200000 }
const gifts: Category = { id: 'gifts', name: 'Gifts', monthlyBudgetCents: 0 }

let nextId = 0
function spend(
  categoryId: string,
  amountCents: number,
  date: string,
): Transaction {
  nextId += 1
  return { id: `t${String(nextId)}`, amountCents, date, categoryId }
}

function summarize(
  transactions: Transaction[],
  month = '2026-10',
  categories: Category[] = [groceries, rent, gifts],
) {
  const data: AppData = { categories, transactions }
  const result = summarizeMonth(data, month)
  if (!result.ok) throw new Error(`Unexpected error: ${result.error}`)
  return result.value
}

function categorySummary(
  summary: ReturnType<typeof summarize>,
  id: string,
): CategorySummary | undefined {
  return summary.categories.find((c) => c.category.id === id)
}

describe('summarizeMonth', () => {
  it('adds up spending per category for the month', () => {
    const summary = summarize([
      spend('groceries', 1250, '2026-10-02'),
      spend('groceries', 4000, '2026-10-15'),
      spend('rent', 200000, '2026-10-01'),
    ])

    expect(categorySummary(summary, 'groceries')).toEqual({
      kind: 'budgeted',
      category: groceries,
      transactionCount: 2,
      spentCents: 5250,
      budgetCents: 60000,
      remainingCents: 54750,
      isOverBudget: false,
    })
    expect(summary.hasTransactions).toBe(true)
  })

  it('keeps every category in store order, including ones with no spending', () => {
    const summary = summarize([spend('rent', 100, '2026-10-05')])

    expect(summary.categories.map((c) => c.category.id)).toEqual([
      'groceries',
      'rent',
      'gifts',
    ])
    expect(categorySummary(summary, 'groceries')).toMatchObject({
      kind: 'budgeted',
      transactionCount: 0,
      spentCents: 0,
      remainingCents: 60000,
      isOverBudget: false,
    })
  })

  it('reports an empty month with zero totals', () => {
    const summary = summarize([])

    expect(summary.hasTransactions).toBe(false)
    expect(summary.month).toBe('2026-10')
    expect(summary.totals).toEqual({
      spentCents: 0,
      budgetCents: 260000,
      budgetedSpentCents: 0,
      remainingCents: 260000,
      isOverBudget: false,
    })
  })

  it('ignores transactions in other months', () => {
    const summary = summarize([
      spend('groceries', 999, '2026-09-30'),
      spend('groceries', 500, '2026-10-10'),
      spend('groceries', 777, '2026-11-01'),
      spend('groceries', 333, '2025-10-10'),
    ])

    expect(categorySummary(summary, 'groceries')).toMatchObject({
      spentCents: 500,
      transactionCount: 1,
    })
    expect(summary.totals.spentCents).toBe(500)
  })

  it('includes the first and last day of the month', () => {
    const summary = summarize([
      spend('groceries', 100, '2026-10-01'),
      spend('groceries', 200, '2026-10-31'),
    ])

    expect(summary.totals.spentCents).toBe(300)
  })

  it('treats a month with transactions only in other months as empty', () => {
    const summary = summarize([spend('groceries', 100, '2026-09-30')])

    expect(summary.hasTransactions).toBe(false)
    expect(summary.totals.spentCents).toBe(0)
  })

  it('handles the turn of the year', () => {
    const transactions = [
      spend('groceries', 100, '2026-12-31'),
      spend('groceries', 200, '2027-01-01'),
    ]

    expect(summarize(transactions, '2026-12').totals.spentCents).toBe(100)
    expect(summarize(transactions, '2027-01').totals.spentCents).toBe(200)
  })

  it('is not over budget when spending exactly matches the budget', () => {
    const summary = summarize([spend('groceries', 60000, '2026-10-03')])

    expect(categorySummary(summary, 'groceries')).toMatchObject({
      remainingCents: 0,
      isOverBudget: false,
    })
  })

  it('is over budget by one cent, with a negative remaining amount', () => {
    const summary = summarize([spend('groceries', 60001, '2026-10-03')])

    expect(categorySummary(summary, 'groceries')).toMatchObject({
      remainingCents: -1,
      isOverBudget: true,
    })
  })

  describe('a category with budget 0 (no budget set)', () => {
    it('has no remaining figure and is never over budget', () => {
      const summary = summarize([spend('gifts', 50000, '2026-10-20')])

      expect(categorySummary(summary, 'gifts')).toEqual({
        kind: 'unbudgeted',
        category: gifts,
        transactionCount: 1,
        spentCents: 50000,
      })
    })

    it('counts its spending in the spent total but not against budgets', () => {
      const summary = summarize([
        spend('gifts', 50000, '2026-10-20'),
        spend('groceries', 1000, '2026-10-21'),
      ])

      expect(summary.totals).toEqual({
        spentCents: 51000,
        budgetCents: 260000,
        budgetedSpentCents: 1000,
        remainingCents: 259000,
        isOverBudget: false,
      })
    })

    it('adds nothing to the budget total', () => {
      const summary = summarize([], '2026-10', [gifts])

      expect(summary.totals.budgetCents).toBe(0)
      expect(summary.totals.remainingCents).toBe(0)
      expect(summary.totals.isOverBudget).toBe(false)
    })
  })

  it('flags the month as over budget when budgeted spending exceeds the budget total', () => {
    const summary = summarize([
      spend('groceries', 100000, '2026-10-02'),
      spend('rent', 200000, '2026-10-01'),
    ])

    expect(summary.totals).toMatchObject({
      budgetedSpentCents: 300000,
      remainingCents: -40000,
      isOverBudget: true,
    })
  })

  it('works with no categories', () => {
    const summary = summarize([], '2026-10', [])

    expect(summary.categories).toEqual([])
    expect(summary.totals.spentCents).toBe(0)
  })

  describe('safe-integer limit', () => {
    const max = Number.MAX_SAFE_INTEGER

    it('handles totals right at the limit', () => {
      const summary = summarize(
        [
          spend('groceries', max - 1, '2026-10-01'),
          spend('rent', 1, '2026-10-01'),
        ],
        '2026-10',
        [
          { ...groceries, monthlyBudgetCents: max - 1 },
          { ...rent, monthlyBudgetCents: 1 },
        ],
      )

      expect(summary.totals.spentCents).toBe(max)
      expect(summary.totals.budgetCents).toBe(max)
    })

    it('returns an error instead of a rounded total when spending passes the limit', () => {
      const data: AppData = {
        categories: [groceries],
        transactions: [
          spend('groceries', max, '2026-10-01'),
          spend('groceries', 1, '2026-10-02'),
        ],
      }

      expect(summarizeMonth(data, '2026-10')).toEqual({
        ok: false,
        error: 'tooLarge',
      })
    })

    it('returns an error when the budget total passes the limit', () => {
      const data: AppData = {
        categories: [
          { ...groceries, monthlyBudgetCents: max },
          { ...rent, monthlyBudgetCents: 1 },
        ],
        transactions: [],
      }

      expect(summarizeMonth(data, '2026-10')).toEqual({
        ok: false,
        error: 'tooLarge',
      })
    })

    it('ignores huge amounts in other months', () => {
      const summary = summarize(
        [
          spend('groceries', max, '2026-09-01'),
          spend('groceries', max, '2026-11-01'),
          spend('groceries', 5, '2026-10-01'),
        ],
        '2026-10',
        [groceries],
      )

      expect(summary.totals.spentCents).toBe(5)
    })
  })

  it('throws for a month that is not YYYY-MM (a programmer error)', () => {
    const data: AppData = { categories: [], transactions: [] }

    expect(() => summarizeMonth(data, '2026-13')).toThrow(RangeError)
    expect(() => summarizeMonth(data, '2026-10-01')).toThrow(RangeError)
  })

  it('does not change the data it is given', () => {
    const transactions = [spend('groceries', 100, '2026-10-01')]
    const data: AppData = { categories: [groceries], transactions }
    const before = JSON.stringify(data)

    summarizeMonth(data, '2026-10')

    expect(JSON.stringify(data)).toBe(before)
  })
})
