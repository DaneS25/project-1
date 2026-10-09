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
