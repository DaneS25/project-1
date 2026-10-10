import { describe, expect, it } from 'vitest'
import type { AppData, Category, Transaction } from '@/shared/types'
import {
  budgetVsActual,
  categoryMonthlyTotals,
  monthlyTotals,
  monthOverMonth,
  monthsEndingWith,
  spendingByCategory,
} from './insights'

const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 200000 }
const groceries: Category = {
  id: 'groceries',
  name: 'Groceries',
  monthlyBudgetCents: 60000,
}
const gifts: Category = { id: 'gifts', name: 'Gifts', monthlyBudgetCents: 0 }

let nextId = 0
function spend(categoryId: string, amountCents: number, date: string) {
  nextId += 1
  return { id: `t${String(nextId)}`, amountCents, date, categoryId }
}

function data(transactions: Transaction[] = []): AppData {
  return { categories: [rent, groceries, gifts], transactions }
}

function ok<T>(result: { ok: true; value: T } | { ok: false; error: string }) {
  if (!result.ok) throw new Error(`Unexpected error: ${result.error}`)
  return result.value
}

describe('monthsEndingWith', () => {
  it('lists months oldest first, across a year boundary', () => {
    expect(monthsEndingWith('2026-02', 4)).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ])
  })

  it('gives just the end month for a count of 1', () => {
    expect(monthsEndingWith('2026-10', 1)).toEqual(['2026-10'])
  })

  it.each([0, -1, 1.5])('throws for a count of %s', (count) => {
    expect(() => monthsEndingWith('2026-10', count)).toThrow(RangeError)
  })
})

describe('spendingByCategory', () => {
  it('gives each category with spending, largest first, and the total', () => {
    const value = ok(
      spendingByCategory(
        data([
          spend('groceries', 5000, '2026-10-02'),
          spend('rent', 200000, '2026-10-01'),
          spend('gifts', 3000, '2026-10-05'),
          spend('groceries', 2000, '2026-10-20'),
        ]),
        '2026-10',
      ),
    )

    expect(value.totalCents).toBe(210000)
    expect(value.items.map((i) => [i.category.name, i.spentCents])).toEqual([
      ['Rent', 200000],
      ['Groceries', 7000],
      ['Gifts', 3000],
    ])
  })

  it('counts a category with no budget like any other', () => {
    const value = ok(
      spendingByCategory(data([spend('gifts', 100, '2026-10-01')]), '2026-10'),
    )

    expect(value.items).toEqual([{ category: gifts, spentCents: 100 }])
    expect(value.totalCents).toBe(100)
  })

  it('breaks ties by name', () => {
    const value = ok(
      spendingByCategory(
        data([
          spend('rent', 500, '2026-10-01'),
          spend('groceries', 500, '2026-10-01'),
        ]),
        '2026-10',
      ),
    )

    expect(value.items.map((i) => i.category.name)).toEqual([
      'Groceries',
      'Rent',
    ])
  })

  it('is empty with a total of 0 for a month with no spending', () => {
    const value = ok(
      spendingByCategory(data([spend('rent', 1, '2026-09-30')]), '2026-10'),
    )

    expect(value).toEqual({ month: '2026-10', totalCents: 0, items: [] })
  })

  it('reports totals that are too large instead of a wrong number', () => {
    const max = Number.MAX_SAFE_INTEGER
    const result = spendingByCategory(
      data([spend('rent', max, '2026-10-01'), spend('rent', 1, '2026-10-02')]),
      '2026-10',
    )

    expect(result).toEqual({ ok: false, error: 'tooLarge' })
  })
})

describe('monthlyTotals', () => {
  it('gives each month oldest first, with empty months as zero', () => {
    const value = ok(
      monthlyTotals(
        data([
          spend('rent', 100, '2026-08-31'),
          spend('rent', 200, '2026-10-01'),
          spend('gifts', 50, '2026-10-31'),
          spend('rent', 999, '2026-11-01'),
        ]),
        '2026-10',
        3,
      ),
    )

    expect(value).toEqual([
      { month: '2026-08', spentCents: 100, budgetCents: 260000 },
      { month: '2026-09', spentCents: 0, budgetCents: 260000 },
      { month: '2026-10', spentCents: 250, budgetCents: 260000 },
    ])
  })

  it('crosses the turn of the year', () => {
    const value = ok(
      monthlyTotals(
        data([spend('rent', 1, '2025-12-31'), spend('rent', 2, '2026-01-01')]),
        '2026-01',
        2,
      ),
    )

    expect(value.map((m) => [m.month, m.spentCents])).toEqual([
      ['2025-12', 1],
      ['2026-01', 2],
    ])
  })

  it('gives zeros, and a zero budget, with no categories or transactions', () => {
    const value = ok(
      monthlyTotals({ categories: [], transactions: [] }, '2026-10', 2),
    )

    expect(value).toEqual([
      { month: '2026-09', spentCents: 0, budgetCents: 0 },
      { month: '2026-10', spentCents: 0, budgetCents: 0 },
    ])
  })
})

