import { useRef, useState, type ReactNode } from 'react'
import { createId as defaultCreateId } from '@/shared/lib/id'
import type { StorageLike } from '@/shared/storage/storage'
import type { Id } from '@/shared/types'
import { AppDataContext, type AppDataContextValue } from './AppDataContext'
import { appDataReducer, type AppDataAction } from './logic/appDataReducer'
import { createStoreState, getNotice, persist } from './persist'
import { loadStartup } from './startup'

type AppDataProviderProps = {
  children: ReactNode
  /** Defaults to `window.localStorage`. */
  storage?: StorageLike
  createId?: () => Id
}

/**
 * Loads app data on startup and holds it in one store. Each change is saved
 * in the event that caused it; the data as loaded is never written back, so
 * just opening the app doesn't touch storage.
 */
export function AppDataProvider({
  children,
  storage,
  createId = defaultCreateId,
}: AppDataProviderProps) {
  const [store, setStore] = useState(() =>
    createStoreState(loadStartup(storage, createId)),
  )
  // Latest state for handlers, so two actions in one event don't see stale
  // data. Only written in handlers, never during render.
  const latest = useRef(store)

  /** Returns false if the reducer rejected the action as invalid. */
  function apply(action: AppDataAction): boolean {
    const current = latest.current
    const data = appDataReducer(current.data, action)
    if (data === current.data) return false
    const next = persist(current, data, storage)
    latest.current = next
    setStore(next)
    return true
  }

  const value: AppDataContextValue = {
    data: store.data,
    notice: getNotice(store),
    addTransaction: (transaction) =>
      apply({
        type: 'transactionAdded',
        transaction: { ...transaction, id: createId() },
      }),
    updateTransaction: (transaction) =>
      apply({ type: 'transactionUpdated', transaction }),
    deleteTransaction: (id) => apply({ type: 'transactionDeleted', id }),
    addCategory: (category) =>
      apply({
        type: 'categoryAdded',
        category: { ...category, id: createId() },
      }),
    updateCategory: (category) => apply({ type: 'categoryUpdated', category }),
    deleteCategory: (id) => apply({ type: 'categoryDeleted', id }),
  }

  return <AppDataContext value={value}>{children}</AppDataContext>
}
