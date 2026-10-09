import { createContext, useContext } from 'react'
import type { AppData, Category, Id, Transaction } from '@/shared/types'

/** Why saved data may not match what's on screen. */
export type StorageNotice =
  'corruptBackedUp' | 'corruptNotBackedUp' | 'unavailable' | 'saveFailed'

export type AppDataContextValue = {
  data: AppData
  notice: StorageNotice | null
  /** Returns false if the transaction was invalid and nothing was added. */
  addTransaction: (transaction: Omit<Transaction, 'id'>) => boolean
  /** Returns false if the change was invalid (or the id unknown) and nothing changed. */
  updateTransaction: (transaction: Transaction) => boolean
  /** Returns false if no transaction has that id and nothing was removed. */
  deleteTransaction: (id: Id) => boolean
  /** Returns false if the category was invalid (e.g. a used name). */
  addCategory: (category: Omit<Category, 'id'>) => boolean
  /** Returns false if the change was invalid or the id unknown. */
  updateCategory: (category: Category) => boolean
  /**
   * Returns false if nothing was removed: the id is unknown, or the
   * category still has transactions.
   */
  deleteCategory: (id: Id) => boolean
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)

/** The app's data and the actions that change it. */
export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext)
  if (!value) {
    throw new Error('useAppData must be used inside <AppDataProvider>')
  }
  return value
}
