import type { CategorySummary } from './summary'

/**
 * How full a category's budget bar is, from 0 to 1: spent divided by the
 * budget, capped at 1 when over budget. Returns null for a category with no
 * budget set, which gets no bar. Spent and budget are integer cents, so the
 * only rounding is in the final division.
 */
export function budgetFill(summary: CategorySummary): number | null {
  if (summary.kind === 'unbudgeted') return null
  return Math.min(summary.spentCents / summary.budgetCents, 1)
}
