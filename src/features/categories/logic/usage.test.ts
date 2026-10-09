import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/shared/types'
import { countTransactionsByCategory, transactionCountLabel } from './usage'

function transaction(id: string, categoryId: string): Transaction {
  return { id, amountCents: 100, date: '2026-10-09', categoryId }
}

describe('countTransactionsByCategory', () => {
  it('counts transactions per category', () => {
    const counts = countTransactionsByCategory([
      transaction('t1', 'c1'),
      transaction('t2', 'c2'),
      transaction('t3', 'c1'),
    ])

    expect(counts.get('c1')).toBe(2)
    expect(counts.get('c2')).toBe(1)
    expect(counts.has('c3')).toBe(false)
  })

  it('returns an empty map for no transactions', () => {
    expect(countTransactionsByCategory([]).size).toBe(0)
  })
})

describe('transactionCountLabel', () => {
  it.each([
    [0, 'No transactions'],
    [1, '1 transaction'],
    [3, '3 transactions'],
  ])('labels %i as "%s"', (count, label) => {
    expect(transactionCountLabel(count)).toBe(label)
  })
})
