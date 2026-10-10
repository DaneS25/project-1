import { sortCategoriesByName } from '@/shared/lib/categories'
import type { AppData, Id, MonthKey } from '@/shared/types'
import { spendingByCategory } from './insights'

/**
 * The category the "category over time" chart opens on: the one with the
 * most spending in `month` (ties by name), or the first by name if nothing
 * was spent. Null when there are no categories.
 */
export function defaultCategoryId(data: AppData, month: MonthKey): Id | null {
  const breakdown = spendingByCategory(data, month)
  const largest = breakdown.ok ? breakdown.value.items[0] : undefined
  if (largest) return largest.category.id
  return sortCategoriesByName(data.categories)[0]?.id ?? null
}
