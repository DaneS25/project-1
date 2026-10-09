import type { Id, Transaction } from '@/shared/types'

/** How many transactions use each category id. Unused ids are absent. */
export function countTransactionsByCategory(
  transactions: readonly Transaction[],
): Map<Id, number> {
  const counts = new Map<Id, number>()
  for (const { categoryId } of transactions) {
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1)
  }
  return counts
}

/** "No transactions", "1 transaction" or "3 transactions". */
export function transactionCountLabel(count: number): string {
  if (count === 0) return 'No transactions'
  return count === 1 ? '1 transaction' : `${String(count)} transactions`
}
