import type { Transaction } from '@/shared/types'

/**
 * Returns a new array, newest date first. Transactions on the same day keep
 * a stable order: the most recently added comes first. The store appends
 * new transactions, so a later position means added later.
 */
export function sortNewestFirst(
  transactions: readonly Transaction[],
): Transaction[] {
  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => {
      if (a.transaction.date !== b.transaction.date) {
        // YYYY-MM-DD strings sort correctly as text
        return a.transaction.date < b.transaction.date ? 1 : -1
      }
      return b.index - a.index
    })
    .map(({ transaction }) => transaction)
}
