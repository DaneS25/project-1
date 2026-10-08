import { describe, expectTypeOf, it } from 'vitest'
import type { Category, Transaction } from './types'

describe('Transaction', () => {
  it('allows the note to be omitted', () => {
    const transaction: Transaction = {
      id: 't1',
      amountCents: 1250,
      date: '2026-10-08',
      categoryId: 'c1',
    }
    expectTypeOf(transaction).toEqualTypeOf<Transaction>()
  })

  it('rejects an explicitly undefined note', () => {
    // @ts-expect-error exactOptionalPropertyTypes: omit the note instead
    const transaction: Transaction = {
      id: 't1',
      amountCents: 1250,
      date: '2026-10-08',
      categoryId: 'c1',
      note: undefined,
    }
    expectTypeOf(transaction.note).toEqualTypeOf<string | undefined>()
  })

  it('stores the amount as a number of cents', () => {
    expectTypeOf<Transaction['amountCents']>().toEqualTypeOf<number>()
  })
})

describe('Category', () => {
  it('has an id, name and monthly budget in cents', () => {
    expectTypeOf<Category>().toEqualTypeOf<{
      id: string
      name: string
      monthlyBudgetCents: number
    }>()
  })
})
