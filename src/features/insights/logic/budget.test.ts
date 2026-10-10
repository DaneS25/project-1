import { describe, expect, it } from 'vitest'
import type { CategorySummary } from '@/features/summary'
import { barPercent, budgetChartMax, budgetChartRows } from './budget'

const budgeted = (
  id: string,
  spentCents: number,
  budgetCents: number,
): CategorySummary => ({
  kind: 'budgeted',
  category: { id, name: id, monthlyBudgetCents: budgetCents },
  transactionCount: spentCents > 0 ? 1 : 0,
  spentCents,
  budgetCents,
  remainingCents: budgetCents - spentCents,
  isOverBudget: spentCents > budgetCents,
})

const unbudgeted = (id: string, spentCents: number): CategorySummary => ({
  kind: 'unbudgeted',
  category: { id, name: id, monthlyBudgetCents: 0 },
  transactionCount: spentCents > 0 ? 1 : 0,
  spentCents,
})

describe('budgetChartRows', () => {
  it('keeps budgeted categories and unbudgeted ones with spending, in order', () => {
    const rows = budgetChartRows([
      unbudgeted('a', 500),
      budgeted('b', 0, 1000),
      unbudgeted('c', 0),
      budgeted('d', 300, 200),
    ])
    expect(rows.map((row) => row.category.id)).toEqual(['a', 'b', 'd'])
  })
})

describe('budgetChartMax', () => {
  it('is the largest spend or budget across the rows', () => {
    expect(
      budgetChartMax([budgeted('a', 300, 200), unbudgeted('b', 150)]),
    ).toBe(300)
    expect(
      budgetChartMax([budgeted('a', 100, 900), unbudgeted('b', 150)]),
    ).toBe(900)
  })

  it('is 0 with no rows', () => {
    expect(budgetChartMax([])).toBe(0)
  })
})

describe('barPercent', () => {
  it('is the share of the largest amount, as a percentage', () => {
    expect(barPercent(50000, 200000)).toBe(25)
    expect(barPercent(200000, 200000)).toBe(100)
  })

  it('is 0 when there is nothing to scale against', () => {
    expect(barPercent(0, 0)).toBe(0)
  })
})
