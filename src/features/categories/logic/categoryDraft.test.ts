import { describe, expect, it } from 'vitest'
import type { Category } from '@/shared/types'
import {
  parseBudgetToCents,
  sortByName,
  validateCategoryDraft,
} from './categoryDraft'

const categories: Category[] = [
  { id: 'c1', name: 'Groceries', monthlyBudgetCents: 60000 },
  { id: 'c2', name: 'Rent', monthlyBudgetCents: 0 },
]

describe('parseBudgetToCents', () => {
  it.each([
    ['400', 40000],
    ['$1,250.50', 125050],
    ['0.05', 5],
  ])('parses "%s" as %i cents', (input, cents) => {
    expect(parseBudgetToCents(input)).toEqual({ ok: true, value: cents })
  })

  it.each(['', '   ', '0', '0.00', '$0'])(
    'treats "%s" as no budget (0 cents)',
    (input) => {
      expect(parseBudgetToCents(input)).toEqual({ ok: true, value: 0 })
    },
  )

  it.each([
    ['-5', 'negative'],
    ['-0', 'negative'],
    ['abc', 'invalid'],
    ['1,2', 'badGrouping'],
    ['1.234', 'tooManyDecimals'],
    ['99999999999999999', 'tooLarge'],
  ])('rejects "%s" as %s', (input, error) => {
    expect(parseBudgetToCents(input)).toEqual({ ok: false, error })
  })
})

describe('validateCategoryDraft', () => {
  it('turns a valid draft into a category with a trimmed name', () => {
    expect(
      validateCategoryDraft({ name: '  Fuel ', budget: '80' }, categories),
    ).toEqual({ ok: true, value: { name: 'Fuel', monthlyBudgetCents: 8000 } })
  })

  it('accepts a blank budget as no budget', () => {
    expect(
      validateCategoryDraft({ name: 'Fuel', budget: '' }, categories),
    ).toEqual({ ok: true, value: { name: 'Fuel', monthlyBudgetCents: 0 } })
  })

  it('requires a name', () => {
    expect(
      validateCategoryDraft({ name: '   ', budget: '10' }, categories),
    ).toEqual({ ok: false, error: { name: 'Enter a name.' } })
  })

  it('rejects a name another category has, ignoring case', () => {
    expect(
      validateCategoryDraft({ name: 'rent', budget: '' }, categories),
    ).toEqual({
      ok: false,
      error: { name: 'Another category already has this name.' },
    })
  })

  it('lets a category keep its own name', () => {
    expect(
      validateCategoryDraft(
        { name: 'GROCERIES', budget: '1' },
        categories,
        'c1',
      ),
    ).toMatchObject({ ok: true, value: { name: 'GROCERIES' } })
  })

  it('reports a bad budget', () => {
    expect(
      validateCategoryDraft({ name: 'Fuel', budget: '-10' }, categories),
    ).toEqual({
      ok: false,
      error: { budget: 'The budget can’t be negative.' },
    })
  })

  it('reports every invalid field in form order', () => {
    const result = validateCategoryDraft({ name: '', budget: 'x' }, categories)
    expect(result.ok ? [] : Object.keys(result.error)).toEqual([
      'name',
      'budget',
    ])
  })
})

describe('sortByName', () => {
  it('sorts by name ignoring case, without changing the input', () => {
    const input: Category[] = [
      { id: 'a', name: 'rent', monthlyBudgetCents: 0 },
      { id: 'b', name: 'Eating out', monthlyBudgetCents: 0 },
      { id: 'c', name: 'groceries', monthlyBudgetCents: 0 },
    ]

    expect(sortByName(input).map((c) => c.id)).toEqual(['b', 'c', 'a'])
    expect(input.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })
})
