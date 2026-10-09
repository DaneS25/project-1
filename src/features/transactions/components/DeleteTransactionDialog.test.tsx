import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Listed newest first: shop, rent, bus.
const shop: Transaction = {
  id: 't1',
  amountCents: 1250,
  date: '2026-10-09',
  categoryId: 'groceries',
  note: 'Weekly shop',
}
const rent: Transaction = {
  id: 't2',
  amountCents: 50000,
  date: '2026-10-05',
  categoryId: 'rent',
}
const bus: Transaction = {
  id: 't3',
  amountCents: 400,
  date: '2026-10-01',
  categoryId: 'groceries',
}

function renderList(transactions: Transaction[] = [shop, rent, bus]) {
  const testStorage = createTestStorage({
    [STORAGE_KEY]: JSON.stringify({
      version: CURRENT_VERSION,
      data: { transactions, categories },
    }),
  })
  render(
    <AppDataProvider storage={testStorage.storage} createId={createTestIds()}>
      <TransactionList />
    </AppDataProvider>,
  )
  return testStorage
}

function storedData(items: Map<string, string>): unknown {
  return JSON.parse(items.get(STORAGE_KEY) ?? 'null')
}

const deleteButton = (name: RegExp) =>
  screen.getByRole('button', { name: new RegExp(`^Delete ${name.source}`) })
const confirmDialog = () =>
  screen.getByRole('alertdialog', { name: 'Delete this transaction?' })
const confirm = () =>
  userEvent.click(
    within(confirmDialog()).getByRole('button', { name: 'Delete' }),
  )

describe('deleting a transaction', () => {
  it('names each Delete button after its transaction', () => {
    renderList()

    expect(
      screen.getByRole('button', {
        name: 'Delete Groceries, $12.50, Fri, 9 Oct 2026',
      }),
    ).toBeInTheDocument()
  })

  it('asks for confirmation, naming the transaction, with focus on Cancel', async () => {
    renderList()

    await userEvent.click(deleteButton(/Groceries, \$12\.50/))

    expect(confirmDialog()).toHaveAccessibleDescription(
      "Groceries, $12.50 on Fri, 9 Oct 2026 will be deleted. This can't be undone.",
    )
    expect(
      within(confirmDialog()).getByRole('button', { name: 'Cancel' }),
    ).toHaveFocus()
  })

  it('keeps the transaction on Cancel and returns focus to its Delete button', async () => {
    const { writes } = renderList()
    await userEvent.click(deleteButton(/Rent/))

    await userEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Cancel' }),
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(deleteButton(/Rent/)).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('keeps the transaction when Escape is pressed', async () => {
    const { writes } = renderList()
    await userEvent.click(deleteButton(/Rent/))

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(deleteButton(/Rent/)).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('deletes on confirm, updates storage and announces it', async () => {
    const { items } = renderList()
    await userEvent.click(deleteButton(/Groceries, \$12\.50/))

    await confirm()

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Deleted $12.50 from Groceries.',
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByText('Weekly shop')).not.toBeInTheDocument()
    expect(storedData(items)).toMatchObject({
      data: { transactions: [rent, bus] },
    })
  })

  it('moves focus to the next row’s Edit button after deleting', async () => {
    renderList()
    await userEvent.click(deleteButton(/Rent/))

    await confirm()

    expect(
      screen.getByRole('button', { name: /^Edit Groceries, \$4\.00/ }),
    ).toHaveFocus()
  })

  it('moves focus to the previous row’s Edit button after deleting the last row', async () => {
    renderList()
    await userEvent.click(deleteButton(/Groceries, \$4\.00/))

    await confirm()

    expect(screen.getByRole('button', { name: /^Edit Rent/ })).toHaveFocus()
  })

  it('shows the empty state and focuses the list after deleting the only transaction', async () => {
    renderList([shop])
    await userEvent.click(deleteButton(/Groceries/))

    await confirm()

    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Deleted $12.50 from Groceries.',
    )
    expect(document.activeElement).toContainElement(screen.getByRole('status'))
  })
})
