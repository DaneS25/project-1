import type { Transaction } from '@/shared/types'

/** A just-deleted row kept on screen while it fades out. */
export type LeavingRow = { transaction: Transaction; index: number }

/**
 * The rows to draw: the current (sorted) transactions, with a leaving row
 * put back where it was so it can fade out in place. Ignores a leaving row
 * that is somehow still in the list.
 */
export function withLeavingRow(
  rows: readonly Transaction[],
  leaving: LeavingRow | null,
): Transaction[] {
  if (!leaving || rows.some((t) => t.id === leaving.transaction.id)) {
    return [...rows]
  }
  const index = Math.min(Math.max(leaving.index, 0), rows.length)
  return [...rows.slice(0, index), leaving.transaction, ...rows.slice(index)]
}
