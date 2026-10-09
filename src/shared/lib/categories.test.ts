import { describe, expect, it } from 'vitest'
import type { Category } from '@/shared/types'
import {
  categoryNameKey,
  isCategoryNameTaken,
  sortCategoriesByName,
} from './categories'

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

describe('sortCategoriesByName', () => {
  it('sorts by name ignoring case, without changing the input', () => {
    const input: Category[] = [
      { id: 'a', name: 'rent', monthlyBudgetCents: 0 },
      { id: 'b', name: 'Eating out', monthlyBudgetCents: 0 },
      { id: 'c', name: 'groceries', monthlyBudgetCents: 0 },
    ]

    expect(sortCategoriesByName(input).map((c) => c.id)).toEqual([
      'b',
      'c',
      'a',
    ])
    expect(input.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })
})
