import { describe, expect, it } from 'vitest'
import type { Category } from '@/shared/types'
import { budgetFill } from './progress'
import type { CategorySummary } from './summary'

const category: Category = {
  id: 'c1',
  name: 'Groceries',
  monthlyBudgetCents: 60000,
}

function budgeted(spentCents: number, budgetCents = 60000): CategorySummary {
  return {
    kind: 'budgeted',
    category,
    transactionCount: 1,
    spentCents,
    budgetCents,
    remainingCents: budgetCents - spentCents,
    isOverBudget: spentCents > budgetCents,
  }
}

describe('budgetFill', () => {
  it.each([
    [0, 0],
    [15000, 0.25],
    [30000, 0.5],
    [59999, 59999 / 60000],
    [60000, 1],
  ])('fills %i of 60000 cents to %f', (spent, fill) => {
    expect(budgetFill(budgeted(spent))).toBe(fill)
  })

  it.each([60001, 120000, Number.MAX_SAFE_INTEGER])(
    'caps the bar at full when %i cents is over budget',
    (spent) => {
      expect(budgetFill(budgeted(spent))).toBe(1)
    },
  )

  it('handles a one-cent budget', () => {
    expect(budgetFill(budgeted(1, 1))).toBe(1)
  })

  it('gives no bar to a category with no budget set', () => {
    expect(
      budgetFill({
        kind: 'unbudgeted',
        category: { ...category, monthlyBudgetCents: 0 },
        transactionCount: 2,
        spentCents: 5000,
      }),
    ).toBeNull()
  })
})
