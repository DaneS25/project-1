import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CURRENT_VERSION } from '@/shared/storage/migrations'
import { STORAGE_KEY, type StorageLike } from '@/shared/storage/storage'
import { AppDataProvider } from '@/shared/store/AppDataProvider'
import { createTestIds, createTestStorage } from '@/shared/store/testStorage'
import { FLOURISH_MS } from '../hooks/useFlourish'
import { TransactionForm } from './TransactionForm'

const TODAY = '2026-10-09'

function renderForm(storage: StorageLike = createTestStorage().storage) {
  return render(
    <AppDataProvider storage={storage} createId={createTestIds()}>
      <TransactionForm today={TODAY} />
    </AppDataProvider>,
  )
}

function storedData(items: Map<string, string>): unknown {
  return JSON.parse(items.get(STORAGE_KEY) ?? 'null')
}

const amountInput = () => screen.getByLabelText('Amount')
const dateInput = () => screen.getByLabelText('Date')
const categorySelect = () => screen.getByLabelText('Category')
const noteInput = () => screen.getByLabelText(/^Note/)
const submit = () =>
  userEvent.click(screen.getByRole('button', { name: 'Add transaction' }))

describe('TransactionForm', () => {
  it("starts with today's date and no category chosen", () => {
    renderForm()

    expect(dateInput()).toHaveValue(TODAY)
    expect(categorySelect()).toHaveDisplayValue('Choose a category')
  })

  it('adds a transaction, saves it and announces it', async () => {
    const { storage, items } = createTestStorage()
    renderForm(storage)

    await userEvent.type(amountInput(), '12.5')
    await userEvent.selectOptions(categorySelect(), 'Groceries')
    await userEvent.type(noteInput(), 'Weekly shop')
    await submit()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Added $12.50 to Groceries.',
    )
    expect(storedData(items)).toMatchObject({
      data: {
        transactions: [{ amountCents: 1250, date: TODAY, note: 'Weekly shop' }],
      },
    })
  })

  it('clears the amount and note after adding, keeping the date and category', async () => {
    renderForm()

    await userEvent.type(amountInput(), '8')
    await userEvent.selectOptions(categorySelect(), 'Transport')
    await userEvent.type(noteInput(), 'Bus')
    await submit()

    expect(amountInput()).toHaveValue('')
    expect(noteInput()).toHaveValue('')
    expect(dateInput()).toHaveValue(TODAY)
    expect(categorySelect()).toHaveDisplayValue('Transport')
    expect(amountInput()).toHaveFocus()
  })

  it('clears the confirmation when the user starts the next entry', async () => {
    renderForm()

    await userEvent.type(amountInput(), '12.50')
    await userEvent.selectOptions(categorySelect(), 'Groceries')
    await submit()
    await userEvent.type(amountInput(), '1')

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('shows the confirmation afresh when the same add is repeated', async () => {
    renderForm()
    await userEvent.type(amountInput(), '12.50')
    await userEvent.selectOptions(categorySelect(), 'Groceries')
    await submit()

    await userEvent.type(amountInput(), '12.50')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    await submit()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Added $12.50 to Groceries.',
    )
  })

  it('shows an error next to each missing field and saves nothing', async () => {
    const { storage, items } = createTestStorage()
    renderForm(storage)

    await userEvent.clear(dateInput())
    await submit()

    expect(amountInput()).toHaveAccessibleDescription('Enter an amount.')
    expect(dateInput()).toHaveAccessibleDescription('Enter a date.')
    expect(categorySelect()).toHaveAccessibleDescription('Choose a category.')
    expect(screen.getAllByRole('alert')).toHaveLength(3)
    expect(storedData(items)).toBeNull()
  })

  it('moves focus to the first field with an error', async () => {
    renderForm()

    await userEvent.type(amountInput(), '5')
    await submit()

    expect(categorySelect()).toHaveFocus()
    expect(categorySelect()).toBeInvalid()
  })

  it('rejects an amount of zero', async () => {
    renderForm()

    await userEvent.type(amountInput(), '0')
    await userEvent.selectOptions(categorySelect(), 'Groceries')
    await submit()

    expect(amountInput()).toHaveAccessibleDescription(
      'Enter an amount more than $0.00.',
    )
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('clears a field’s error once the user changes it', async () => {
    renderForm()

    await submit()
    await userEvent.type(amountInput(), '3')

    expect(amountInput()).not.toHaveAccessibleDescription()
    expect(amountInput()).toBeValid()
    expect(categorySelect()).toHaveAccessibleDescription('Choose a category.')
  })

  it('asks for a category first when there are none', () => {
    const { storage } = createTestStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: CURRENT_VERSION,
        data: { transactions: [], categories: [] },
      }),
    })
    renderForm(storage)

    expect(screen.getByText('No categories yet')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Add transaction' }),
    ).not.toBeInTheDocument()
  })
})

describe('success flourish on the Add button', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const addButton = () =>
    screen.getByRole('button', { name: 'Add transaction' })
  // The check is decorative (aria-hidden), so look at its state directly.
  const isShowingCheck = () => addButton().querySelector('[data-done]') !== null

  async function addOne() {
    await userEvent.type(amountInput(), '12.50')
    await userEvent.selectOptions(categorySelect(), 'Groceries')
    await submit()
  }

  it('shows a check after a successful add, then brings the label back', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderForm()

    await addOne()
    expect(isShowingCheck()).toBe(true)

    vi.advanceTimersByTime(FLOURISH_MS)
    await vi.waitFor(() => {
      expect(isShowingCheck()).toBe(false)
    })
  })

  it('keeps the button name and leaves the announcement to the status message', async () => {
    renderForm()

    await addOne()

    expect(addButton()).toHaveTextContent('Add transaction')
    expect(addButton()).toHaveAccessibleName('Add transaction')
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Added $12.50 to Groceries.',
    )
  })

  it('restarts the timer for a quick second add', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderForm()
    await addOne()

    vi.advanceTimersByTime(FLOURISH_MS - 200)
    await userEvent.type(amountInput(), '3')
    await submit()
    vi.advanceTimersByTime(400)

    expect(isShowingCheck()).toBe(true)
  })

  it('shows no check when the add fails validation', async () => {
    renderForm()

    await submit()

    expect(isShowingCheck()).toBe(false)
  })
})
