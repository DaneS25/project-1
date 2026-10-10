import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { AppData, Category, Transaction } from '@/shared/types'
import { TrendChart } from './TrendChart'

const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 0 }

let nextId = 0
function spend(amountCents: number, date: string): Transaction {
  nextId += 1
  return { id: `t${String(nextId)}`, amountCents, date, categoryId: rent.id }
}

function renderChart(data: AppData, month = '2026-10') {
  render(<TrendChart data={data} month={month} />)
}

const chart = () => screen.getByRole('img', { name: /^Spending trend for the/ })
// Bars and the budget line are drawn parts of the image.
const bars = () => Array.from(chart().querySelectorAll('rect[data-month]'))
const budgetRuns = () =>
  Array.from(chart().querySelectorAll('polyline')).map((line) =>
    line.getAttribute('data-budget-run'),
  )
// The table is behind "Show as table", as for a user.
async function showTable() {
  await userEvent.click(screen.getByRole('button', { name: 'Show as table' }))
  return screen.getByRole('table')
}

describe('TrendChart', () => {
  it('shows 6 months up to the selected one by default', () => {
    renderChart({ categories: [rent], transactions: [] })

    expect(bars().map((bar) => bar.getAttribute('data-month'))).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ])
    expect(chart()).toHaveAccessibleName(
      'Spending trend for the 6 months to October 2026',
    )
  })

  it('switches to 12 months with the toggle, and back', async () => {
    renderChart({ categories: [rent], transactions: [] })
    const six = screen.getByRole('button', { name: '6 months' })
    const twelve = screen.getByRole('button', { name: '12 months' })
    expect(six).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(twelve)
    expect(bars()).toHaveLength(12)
    expect(bars()[0]).toHaveAttribute('data-month', '2025-11')
    expect(twelve).toHaveAttribute('aria-pressed', 'true')
    expect(six).toHaveAttribute('aria-pressed', 'false')

    six.focus()
    await userEvent.keyboard('{Enter}')
    expect(bars()).toHaveLength(6)
  })

  it('shows months with no spending as zero', async () => {
    renderChart({
      categories: [rent],
      transactions: [spend(50000, '2026-08-10'), spend(20000, '2026-10-01')],
    })

    const rows = within(await showTable())
      .getAllByRole('row')
      .slice(1)
    expect(rows.map((row) => row.textContent)).toEqual([
      'May 2026$0.00No budgets set',
      'June 2026$0.00No budgets set',
      'July 2026$0.00No budgets set',
      'August 2026$500.00No budgets set',
      'September 2026$0.00No budgets set',
      'October 2026 (selected)$200.00No budgets set',
    ])
    expect(bars()[4]?.getAttribute('height')).toBe('0')
  })

  it('draws no budget line when no category has a budget', () => {
    renderChart({ categories: [rent], transactions: [] })

    expect(budgetRuns()).toEqual([])
  })

  it('draws the budget line across every month when budgets are set', async () => {
    renderChart({
      categories: [{ ...rent, monthlyBudgetCents: 150000 }],
      transactions: [],
    })

    expect(budgetRuns()).toEqual(['0-5'])
    expect(within(await showTable()).getAllByRole('row')[6]).toHaveTextContent(
      '$1,500.00',
    )
  })

  it('highlights the selected month with more than colour', () => {
    renderChart({
      categories: [rent],
      transactions: [spend(100, '2026-10-01')],
    })

    const selected = bars().filter((bar) => bar.hasAttribute('data-selected'))
    expect(selected.map((bar) => bar.getAttribute('data-month'))).toEqual([
      '2026-10',
    ])
    const label = Array.from(chart().querySelectorAll('text')).find((text) =>
      text.hasAttribute('data-selected'),
    )
    expect(label).toHaveTextContent('Oct')
  })

  it('labels the amount axis with round NZD amounts', () => {
    renderChart({
      categories: [rent],
      transactions: [spend(210000, '2026-10-01')],
    })

    const labels = Array.from(chart().querySelectorAll('text'))
      .map((text) => text.textContent)
      .filter((text) => text.startsWith('$'))
    expect(labels).toEqual(['$0', '$1,000', '$2,000', '$3,000'])
  })
})
