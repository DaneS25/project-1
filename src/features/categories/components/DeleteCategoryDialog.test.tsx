import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION } from '@/shared/storage/migrations'
import { STORAGE_KEY } from '@/shared/storage/storage'
import { AppDataProvider } from '@/shared/store/AppDataProvider'
import { createTestIds, createTestStorage } from '@/shared/store/testStorage'
import type { Category, Transaction } from '@/shared/types'
import { CategoryList } from './CategoryList'

// Listed by name: Eating out, Fuel, Groceries.
const eatingOut: Category = {
  id: 'c1',
  name: 'Eating out',
  monthlyBudgetCents: 0,
}
const fuel: Category = { id: 'c2', name: 'Fuel', monthlyBudgetCents: 8000 }
const groceries: Category = {
  id: 'c3',
  name: 'Groceries',
  monthlyBudgetCents: 60000,
}
const shop: Transaction = {
  id: 't1',
  amountCents: 1250,
  date: '2026-10-09',
  categoryId: 'c3',
}
const shop2: Transaction = { ...shop, id: 't2' }

function renderList(
  categories: Category[] = [groceries, fuel, eatingOut],
  transactions: Transaction[] = [shop, shop2],
) {
  const testStorage = createTestStorage({
    [STORAGE_KEY]: JSON.stringify({
      version: CURRENT_VERSION,
      data: { transactions, categories },
    }),
  })
  render(
    <AppDataProvider storage={testStorage.storage} createId={createTestIds()}>
      <CategoryList />
    </AppDataProvider>,
  )
  return testStorage
}

function storedData(items: Map<string, string>): unknown {
  return JSON.parse(items.get(STORAGE_KEY) ?? 'null')
}

const deleteButton = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`^Delete ${name},`) })
const confirmDialog = () =>
  screen.getByRole('alertdialog', { name: 'Delete this category?' })
const confirm = () =>
  userEvent.click(
    within(confirmDialog()).getByRole('button', { name: 'Delete' }),
  )

describe('deleting a category', () => {
  it('shows how many transactions use each category', () => {
    renderList()

    expect(screen.getAllByRole('listitem').map((i) => i.textContent)).toEqual([
      expect.stringContaining('No transactions'),
      expect.stringContaining('No transactions'),
      expect.stringContaining('2 transactions'),
    ])
  })

  it('blocks deleting a category that has transactions and explains why', async () => {
    const { writes } = renderList()

    await userEvent.click(deleteButton('Groceries'))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      "Groceries can't be deleted because 2 transactions use it. Move those transactions to another category or delete them first.",
    )
    expect(deleteButton('Groceries')).toHaveFocus()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(writes).toEqual([])
  })

  it('uses the singular when one transaction blocks the delete', async () => {
    renderList(undefined, [shop])

    await userEvent.click(deleteButton('Groceries'))

    expect(screen.getByRole('status')).toHaveTextContent(
      "Groceries can't be deleted because 1 transaction uses it.",
    )
  })

  it('asks for confirmation, naming the category, with focus on Cancel', async () => {
    renderList()

    await userEvent.click(deleteButton('Fuel'))

    expect(confirmDialog()).toHaveAccessibleDescription(
      "Fuel will be deleted. This can't be undone.",
    )
    expect(
      within(confirmDialog()).getByRole('button', { name: 'Cancel' }),
    ).toHaveFocus()
  })

  it('keeps the category on Cancel and returns focus to its Delete button', async () => {
    const { writes } = renderList()
    await userEvent.click(deleteButton('Fuel'))

    await userEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Cancel' }),
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(deleteButton('Fuel')).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('keeps the category when Escape is pressed', async () => {
    const { writes } = renderList()
    await userEvent.click(deleteButton('Fuel'))

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(deleteButton('Fuel')).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('deletes on confirm, updates storage and announces it', async () => {
    const { items } = renderList()
    await userEvent.click(deleteButton('Fuel'))

    await confirm()

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Deleted Fuel.')
    expect(screen.queryByText('Fuel')).not.toBeInTheDocument()
    expect(storedData(items)).toMatchObject({
      data: { categories: [groceries, eatingOut] },
    })
  })

  it('moves focus to the next row’s Edit button after deleting', async () => {
    renderList()
    await userEvent.click(deleteButton('Fuel'))

    await confirm()

    expect(
      screen.getByRole('button', { name: /^Edit Groceries,/ }),
    ).toHaveFocus()
  })

  it('moves focus to the previous row’s Edit button after deleting the last row', async () => {
    renderList([
      groceries,
      fuel,
      eatingOut,
      { ...fuel, id: 'c4', name: 'Rent' },
    ])
    await userEvent.click(deleteButton('Rent'))

    await confirm()

    expect(
      screen.getByRole('button', { name: /^Edit Groceries,/ }),
    ).toHaveFocus()
  })

  it('shows the empty state and focuses the list after deleting the only category', async () => {
    renderList([fuel], [])
    await userEvent.click(deleteButton('Fuel'))

    await confirm()

    expect(screen.getByText('No categories yet')).toBeInTheDocument()
    expect(document.activeElement).toContainElement(screen.getByRole('status'))
  })
})
