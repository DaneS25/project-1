import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AppData, Category, Transaction } from '@/shared/types'
import { BudgetChart } from './BudgetChart'

const groceries: Category = {
  id: 'groceries',
  name: 'Groceries',
  monthlyBudgetCents: 60000,
}
const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 200000 }
const gifts: Category = { id: 'gifts', name: 'Gifts', monthlyBudgetCents: 0 }
const hobbies: Category = {
  id: 'hobbies',
  name: 'Hobbies',
  monthlyBudgetCents: 0,
}
const fuel: Category = { id: 'fuel', name: 'Fuel', monthlyBudgetCents: 10000 }

let nextId = 0
function spend(
  category: Category,
  amountCents: number,
  date = '2026-10-05',
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
  // Store order differs from name order on purpose.
  categories: [rent, groceries, gifts, hobbies, fuel],
  transactions: [
    spend(rent, 200000),
    spend(groceries, 72550),
    spend(gifts, 4500),
    // Last month's spending doesn't count.
    spend(fuel, 99999, '2026-09-30'),
  ],
}

function renderChart(appData = data) {
  render(<BudgetChart data={appData} month="2026-10" />)
}

const rows = () =>
  within(
    screen.getByRole('list', { name: 'Categories, by name' }),
  ).getAllByRole('listitem')
const row = (name: string) => {
  const found = rows().find((item) =>
    within(item).queryByText(name, { exact: true }),
  )
  if (!found) throw new Error(`No row for ${name}`)
  return found
}
const bar = (item: HTMLElement, kind: 'budget' | 'spent') =>
  item.querySelector<HTMLElement>(`[data-bar="${kind}"]`)

describe('BudgetChart', () => {
  it('names the chart with its month', () => {
    renderChart()

    expect(
      screen.getByRole('figure', {
        name: 'Budget vs actual by category in October 2026',
      }),
    ).toBeInTheDocument()
  })

  it('lists categories by name, skipping unbudgeted ones with no spending', () => {
    renderChart()

    expect(rows().map((item) => item.getAttribute('data-category'))).toEqual([
      'fuel',
      'gifts',
      'groceries',
      'rent',
    ])
  })

  it('states the amounts on every row', () => {
    renderChart()

    expect(row('Fuel')).toHaveTextContent('$0.00 spent of $100.00')
    expect(row('Fuel')).toHaveTextContent('$100.00 remaining')
    expect(row('Rent')).toHaveTextContent('$2,000.00 spent of $2,000.00')
    expect(row('Rent')).toHaveTextContent('$0.00 remaining')
    expect(row('Groceries')).toHaveTextContent('$725.50 spent of $600.00')
    expect(row('Gifts')).toHaveTextContent('$45.00 spent')
  })

  it('marks an over-budget category with red words and an icon', () => {
    renderChart()

    const note = within(row('Groceries')).getByText('Over budget by $125.50')
    // The summary's shared note: danger colour class plus the warning icon.
    expect(note.className).toMatch(/over/)
    expect(note.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    // Spending exactly the budget is not over.
    expect(within(row('Rent')).queryByText(/Over budget/)).toBeNull()
    expect(within(row('Fuel')).queryByText(/Over budget/)).toBeNull()
  })

  it('shows spending only for a category with no budget', () => {
    renderChart()

    const gifts = row('Gifts')
    expect(within(gifts).getByText('No budget set')).toBeInTheDocument()
    expect(gifts).not.toHaveTextContent('spent of')
    expect(bar(gifts, 'budget')).toBeNull()
    expect(bar(gifts, 'spent')).not.toBeNull()
  })

  it('draws both bars on one scale, hidden from assistive tech', () => {
    renderChart()

    // Rent's $2,000 is the largest amount, so it sets the 100% mark.
    const groceriesRow = row('Groceries')
    expect(bar(row('Rent'), 'budget')?.style.inlineSize).toBe('100%')
    expect(bar(row('Rent'), 'spent')?.style.inlineSize).toBe('100%')
    expect(bar(groceriesRow, 'budget')?.style.inlineSize).toBe('30%')
    expect(bar(groceriesRow, 'spent')?.style.inlineSize).toBe('36.275%')
    // Nothing spent: the budget outline only.
    expect(bar(row('Fuel'), 'spent')).toBeNull()
    expect(bar(row('Fuel'), 'budget')?.style.inlineSize).toBe('5%')
    expect(bar(groceriesRow, 'budget')?.parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('says so when there are no categories', () => {
    renderChart({ categories: [], transactions: [] })

    expect(screen.getByText('No categories to compare yet.')).toBeVisible()
  })
})
