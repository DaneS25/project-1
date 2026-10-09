import { describe, expect, it } from 'vitest'
import type { Category } from '@/shared/types'
import { categoryNameKey, isCategoryNameTaken } from './categories'

const categories: Category[] = [
  { id: 'c1', name: 'Groceries', monthlyBudgetCents: 0 },
  { id: 'c2', name: 'Eating out', monthlyBudgetCents: 0 },
]

describe('categoryNameKey', () => {
  it('ignores case and surrounding spaces', () => {
    expect(categoryNameKey('  GROCERIES ')).toBe(categoryNameKey('groceries'))
  })
})

describe('isCategoryNameTaken', () => {
  it('finds a name used by another category, ignoring case and spaces', () => {
    expect(isCategoryNameTaken(categories, ' eating OUT ')).toBe(true)
  })

  it('allows a new name', () => {
    expect(isCategoryNameTaken(categories, 'Rent')).toBe(false)
  })

  it('ignores the category being renamed', () => {
    expect(isCategoryNameTaken(categories, 'groceries', 'c1')).toBe(false)
  })
})
