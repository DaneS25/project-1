import { describe, expect, it } from 'vitest'
import type { AppData, Transaction } from '@/shared/types'
import { appDataReducer } from './appDataReducer'

const lunch: Transaction = {
  id: 't1',
  amountCents: 1250,
  date: '2026-10-08',
  categoryId: 'c1',
}

const state: AppData = {
  categories: [
    { id: 'c1', name: 'Groceries', monthlyBudgetCents: 60000 },
    { id: 'c2', name: 'Rent', monthlyBudgetCents: 0 },
  ],
  transactions: [lunch],
}

describe('appDataReducer', () => {
  it('adds a transaction', () => {
    const coffee = { ...lunch, id: 't2', amountCents: 550 }

    const next = appDataReducer(state, {
      type: 'transactionAdded',
      transaction: coffee,
    })

    expect(next.transactions).toEqual([lunch, coffee])
  })

  it('updates a transaction by id', () => {
    const edited = { ...lunch, amountCents: 900, note: 'Edited' }

    const next = appDataReducer(state, {
      type: 'transactionUpdated',
      transaction: edited,
    })

    expect(next.transactions).toEqual([edited])
  })

  it('deletes a transaction by id', () => {
    const next = appDataReducer(state, { type: 'transactionDeleted', id: 't1' })

    expect(next.transactions).toEqual([])
  })

  it('adds, updates and deletes a category', () => {
    const fuel = { id: 'c3', name: 'Fuel', monthlyBudgetCents: 20000 }
    let next = appDataReducer(state, { type: 'categoryAdded', category: fuel })
    next = appDataReducer(next, {
      type: 'categoryUpdated',
      category: { ...fuel, name: 'Petrol' },
    })
    expect(next.categories.at(-1)).toEqual({ ...fuel, name: 'Petrol' })

    next = appDataReducer(next, { type: 'categoryDeleted', id: 'c3' })
    expect(next.categories).toEqual(state.categories)
  })

  it('does not change the previous state', () => {
    const snapshot = structuredClone(state)

    appDataReducer(state, { type: 'transactionDeleted', id: 't1' })
    appDataReducer(state, {
      type: 'transactionUpdated',
      transaction: { ...lunch, amountCents: 1 },
    })
    appDataReducer(state, { type: 'categoryDeleted', id: 'c2' })

    expect(state).toEqual(snapshot)
  })

  it.each([
    [
      'a transaction with a zero amount',
      {
        type: 'transactionAdded',
        transaction: { ...lunch, id: 't2', amountCents: 0 },
      },
    ],
    [
      'a transaction in a category that does not exist',
      {
        type: 'transactionAdded',
        transaction: { ...lunch, id: 't2', categoryId: 'c9' },
      },
    ],
    [
      'a transaction with an id already in use',
      { type: 'transactionAdded', transaction: lunch },
    ],
    [
      'an update for an unknown transaction',
      { type: 'transactionUpdated', transaction: { ...lunch, id: 't9' } },
    ],
    [
      'an update with an impossible date',
      {
        type: 'transactionUpdated',
        transaction: { ...lunch, date: '2026-02-30' },
      },
    ],
    [
      'deleting an unknown transaction',
      { type: 'transactionDeleted', id: 't9' },
    ],
    [
      'deleting a category that still has transactions',
      { type: 'categoryDeleted', id: 'c1' },
    ],
    [
      'a category with a negative budget',
      {
        type: 'categoryAdded',
        category: { id: 'c3', name: 'Fuel', monthlyBudgetCents: -1 },
      },
    ],
  ] as const)('ignores %s', (_label, action) => {
    expect(appDataReducer(state, action)).toBe(state)
  })

  it('allows deleting a category with no transactions', () => {
    const next = appDataReducer(state, { type: 'categoryDeleted', id: 'c2' })

    expect(next.categories.map((c) => c.id)).toEqual(['c1'])
  })
})
