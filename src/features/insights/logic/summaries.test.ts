import { describe, expect, it } from 'vitest'
import type { CategorySummary } from '@/features/summary'
import type { Category } from '@/shared/types'
import {
  breakdownSummary,
  budgetSummary,
  categorySummary,
  trendSummary,
} from './summaries'

const category = (id: string, name: string, budget = 0): Category => ({
  id,
  name,
  monthlyBudgetCents: budget,
})
const rent = category('rent', 'Rent')
const food = category('food', 'Food')

describe('breakdownSummary', () => {
  it('names the largest category and its share', () => {
    expect(
      breakdownSummary({
        month: '2026-10',
        totalCents: 210000,
        items: [
          { category: rent, spentCents: 88200 },
          { category: food, spentCents: 121800 - 0 },
        ].sort((a, b) => b.spentCents - a.spentCents),
      }),
    ).toBe('Food was the largest category at 58% of $2,100.00.')
  })

  it('says when all spending was in one category', () => {
    expect(
      breakdownSummary({
        month: '2026-10',
        totalCents: 5000,
        items: [{ category: rent, spentCents: 5000 }],
      }),
    ).toBe('All $50.00 went on Rent.')
  })

  it('handles a month with no spending', () => {
    expect(
      breakdownSummary({ month: '2026-10', totalCents: 0, items: [] }),
    ).toBe('No spending this month.')
  })
})

describe('trendSummary', () => {
  const total = (month: string, spentCents: number) => ({
    month,
    spentCents,
    budgetCents: 0,
  })

  it('gives the selected month and the highest one', () => {
    expect(
      trendSummary([
        total('2026-08', 50000),
        total('2026-09', 0),
        total('2026-10', 20000),
      ]),
    ).toBe(
      'October 2026: $200.00. The highest month was August 2026 at $500.00.',
    )
  })

  it('says when the selected month is the highest', () => {
    expect(trendSummary([total('2026-09', 100), total('2026-10', 100)])).toBe(
      'October 2026 was the highest of these 2 months at $1.00.',
    )
  })

  it('handles months with no spending', () => {
    expect(trendSummary([total('2026-09', 0), total('2026-10', 0)])).toBe(
      'No spending in these 2 months.',
    )
  })
})

describe('budgetSummary', () => {
  const budgeted = (
    c: Category,
    spentCents: number,
    budgetCents: number,
  ): CategorySummary => ({
    kind: 'budgeted',
    category: c,
    transactionCount: 1,
    spentCents,
    budgetCents,
    remainingCents: budgetCents - spentCents,
    isOverBudget: spentCents > budgetCents,
  })
  const unbudgeted = (c: Category): CategorySummary => ({
    kind: 'unbudgeted',
    category: c,
    transactionCount: 1,
    spentCents: 100,
  })
  const fuel = category('fuel', 'Fuel')

  it('lists the categories over budget', () => {
    expect(
      budgetSummary([
        budgeted(food, 700, 600),
        budgeted(fuel, 900, 100),
        budgeted(rent, 100, 100),
      ]),
    ).toBe('2 of 3 budgeted categories are over budget: Food and Fuel.')
    expect(
      budgetSummary([budgeted(food, 700, 600), budgeted(rent, 1, 2)]),
    ).toBe('1 of 2 budgeted categories is over budget: Food.')
  })

  it('says when every budgeted category is within budget', () => {
    expect(
      budgetSummary([budgeted(food, 600, 600), budgeted(rent, 0, 100)]),
    ).toBe('All 2 budgeted categories are within budget.')
    expect(budgetSummary([budgeted(food, 1, 600), unbudgeted(rent)])).toBe(
      'Food is within budget.',
    )
  })

  it('says when no category has a budget', () => {
    expect(budgetSummary([unbudgeted(rent)])).toBe(
      'No categories have a budget set.',
    )
  })
})

describe('categorySummary', () => {
  const months = (...spent: number[]) =>
    spent.map((spentCents, i) => ({
      month: `2026-0${String(i + 4)}`,
      spentCents,
    }))

  it('gives the highest month and how often it went over budget', () => {
    expect(
      categorySummary({
        category: food,
        budgetCents: 500,
        months: months(400, 600, 900),
      }),
    ).toBe(
      'Food was highest in June 2026 at $9.00. Over its current budget in 2 of 3 months.',
    )
    expect(
      categorySummary({
        category: food,
        budgetCents: 1000,
        months: months(400, 500),
      }),
    ).toBe(
      'Food was highest in May 2026 at $5.00. Within its current budget every month.',
    )
  })

  it('leaves out the budget when none is set', () => {
    expect(
      categorySummary({
        category: rent,
        budgetCents: null,
        months: months(0, 300),
      }),
    ).toBe('Rent was highest in May 2026 at $3.00.')
  })

  it('handles a category with no spending', () => {
    expect(
      categorySummary({
        category: rent,
        budgetCents: null,
        months: months(0, 0),
      }),
    ).toBe('No spending on Rent in these 2 months.')
  })
})
