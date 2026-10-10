import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { AppData, Category, Transaction } from '@/shared/types'
import { CategoryChart } from './CategoryChart'

const groceries: Category = {
  id: 'groceries',
  name: 'Groceries',
  monthlyBudgetCents: 60000,
}
const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 0 }
const fuel: Category = { id: 'fuel', name: 'Fuel', monthlyBudgetCents: 0 }

let nextId = 0
function spend(
  category: Category,
  amountCents: number,
  date: string,
): Transaction {
  nextId += 1
  return {
    id: `t${String(nextId)}`,
    amountCents,
    date,
    categoryId: category.id,
  }
}

const data: AppData = {
  categories: [rent, groceries, fuel],
  transactions: [
    spend(rent, 200000, '2026-10-01'),
    spend(rent, 200000, '2026-09-01'),
    spend(groceries, 45000, '2026-10-03'),
    spend(groceries, 30000, '2026-08-12'),
    spend(groceries, 12000, '2026-08-20'),
  ],
}

function renderChart(appData = data) {
  render(<CategoryChart data={appData} month="2026-10" />)
}

const chart = () => screen.getByRole('img', { name: /^Spending on/ })
const select = () => screen.getByRole('combobox', { name: 'Category' })
// Markers and the budget line are drawn parts of the image.
const markers = () => Array.from(chart().querySelectorAll('circle'))
const budgetLine = () => chart().querySelector('[data-budget-line]')
// The table is behind "Show as table", as for a user; open it once.
async function tableRows() {
  const button = screen.getByRole('button', { name: 'Show as table' })
  if (button.getAttribute('aria-expanded') !== 'true') {
    await userEvent.click(button)
  }
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent)
}

describe('CategoryChart', () => {
  it("opens on the month's largest category, 6 months to the selected one", () => {
    renderChart()

    expect(select()).toHaveDisplayValue('Rent')
    expect(chart()).toHaveAccessibleName(
      'Spending on Rent for the 6 months to October 2026. No budget set.',
    )
    expect(markers().map((m) => m.getAttribute('data-month'))).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ])
  })

  it('lists categories by name in a labelled select', () => {
    renderChart()

    expect(
      within(select())
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Fuel', 'Groceries', 'Rent'])
  })

  it('changes the series when another category is picked', async () => {
    renderChart()
    await userEvent.selectOptions(select(), 'Groceries')

    // Budgets aren't stored per month, so it says "current" everywhere.
    const budget = 'Current budget $600.00 a month'
    expect(chart()).toHaveAccessibleName(
      `Spending on Groceries for the 6 months to October 2026. ${budget}.`,
    )
    expect(screen.getByText(budget)).toBeInTheDocument()
    expect(await tableRows()).toEqual([
      'May 2026$0.00',
      'June 2026$0.00',
      'July 2026$0.00',
      'August 2026$420.00',
      'September 2026$0.00',
      'October 2026 (selected)$450.00',
    ])
  })

  it('switches between 6 and 12 months', async () => {
    renderChart()
    const twelve = screen.getByRole('button', { name: '12 months' })

    await userEvent.click(twelve)
    expect(twelve).toHaveAttribute('aria-pressed', 'true')
    expect(markers()).toHaveLength(12)
    expect(markers()[0]).toHaveAttribute('data-month', '2025-11')
    expect(await tableRows()).toHaveLength(12)

    await userEvent.click(screen.getByRole('button', { name: '6 months' }))
    expect(markers()).toHaveLength(6)
  })

  it('draws the budget line only when the category has a budget', async () => {
    renderChart()
    expect(budgetLine()).toBeNull()

    await userEvent.selectOptions(select(), 'Groceries')
    expect(budgetLine()).not.toBeNull()
  })

  it('shows a category with no spending as zeros, with a marker each month', async () => {
    renderChart()
    await userEvent.selectOptions(select(), 'Fuel')

    expect((await tableRows()).every((row) => row.endsWith('$0.00'))).toBe(true)
    const baseline = markers()[0]?.getAttribute('cy')
    expect(markers()).toHaveLength(6)
    expect(markers().every((m) => m.getAttribute('cy') === baseline)).toBe(true)
  })

  it('marks the selected month by more than colour', () => {
    renderChart()

    const selected = markers().filter((m) => m.hasAttribute('data-selected'))
    expect(selected.map((m) => m.getAttribute('data-month'))).toEqual([
      '2026-10',
    ])
    expect(Number(selected[0]?.getAttribute('r'))).toBeGreaterThan(
      Number(markers()[0]?.getAttribute('r')),
    )
  })

  it('opens on the first category by name when nothing was spent', () => {
    renderChart({ categories: [rent, groceries, fuel], transactions: [] })

    expect(select()).toHaveDisplayValue('Fuel')
  })

  it('says so when there are no categories', () => {
    renderChart({ categories: [], transactions: [] })

    expect(
      screen.getByText('Add a category to see its spending over time.'),
    ).toBeVisible()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
