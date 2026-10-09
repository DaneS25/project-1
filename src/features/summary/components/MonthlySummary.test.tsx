import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION } from '@/shared/storage/migrations'
import { STORAGE_KEY } from '@/shared/storage/storage'
import { AppDataProvider } from '@/shared/store/AppDataProvider'
import { createTestIds, createTestStorage } from '@/shared/store/testStorage'
import type { Category, Transaction } from '@/shared/types'
import { MonthlySummary } from './MonthlySummary'

const TODAY = '2026-10-09'

const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 200000 }
const groceries: Category = {
  id: 'groceries',
  name: 'Groceries',
  monthlyBudgetCents: 60000,
}
const gifts: Category = { id: 'gifts', name: 'gifts', monthlyBudgetCents: 0 }

let nextId = 0
function spend(categoryId: string, amountCents: number, date: string) {
  nextId += 1
  return { id: `t${String(nextId)}`, amountCents, date, categoryId }
}

function renderSummary(
  transactions: Transaction[],
  categories: Category[] = [rent, groceries, gifts],
  today = TODAY,
) {
  const { storage } = createTestStorage({
    [STORAGE_KEY]: JSON.stringify({
      version: CURRENT_VERSION,
      data: { transactions, categories },
    }),
  })
  render(
    <AppDataProvider storage={storage} createId={createTestIds()}>
      <MonthlySummary today={today} />
    </AppDataProvider>,
  )
}

const month = () => screen.getByRole('status')
const total = (label: string) =>
  screen.getByText(label, { selector: 'dt' }).nextElementSibling
const rows = () =>
  screen.getAllByRole('listitem').map((item) => item.textContent)
const previous = () =>
  userEvent.click(screen.getByRole('button', { name: /^Previous month/ }))
const next = () =>
  userEvent.click(screen.getByRole('button', { name: /^Next month/ }))

describe('MonthlySummary', () => {
  it("opens on today's month", () => {
    renderSummary([])

    expect(month()).toHaveTextContent('October 2026')
    expect(
      screen.queryByRole('button', { name: 'Back to this month' }),
    ).not.toBeInTheDocument()
  })

  it('shows an empty state for a month with no transactions', () => {
    renderSummary([spend('rent', 100, '2026-09-30')])

    expect(screen.getByText('No spending in October 2026')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('lists every category by name with spent of budget and what is left', () => {
    renderSummary([
      spend('groceries', 5250, '2026-10-02'),
      spend('rent', 200000, '2026-10-01'),
      spend('gifts', 3000, '2026-10-05'),
    ])

    expect(rows()).toEqual([
      'gifts$30.00 spentNo budget set',
      'Groceries$52.50 spent of $600.00$547.50 remaining',
      'Rent$2,000.00 spent of $2,000.00$0.00 remaining',
    ])
  })

  it('shows a category with no spending this month', () => {
    renderSummary([spend('rent', 100, '2026-10-01')])

    expect(rows()[1]).toBe('Groceries$0.00 spent of $600.00$600.00 remaining')
  })

  it('says in words when a category is over budget', () => {
    renderSummary([spend('groceries', 61000, '2026-10-02')])

    expect(rows()[1]).toBe(
      'Groceries$610.00 spent of $600.00Over budget by $10.00',
    )
  })

  it('never shows a remaining figure or over-budget flag for no budget', () => {
    renderSummary([spend('gifts', 999999, '2026-10-02')])

    expect(rows()[0]).toBe('gifts$9,999.99 spentNo budget set')
  })

  it('labels the totals so no-budget spending is kept apart', () => {
    renderSummary([
      spend('groceries', 1000, '2026-10-02'),
      spend('gifts', 50000, '2026-10-03'),
    ])

    expect(total('Spent in total')).toHaveTextContent('$510.00')
    expect(total('Total budget')).toHaveTextContent('$2,600.00')
    expect(total('Spent in budgeted categories')).toHaveTextContent('$10.00')
    expect(total('Remaining')).toHaveTextContent('$2,590.00')
  })

  it('says in words when the month is over budget', () => {
    renderSummary([
      spend('groceries', 100000, '2026-10-02'),
      spend('rent', 200000, '2026-10-01'),
    ])

    expect(total('Over budget by')).toHaveTextContent('$400.00')
    expect(screen.queryByText('Remaining')).not.toBeInTheDocument()
  })

  it('says when no category has a budget', () => {
    renderSummary([spend('gifts', 100, '2026-10-02')], [gifts])

    expect(total('Total budget')).toHaveTextContent('No budgets set')
    expect(screen.queryByText('Remaining')).not.toBeInTheDocument()
  })

  it('moves between months and announces the month', async () => {
    renderSummary([
      spend('groceries', 1000, '2026-09-15'),
      spend('groceries', 2000, '2026-11-15'),
    ])

    await previous()
    expect(month()).toHaveTextContent('September 2026')
    expect(total('Spent in total')).toHaveTextContent('$10.00')

    await next()
    await next()
    expect(month()).toHaveTextContent('November 2026')
    expect(total('Spent in total')).toHaveTextContent('$20.00')
  })

  it('names the month each button goes to', () => {
    renderSummary([])

    expect(
      screen.getByRole('button', {
        name: 'Previous month, September 2026',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Next month, November 2026' }),
    ).toBeInTheDocument()
  })

  it('crosses the year boundary', async () => {
    renderSummary([spend('rent', 100, '2025-12-31')], undefined, '2026-01-04')

    await previous()

    expect(month()).toHaveTextContent('December 2025')
    expect(total('Spent in total')).toHaveTextContent('$1.00')
  })

  it('offers a way back to the current month', async () => {
    renderSummary([])
    await previous()
    await previous()

    await userEvent.click(
      screen.getByRole('button', { name: 'Back to this month' }),
    )

    expect(month()).toHaveTextContent('October 2026')
  })

  it('shows a plain message when totals are too large to add up', () => {
    const max = Number.MAX_SAFE_INTEGER
    renderSummary(
      [spend('rent', max, '2026-10-01'), spend('rent', max, '2026-10-02')],
      [rent],
    )

    expect(
      screen.getByText(
        'The totals for October 2026 are too large to show. Check for an amount entered by mistake.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
