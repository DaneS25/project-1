import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/shared/types'
import { sortNewestFirst } from './sortTransactions'

function transaction(id: string, date: string): Transaction {
  return { id, amountCents: 100, date, categoryId: 'cat-1' }
}

const ids = (transactions: Transaction[]) => transactions.map((t) => t.id)

describe('sortNewestFirst', () => {
  it('puts the newest date first', () => {
    const sorted = sortNewestFirst([
      transaction('a', '2026-10-01'),
      transaction('b', '2026-10-09'),
      transaction('c', '2026-10-05'),
    ])

    expect(ids(sorted)).toEqual(['b', 'c', 'a'])
  })

  it('orders across month and year boundaries', () => {
    const sorted = sortNewestFirst([
      transaction('dec', '2025-12-31'),
      transaction('jan', '2026-01-01'),
      transaction('nov', '2025-11-30'),
    ])

    expect(ids(sorted)).toEqual(['jan', 'dec', 'nov'])
  })

  it('shows the most recently added first when dates are the same', () => {
    const sorted = sortNewestFirst([
      transaction('first', '2026-10-09'),
      transaction('older', '2026-10-08'),
      transaction('second', '2026-10-09'),
      transaction('third', '2026-10-09'),
    ])

    expect(ids(sorted)).toEqual(['third', 'second', 'first', 'older'])
  })

  it('does not change the array it is given', () => {
    const transactions = [
      transaction('a', '2026-10-01'),
      transaction('b', '2026-10-09'),
    ]

    sortNewestFirst(transactions)

    expect(ids(transactions)).toEqual(['a', 'b'])
  })

  it('returns an empty list for no transactions', () => {
    expect(sortNewestFirst([])).toEqual([])
  })
})
