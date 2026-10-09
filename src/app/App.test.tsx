import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '@/app/App'
import { STORAGE_KEY } from '@/shared/storage/storage'

const storageNotice = () => screen.getByRole('status', { name: 'Saved data' })

describe('App', () => {
  it('shows the app heading in the page header', () => {
    render(<App />)

    const header = screen.getByRole('banner')
    expect(
      within(header).getByRole('heading', { level: 1, name: 'Budget' }),
    ).toBeInTheDocument()
  })

  it('shows the add form, monthly summary and transactions sections in the main area', () => {
    render(<App />)

    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('region', { name: 'Add a transaction' }),
    ).toBeInTheDocument()
    expect(
      within(main).getByRole('region', { name: 'This month' }),
    ).toBeInTheDocument()
    expect(
      within(main).getByRole('region', { name: 'Transactions' }),
    ).toBeInTheDocument()
  })

  it('shows no storage notice when saved data loads normally', () => {
    render(<App />)

    expect(storageNotice()).toBeEmptyDOMElement()
  })

  it('tells the user when saved data could not be read', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')

    render(<App />)

    expect(storageNotice()).toHaveTextContent(
      "Your saved budget data couldn't be read",
    )
  })

  it('saves a transaction added with the form to browser storage', async () => {
    render(<App today="2026-10-09" />)

    await userEvent.type(screen.getByLabelText('Amount'), '12.50')
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Rent')
    await userEvent.click(
      screen.getByRole('button', { name: 'Add transaction' }),
    )

    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'),
    ).toMatchObject({
      data: { transactions: [{ amountCents: 1250, date: '2026-10-09' }] },
    })
  })

  it('shows a transaction added with the form at the top of the list', async () => {
    render(<App today="2026-10-09" />)
    const form = within(
      screen.getByRole('region', { name: 'Add a transaction' }),
    )

    await userEvent.type(form.getByLabelText('Amount'), '40')
    await userEvent.selectOptions(form.getByLabelText('Category'), 'Transport')
    await userEvent.click(form.getByRole('button', { name: 'Add transaction' }))

    const list = within(screen.getByRole('region', { name: 'Transactions' }))
    expect(list.getAllByRole('listitem')[0]).toHaveTextContent(
      /Transport.*9 Oct 2026.*\$40\.00/,
    )
  })
})
