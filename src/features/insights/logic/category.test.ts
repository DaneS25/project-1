import { describe, expect, it } from 'vitest'
import type { Category, Transaction } from '@/shared/types'
import { defaultCategoryId } from './category'

const category = (id: string, name: string): Category => ({
  id,
  name,
  monthlyBudgetCents: 0,
})
const spend = (
  id: string,
  categoryId: string,
  amountCents: number,
  date = '2026-10-05',
): Transaction => ({ id, categoryId, amountCents, date })

const categories = [
  category('rent', 'Rent'),
  category('gifts', 'gifts'),
  category('fuel', 'Fuel'),
]

describe('defaultCategoryId', () => {
  it('picks the category with the most spending in the month', () => {
    const transactions = [
      spend('a', 'fuel', 5000),
      spend('b', 'gifts', 9000),
      // Other months don't count.
      spend('c', 'rent', 999999, '2026-09-01'),
    ]
    expect(defaultCategoryId({ categories, transactions }, '2026-10')).toBe(
      'gifts',
    )
  })

  it('falls back to the first by name when nothing was spent', () => {
    expect(defaultCategoryId({ categories, transactions: [] }, '2026-10')).toBe(
      'fuel',
    )
  })

  it('is null with no categories', () => {
    expect(
      defaultCategoryId({ categories: [], transactions: [] }, '2026-10'),
    ).toBeNull()
  })
})
