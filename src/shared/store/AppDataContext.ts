import { createContext, useContext } from 'react'
import type { AppData, Category, Id, Transaction } from '@/shared/types'

/** Why saved data may not match what's on screen. */
export type StorageNotice =
  'corruptBackedUp' | 'corruptNotBackedUp' | 'unavailable' | 'saveFailed'

export type AppDataContextValue = {
  data: AppData
  notice: StorageNotice | null
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  updateTransaction: (transaction: Transaction) => void
  deleteTransaction: (id: Id) => void
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (category: Category) => void
  deleteCategory: (id: Id) => void
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
