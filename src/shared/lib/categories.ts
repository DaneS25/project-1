import type { Category, Id } from '@/shared/types'

/**
 * The form of a category name used to compare names: trimmed and
 * case-insensitive, so "Groceries" and " groceries " count as the same.
 */
export function categoryNameKey(name: string): string {
  return name.trim().toLocaleLowerCase('en-NZ')
}

/** True if another category (not `exceptId`) already uses this name. */
export function isCategoryNameTaken(
  categories: readonly Category[],
  name: string,
  exceptId?: Id,
): boolean {
  const key = categoryNameKey(name)
  return categories.some(
    (category) =>
      category.id !== exceptId && categoryNameKey(category.name) === key,
  )
}

/** Orders two categories by name, ignoring case and accents. */
export function compareCategoryNames(a: Category, b: Category): number {
  return a.name.localeCompare(b.name, 'en-NZ', { sensitivity: 'base' })
}

/** Returns a new array sorted by name, ignoring case and accents. */
export function sortCategoriesByName(
  categories: readonly Category[],
): Category[] {
  return [...categories].sort(compareCategoryNames)
}
