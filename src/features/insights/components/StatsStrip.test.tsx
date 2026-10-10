import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AppData, Category, Transaction } from '@/shared/types'
import { StatsStrip } from './StatsStrip'

const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 0 }
const food: Category = { id: 'food', name: 'Food', monthlyBudgetCents: 0 }

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

function renderStrip(transactions: Transaction[], month = '2026-10') {
  const data: AppData = { categories: [rent, food], transactions }
  render(<StatsStrip data={data} month={month} />)
}

/** The text of the values (dd) under the label (dt) with this text. */
function stat(label: string | RegExp): string[] {
  const term = screen.getByText(label, { selector: 'dt' })
  const group = term.parentElement
  if (!group) throw new Error('Stat has no group')
  return within(group)
    .getAllByRole('definition')
    .map((dd) => dd.textContent)
}

describe('StatsStrip', () => {
  it('shows the figures for the month under a heading', () => {
    renderStrip([
      spend(rent, 150000, '2026-10-01'),
      spend(food, 50000, '2026-10-12'),
      spend(food, 40000, '2026-09-05'),
    ])

    expect(
      screen.getByRole('region', { name: 'October 2026 at a glance' }),
    ).toBeInTheDocument()
    expect(stat('Total spent')).toEqual(['$2,000.00'])
    expect(stat('Change from September 2026')).toEqual([
      'Up $1,600.00',
      '+400%',
    ])
    // ($400 + $2,000) / 6 months.
    expect(stat('Average per month, last 6 months')).toEqual(['$400.00'])
    expect(stat('Top category')).toEqual(['Rent', '$1,500.00, 75% of spending'])
    expect(stat('Largest transaction')).toEqual([
      '$1,500.00',
      'Rent, Thu, 1 Oct 2026',
    ])
  })

  it('says "down" when spending fell', () => {
    renderStrip([
      spend(rent, 30000, '2026-10-01'),
      spend(rent, 40000, '2026-09-01'),
    ])

    expect(stat(/^Change from/)).toEqual(['Down $100.00', '-25%'])
  })

  it('shows "No data yet" for the percentage when last month was 0', () => {
    renderStrip([spend(rent, 30000, '2026-10-01')])

    expect(stat(/^Change from/)).toEqual([
      'Up $300.00',
      'Percentage: No data yet',
    ])
  })

  it('shows "No data yet" for every stat with no data', () => {
    renderStrip([])

    for (const label of [
      'Total spent',
      'Change from September 2026',
      'Average per month, last 6 months',
      'Top category',
      'Largest transaction',
    ]) {
      expect(stat(label)).toEqual(['No data yet'])
    }
  })

  it('keeps earlier months in the average for a month with no spending', () => {
    renderStrip([spend(rent, 60000, '2026-09-01')])

    expect(stat('Total spent')).toEqual(['No data yet'])
    expect(stat(/^Change from/)).toEqual(['Down $600.00', '-100%'])
    expect(stat('Average per month, last 6 months')).toEqual(['$100.00'])
    expect(stat('Top category')).toEqual(['No data yet'])
  })

  it('is not a live region', () => {
    renderStrip([])

    const region = screen.getByRole('region')
    expect(region).not.toHaveAttribute('aria-live')
    expect(region.querySelector('[aria-live]')).toBeNull()
  })
})
