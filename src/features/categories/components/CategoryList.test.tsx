import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION } from '@/shared/storage/migrations'
import { STORAGE_KEY } from '@/shared/storage/storage'
import { AppDataProvider } from '@/shared/store/AppDataProvider'
import { createTestIds, createTestStorage } from '@/shared/store/testStorage'
import type { Category } from '@/shared/types'
import { CategoryList } from './CategoryList'

const groceries: Category = {
  id: 'c1',
  name: 'Groceries',
  monthlyBudgetCents: 60000,
}
const rent: Category = { id: 'c2', name: 'Rent', monthlyBudgetCents: 0 }
const eatingOut: Category = {
  id: 'c3',
  name: 'eating out',
  monthlyBudgetCents: 15000,
}

function renderList(categories: Category[] = [rent, groceries, eatingOut]) {
  const testStorage = createTestStorage({
    [STORAGE_KEY]: JSON.stringify({
      version: CURRENT_VERSION,
      data: { transactions: [], categories },
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

const rows = () =>
  screen.getAllByRole('listitem').map((item) => item.textContent)
const dialog = () => screen.getByRole('dialog', { name: 'Edit category' })
const inDialog = () => within(dialog())
const save = () =>
  userEvent.click(inDialog().getByRole('button', { name: 'Save changes' }))
const editGroceries = () =>
  userEvent.click(
    screen.getByRole('button', { name: 'Edit Groceries, $600.00' }),
  )

describe('CategoryList', () => {
  it('lists categories by name with their budgets', () => {
    renderList()

    expect(rows()).toEqual([
      expect.stringMatching(/^eating out\$150\.00/),
      expect.stringMatching(/^Groceries\$600\.00/),
      expect.stringMatching(/^RentNo budget set/),
    ])
  })

  it('shows an empty state when there are no categories', () => {
    renderList([])

    expect(screen.getByText('No categories yet')).toBeInTheDocument()
  })

  it('opens a dialog filled in with the category, with focus on the name', async () => {
    renderList()

    await editGroceries()

    expect(inDialog().getByLabelText('Name')).toHaveValue('Groceries')
    expect(inDialog().getByLabelText('Monthly budget')).toHaveValue('600.00')
    expect(inDialog().getByLabelText('Name')).toHaveFocus()
  })

  it('shows no budget as a blank field', async () => {
    renderList()

    await userEvent.click(screen.getByRole('button', { name: /^Edit Rent/ }))

    expect(inDialog().getByLabelText('Monthly budget')).toHaveValue('')
  })

  it('renames a category, re-sorts the list, saves and announces it', async () => {
    const { items } = renderList()
    await editGroceries()

    const name = inDialog().getByLabelText('Name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Supermarket')
    await save()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(rows()[2]).toMatch(/^Supermarket/)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Saved Supermarket with a budget of $600.00.',
    )
    expect(storedData(items)).toMatchObject({
      data: {
        categories: [
          rent,
          { id: 'c1', name: 'Supermarket', monthlyBudgetCents: 60000 },
          eatingOut,
        ],
      },
    })
  })

  it('returns focus to the Edit button of the moved row after a rename', async () => {
    renderList()
    await editGroceries()

    const name = inDialog().getByLabelText('Name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Supermarket')
    await save()

    expect(
      screen.getByRole('button', { name: 'Edit Supermarket, $600.00' }),
    ).toHaveFocus()
  })

  it('changes the budget, including clearing it to no budget', async () => {
    const { items } = renderList()
    await editGroceries()

    await userEvent.clear(inDialog().getByLabelText('Monthly budget'))
    await save()

    expect(rows()[1]).toMatch(/^GroceriesNo budget set/)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Saved Groceries with no budget set.',
    )
    expect(storedData(items)).toMatchObject({
      data: {
        categories: [rent, { id: 'c1', monthlyBudgetCents: 0 }, eatingOut],
      },
    })
  })

  it('rejects renaming to another category’s name and keeps the dialog open', async () => {
    const { writes } = renderList()
    await editGroceries()

    const name = inDialog().getByLabelText('Name')
    await userEvent.clear(name)
    await userEvent.type(name, 'RENT')
    await save()

    expect(name).toHaveAccessibleDescription(
      'Another category already has this name.',
    )
    expect(writes).toEqual([])
  })

  it('discards changes on Cancel and returns focus to the Edit button', async () => {
    const { writes } = renderList()
    await editGroceries()

    await userEvent.type(inDialog().getByLabelText('Name'), 'x')
    await userEvent.click(inDialog().getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(rows()[1]).toMatch(/^Groceries\$600\.00/)
    expect(
      screen.getByRole('button', { name: 'Edit Groceries, $600.00' }),
    ).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('discards changes on Escape', async () => {
    const { writes } = renderList()
    await editGroceries()

    await userEvent.type(inDialog().getByLabelText('Name'), 'x')
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(writes).toEqual([])
  })
})
