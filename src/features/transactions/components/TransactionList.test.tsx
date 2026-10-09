import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION } from '@/shared/storage/migrations'
import { STORAGE_KEY } from '@/shared/storage/storage'
import { AppDataProvider } from '@/shared/store/AppDataProvider'
import { createTestIds, createTestStorage } from '@/shared/store/testStorage'
import type { Transaction } from '@/shared/types'
import { TransactionList } from './TransactionList'

const categories = [
  { id: 'groceries', name: 'Groceries', monthlyBudgetCents: 0 },
  { id: 'rent', name: 'Rent', monthlyBudgetCents: 0 },
]

function renderList(transactions: Transaction[]) {
  const { storage } = createTestStorage({
    [STORAGE_KEY]: JSON.stringify({
      version: CURRENT_VERSION,
      data: { transactions, categories },
    }),
  })
  return render(
    <AppDataProvider storage={storage} createId={createTestIds()}>
      <TransactionList />
    </AppDataProvider>,
  )
}

const items = () => screen.getAllByRole('listitem')

describe('TransactionList', () => {
  it('shows an empty state when there are no transactions', () => {
    renderList([])

    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows the category, note, date and amount of a transaction', () => {
    renderList([
      {
        id: 't1',
        amountCents: 1250,
        date: '2026-10-09',
        categoryId: 'groceries',
        note: 'Weekly shop',
      },
    ])

    const item = within(screen.getByRole('listitem'))
    expect(item.getByText('Groceries')).toBeInTheDocument()
    expect(item.getByText('Weekly shop')).toBeInTheDocument()
    expect(item.getByText(/9 Oct 2026/)).toHaveAttribute(
      'datetime',
      '2026-10-09',
    )
    expect(item.getByText('$12.50')).toBeInTheDocument()
  })

  it('lists transactions newest first', () => {
    renderList([
      { id: 't1', amountCents: 100, date: '2026-10-01', categoryId: 'rent' },
      { id: 't2', amountCents: 200, date: '2026-10-09', categoryId: 'rent' },
      { id: 't3', amountCents: 300, date: '2026-10-05', categoryId: 'rent' },
    ])

    expect(items().map((item) => item.textContent)).toEqual([
      expect.stringContaining('$2.00'),
      expect.stringContaining('$3.00'),
      expect.stringContaining('$1.00'),
    ])
  })

  it('shows the most recently added first among same-day transactions', () => {
    renderList([
      { id: 't1', amountCents: 100, date: '2026-10-09', categoryId: 'rent' },
      { id: 't2', amountCents: 200, date: '2026-10-09', categoryId: 'rent' },
    ])

    expect(items()[0]).toHaveTextContent('$2.00')
  })
})
