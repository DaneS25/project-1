import { parseAppData } from '@/shared/storage/validate'
import { isCategoryNameTaken } from '@/shared/lib/categories'
import type { AppData, Category, Id, Transaction } from '@/shared/types'

export type AppDataAction =
  | { type: 'transactionAdded'; transaction: Transaction }
  | { type: 'transactionUpdated'; transaction: Transaction }
  | { type: 'transactionDeleted'; id: Id }
  | { type: 'categoryAdded'; category: Category }
  | { type: 'categoryUpdated'; category: Category }
  | { type: 'categoryDeleted'; id: Id }

/**
 * Applies an action to the app data. Forms validate first; as a backstop,
 * any action that would produce invalid data (bad amount or date, duplicate
 * id, a transaction left pointing at a deleted category, an update for an
 * unknown id, a category name that isn't trimmed or is already used) is
 * ignored and the current state is returned unchanged.
 */
export function appDataReducer(state: AppData, action: AppDataAction): AppData {
  if (
    (action.type === 'categoryAdded' || action.type === 'categoryUpdated') &&
    !isValidCategoryName(state, action.category)
  ) {
    return state
  }
  const next = applyAction(state, action)
  if (next === state) return state
  return parseAppData(next).ok ? next : state
}

/**
 * Checked only when a category is added or renamed, not on load, so data
 * saved before names were unique still loads.
 */
function isValidCategoryName(state: AppData, category: Category): boolean {
  return (
    category.name === category.name.trim() &&
    !isCategoryNameTaken(state.categories, category.name, category.id)
  )
}

function applyAction(state: AppData, action: AppDataAction): AppData {
  switch (action.type) {
    case 'transactionAdded':
      return {
        ...state,
        transactions: [...state.transactions, action.transaction],
      }
    case 'transactionUpdated': {
      const { transaction } = action
      if (!state.transactions.some((t) => t.id === transaction.id)) return state
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === transaction.id ? transaction : t,
        ),
      }
    }
    case 'transactionDeleted':
      if (!state.transactions.some((t) => t.id === action.id)) return state
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.id),
      }
    case 'categoryAdded':
      return { ...state, categories: [...state.categories, action.category] }
    case 'categoryUpdated': {
      const { category } = action
      if (!state.categories.some((c) => c.id === category.id)) return state
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === category.id ? category : c,
        ),
      }
    }
    case 'categoryDeleted':
      if (!state.categories.some((c) => c.id === action.id)) return state
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
      }
    default: {
      const unhandled: never = action
      return unhandled
    }
  }
}
