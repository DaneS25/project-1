import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { STORAGE_KEY, type StorageLike } from '@/shared/storage/storage'
import { AppDataProvider } from '@/shared/store/AppDataProvider'
import { createTestIds, createTestStorage } from '@/shared/store/testStorage'
import { CategoryForm } from './CategoryForm'

function renderForm(storage: StorageLike = createTestStorage().storage) {
  return render(
    <AppDataProvider storage={storage} createId={createTestIds()}>
      <CategoryForm />
    </AppDataProvider>,
  )
}

function storedData(items: Map<string, string>): unknown {
  return JSON.parse(items.get(STORAGE_KEY) ?? 'null')
}

const nameInput = () => screen.getByLabelText('Name')
const budgetInput = () => screen.getByLabelText('Monthly budget')
const submit = () =>
  userEvent.click(screen.getByRole('button', { name: 'Add category' }))

describe('CategoryForm', () => {
  it('adds a category with a budget, saves it and announces it', async () => {
    const { storage, items } = createTestStorage()
    renderForm(storage)

    await userEvent.type(nameInput(), '  Fuel ')
    await userEvent.type(budgetInput(), '80')
    await submit()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Added Fuel with a budget of $80.00.',
    )
    // Six seeded categories (id-1 to id-6), then the new one.
    expect(storedData(items)).toMatchObject({
      data: {
        categories: [
          {},
          {},
          {},
          {},
          {},
          {},
          { id: 'id-7', name: 'Fuel', monthlyBudgetCents: 8000 },
        ],
      },
    })
  })

  it('adds a category with no budget when the budget is left blank', async () => {
    renderForm()

    await userEvent.type(nameInput(), 'Gifts')
    await submit()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Added Gifts with no budget set.',
    )
  })

  it('clears the form after adding and puts focus back on the name', async () => {
    renderForm()

    await userEvent.type(nameInput(), 'Fuel')
    await userEvent.type(budgetInput(), '80')
    await submit()

    expect(nameInput()).toHaveValue('')
    expect(budgetInput()).toHaveValue('')
    expect(nameInput()).toHaveFocus()
  })

  it('explains that a blank budget means no budget', () => {
    renderForm()

    expect(budgetInput()).toHaveAccessibleDescription(
      'Leave blank for no budget.',
    )
  })

  it('requires a name and focuses it', async () => {
    const { storage, writes } = createTestStorage()
    renderForm(storage)

    await submit()

    expect(nameInput()).toHaveAccessibleDescription('Enter a name.')
    expect(nameInput()).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('rejects a name that is already used, ignoring case', async () => {
    renderForm()

    await userEvent.type(nameInput(), 'groceries')
    await submit()

    expect(nameInput()).toHaveAccessibleDescription(
      'Another category already has this name.',
    )
  })

  it('rejects a bad budget amount', async () => {
    renderForm()

    await userEvent.type(nameInput(), 'Fuel')
    await userEvent.type(budgetInput(), '12.345')
    await submit()

    expect(budgetInput()).toHaveAccessibleDescription(
      'Leave blank for no budget. Use no more than 2 decimal places.',
    )
    expect(budgetInput()).toHaveFocus()
  })
})