describe('categoryMonthlyTotals', () => {
  it('gives one category per month with its budget', () => {
    const value = ok(
      categoryMonthlyTotals(
        data([
          spend('groceries', 100, '2026-09-15'),
          spend('rent', 999, '2026-09-15'),
          spend('groceries', 300, '2026-10-01'),
        ]),
        'groceries',
        '2026-10',
        3,
      ),
    )

    expect(value).toEqual({
      category: groceries,
      budgetCents: 60000,
      months: [
        { month: '2026-08', spentCents: 0 },
        { month: '2026-09', spentCents: 100 },
        { month: '2026-10', spentCents: 300 },
      ],
    })
  })

  it('gives no budget (null) for a category with budget 0', () => {
    const value = ok(categoryMonthlyTotals(data(), 'gifts', '2026-10', 1))

    expect(value.budgetCents).toBeNull()
  })

  it('reports an unknown category', () => {
    expect(categoryMonthlyTotals(data(), 'nope', '2026-10', 1)).toEqual({
      ok: false,
      error: 'unknownCategory',
    })
  })
})

describe('budgetVsActual', () => {
  it('gives every category sorted by name, keeping the budget-0 rule', () => {
    const value = ok(
      budgetVsActual(
        data([
          spend('groceries', 70000, '2026-10-02'),
          spend('gifts', 5000, '2026-10-02'),
        ]),
        '2026-10',
      ),
    )

    expect(value.map((c) => c.category.name)).toEqual([
      'Gifts',
      'Groceries',
      'Rent',
    ])
    expect(value[0]).toEqual({
      kind: 'unbudgeted',
      category: gifts,
      transactionCount: 1,
      spentCents: 5000,
    })
    expect(value[1]).toMatchObject({
      kind: 'budgeted',
      spentCents: 70000,
      remainingCents: -10000,
      isOverBudget: true,
    })
    expect(value[2]).toMatchObject({ spentCents: 0, isOverBudget: false })
  })
})

describe('monthOverMonth', () => {
  it('compares a month with the one before', () => {
    const value = ok(
      monthOverMonth(
        data([
          spend('rent', 1000, '2026-09-10'),
          spend('rent', 1250, '2026-10-10'),
        ]),
        '2026-10',
      ),
    )

    expect(value).toEqual({
      month: '2026-10',
      previousMonth: '2026-09',
      currentCents: 1250,
      previousCents: 1000,
      changeCents: 250,
      direction: 'up',
    })
  })

  it('reports a drop and an unchanged month', () => {
    const down = ok(
      monthOverMonth(
        data([
          spend('rent', 1000, '2026-09-10'),
          spend('rent', 400, '2026-10-10'),
        ]),
        '2026-10',
      ),
    )
    const same = ok(monthOverMonth(data(), '2026-10'))

    expect(down).toMatchObject({ changeCents: -600, direction: 'down' })
    expect(same).toMatchObject({ changeCents: 0, direction: 'same' })
  })

  it('compares January with December of the year before', () => {
    const value = ok(
      monthOverMonth(data([spend('rent', 500, '2025-12-31')]), '2026-01'),
    )

    expect(value).toMatchObject({
      previousMonth: '2025-12',
      previousCents: 500,
      currentCents: 0,
      direction: 'down',
    })
  })

  it('handles a previous month with no spending without dividing', () => {
    const value = ok(
      monthOverMonth(data([spend('rent', 500, '2026-10-01')]), '2026-10'),
    )

    expect(value).toMatchObject({
      previousCents: 0,
      changeCents: 500,
      direction: 'up',
    })
  })
})
