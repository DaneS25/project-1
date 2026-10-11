import type { AppData, Id } from '@/shared/types'

export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', emoji: '🛒' },
  { name: 'Rent', emoji: '🏠' },
  { name: 'Transport', emoji: '🚌' },
  { name: 'Eating out', emoji: '🍜' },
  { name: 'Utilities', emoji: '💡' },
  { name: 'Other', emoji: '✨' },
] as const

export const DEFAULT_CATEGORY_NAMES = DEFAULT_CATEGORIES.map((c) => c.name)

/**
 * Starting data for a new user: the default categories with their emojis,
 * no budget set (the user sets their own amounts) and no transactions.
 */
export function createDefaultData(createId: () => Id): AppData {
  return {
    categories: DEFAULT_CATEGORIES.map(({ name, emoji }) => ({
      id: createId(),
      name,
      emoji,
      monthlyBudgetCents: 0,
    })),
    transactions: [],
  }
}
