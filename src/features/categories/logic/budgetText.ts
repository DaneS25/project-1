import { formatCents } from '@/shared/lib/money'
import type { Cents } from '@/shared/types'

/** Short label for a budget: "$400.00", or "No budget set" for zero. */
export function budgetLabel(monthlyBudgetCents: Cents): string {
  return monthlyBudgetCents === 0
    ? 'No budget set'
    : formatCents(monthlyBudgetCents)
}

/**
 * Budget wording for a sentence: "a budget of $400.00" or "no budget set",
 * as in "Added Fuel with a budget of $80.00."
 */
export function describeBudget(monthlyBudgetCents: Cents): string {
  return monthlyBudgetCents === 0
    ? 'no budget set'
    : `a budget of ${formatCents(monthlyBudgetCents)}`
}
