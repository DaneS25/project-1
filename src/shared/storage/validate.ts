import { isIsoDate } from '@/shared/lib/dates'
import type { AppData, Category, Result, Transaction } from '@/shared/types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

/** Rebuilds a transaction from untrusted input, dropping unknown fields. */
function parseTransaction(value: unknown): Transaction | null {
  if (!isRecord(value)) return null
  const { id, amountCents, date, categoryId, note } = value
  if (
    !isNonEmptyString(id) ||
    !isCents(amountCents) ||
    amountCents === 0 ||
    typeof date !== 'string' ||
    !isIsoDate(date) ||
    !isNonEmptyString(categoryId)
  ) {
    return null
  }
  if (note === undefined) return { id, amountCents, date, categoryId }
  if (typeof note !== 'string') return null
  return { id, amountCents, date, categoryId, note }
}

/** Rebuilds a category from untrusted input, dropping unknown fields. */
function parseCategory(value: unknown): Category | null {
  if (!isRecord(value)) return null
  const { id, name, monthlyBudgetCents } = value
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(name) ||
    !isCents(monthlyBudgetCents)
  ) {
    return null
  }
  return { id, name, monthlyBudgetCents }
}

function parseList<T>(
  items: unknown[],
  parse: (item: unknown) => T | null,
  label: string,
): Result<T[]> {
  const parsed: T[] = []
  for (const [index, item] of items.entries()) {
    const result = parse(item)
    if (result === null) {
      return { ok: false, error: `Invalid ${label} at index ${String(index)}` }
    }
    parsed.push(result)
  }
  return { ok: true, value: parsed }
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length
}

/**
 * Validates untrusted data (e.g. parsed from localStorage) as `AppData`.
 * Checks each record's shape, unique ids, and that every transaction
 * points at an existing category.
 */
export function parseAppData(value: unknown): Result<AppData> {
  if (
    !isRecord(value) ||
    !Array.isArray(value.transactions) ||
    !Array.isArray(value.categories)
  ) {
    return {
      ok: false,
      error: 'Data must have transactions and categories arrays',
    }
  }

  const categories = parseList(value.categories, parseCategory, 'category')
  if (!categories.ok) return categories
  const transactions = parseList(
    value.transactions,
    parseTransaction,
    'transaction',
  )
  if (!transactions.ok) return transactions

  const categoryIds = categories.value.map((category) => category.id)
  if (hasDuplicates(categoryIds)) {
    return { ok: false, error: 'Duplicate category id' }
  }
  if (hasDuplicates(transactions.value.map((transaction) => transaction.id))) {
    return { ok: false, error: 'Duplicate transaction id' }
  }

  const knownCategoryIds = new Set(categoryIds)
  const orphan = transactions.value.find(
    (transaction) => !knownCategoryIds.has(transaction.categoryId),
  )
  if (orphan) {
    return {
      ok: false,
      error: `Transaction ${orphan.id} references a missing category`,
    }
  }

  return {
    ok: true,
    value: { transactions: transactions.value, categories: categories.value },
  }
}
