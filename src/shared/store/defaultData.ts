import type { AppData, Id } from '@/shared/types'

export const DEFAULT_CATEGORY_NAMES = [
  'Groceries',
  'Rent',
  'Transport',
  'Eating out',
  'Utilities',
  'Other',
] as const

/**
 * Starting data for a new user: the default categories with no budget set
 * (the user sets their own amounts) and no transactions.
 */
export function createDefaultData(createId: () => Id): AppData {
  return {
    categories: DEFAULT_CATEGORY_NAMES.map((name) => ({
      id: createId(),
      name,
      monthlyBudgetCents: 0,
    })),
    transactions: [],
  }
}
