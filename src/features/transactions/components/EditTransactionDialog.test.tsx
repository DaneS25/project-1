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

function renderList(transactions: Transaction[] = [shop, rent]) {
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

const editShopButton = () =>
  screen.getByRole('button', {
    name: 'Edit Groceries, $12.50, Fri, 9 Oct 2026',
  })
const dialog = () => screen.getByRole('dialog', { name: 'Edit transaction' })
const inDialog = () => within(dialog())

async function openEditor() {
  await userEvent.click(editShopButton())
}

describe('editing a transaction', () => {
  it('names each Edit button after its transaction', () => {
    renderList()

    expect(editShopButton()).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Edit Rent, $500.00, Mon, 5 Oct 2026',
      }),
    ).toBeInTheDocument()
  })

  it('opens a dialog filled in with the transaction, with focus on the amount', async () => {
    renderList()

    await openEditor()

    expect(inDialog().getByLabelText('Amount')).toHaveValue('12.50')
    expect(inDialog().getByLabelText('Date')).toHaveValue('2026-10-09')
    expect(inDialog().getByLabelText('Category')).toHaveDisplayValue(
      'Groceries',
    )
    expect(inDialog().getByLabelText(/^Note/)).toHaveValue('Weekly shop')
    expect(inDialog().getByLabelText('Amount')).toHaveFocus()
  })

  it('saves the changes, updates the list and storage, and announces it', async () => {
    const { items } = renderList()
    await openEditor()

    const amount = inDialog().getByLabelText('Amount')
    await userEvent.clear(amount)
    await userEvent.type(amount, '15')
    await userEvent.selectOptions(inDialog().getByLabelText('Category'), 'Rent')
    await userEvent.click(
      inDialog().getByRole('button', { name: 'Save changes' }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Saved $15.00 in Rent.',
    )
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(
      /Rent.*Weekly shop.*\$15\.00/,
    )
    expect(storedData(items)).toMatchObject({
      data: {
        transactions: [
          {
            id: 't1',
            amountCents: 1500,
            categoryId: 'rent',
            note: 'Weekly shop',
          },
          rent,
        ],
      },
    })
  })

  it('returns focus to the Edit button after saving', async () => {
    renderList()
    await openEditor()

    await userEvent.click(
      inDialog().getByRole('button', { name: 'Save changes' }),
    )

    expect(
      screen.getByRole('button', { name: /^Edit Groceries, \$12\.50/ }),
    ).toHaveFocus()
  })

  it('re-sorts the list when the date changes', async () => {
    renderList()
    await userEvent.click(screen.getByRole('button', { name: /^Edit Rent/ }))

    const date = inDialog().getByLabelText('Date')
    await userEvent.clear(date)
    await userEvent.type(date, '2026-10-20')
    await userEvent.click(
      inDialog().getByRole('button', { name: 'Save changes' }),
    )

    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('20 Oct 2026')
  })

  it('returns focus to the Edit button of a row that moved after the save', async () => {
    renderList()
    await openEditor()

    // An older date moves Groceries from first to last.
    const date = inDialog().getByLabelText('Date')
    await userEvent.clear(date)
    await userEvent.type(date, '2026-10-01')
    await userEvent.click(
      inDialog().getByRole('button', { name: 'Save changes' }),
    )

    const lastRow = within(screen.getAllByRole('listitem')[1] ?? document.body)
    expect(
      lastRow.getByRole('button', {
        name: 'Edit Groceries, $12.50, Thu, 1 Oct 2026',
      }),
    ).toHaveFocus()
  })

  it('removes the note when it is cleared', async () => {
    const { items } = renderList()
    await openEditor()

    await userEvent.clear(inDialog().getByLabelText(/^Note/))
    await userEvent.click(
      inDialog().getByRole('button', { name: 'Save changes' }),
    )

    expect(storedData(items)).toEqual({
      version: CURRENT_VERSION,
      data: {
        transactions: [
          {
            id: 't1',
            amountCents: 1250,
            date: '2026-10-09',
            categoryId: 'groceries',
          },
          rent,
        ],
        categories,
      },
    })
  })

  it('discards changes on Escape and returns focus to the Edit button', async () => {
    const { writes } = renderList()
    await openEditor()

    await userEvent.type(inDialog().getByLabelText('Amount'), '9')
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(editShopButton()).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('discards changes on Cancel and returns focus to the Edit button', async () => {
    const { writes } = renderList()
    await openEditor()

    await userEvent.clear(inDialog().getByLabelText('Amount'))
    await userEvent.type(inDialog().getByLabelText('Amount'), '99')
    await userEvent.click(inDialog().getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('$12.50')
    expect(editShopButton()).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('shows errors and keeps the dialog open when the changes are invalid', async () => {
    const { writes } = renderList()
    await openEditor()

    await userEvent.clear(inDialog().getByLabelText('Amount'))
    await userEvent.click(
      inDialog().getByRole('button', { name: 'Save changes' }),
    )

    expect(inDialog().getByLabelText('Amount')).toHaveAccessibleDescription(
      'Enter an amount.',
    )
    expect(inDialog().getByLabelText('Amount')).toHaveFocus()
    expect(writes).toEqual([])
  })

  it('clears the last confirmation when another edit starts', async () => {
    renderList()
    await openEditor()
    await userEvent.click(
      inDialog().getByRole('button', { name: 'Save changes' }),
    )

    await openEditor()

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
