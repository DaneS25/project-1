import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Category } from '@/shared/types'
import type { SpendingBreakdown } from '../logic/insights'
import { DonutChart } from './DonutChart'

const category = (id: string, name: string): Category => ({
  id,
  name,
  monthlyBudgetCents: 0,
})

// spendingByCategory already sorts largest first; the chart keeps that order.
const breakdown: SpendingBreakdown = {
  month: '2026-10',
  totalCents: 210000,
  items: [
    { category: category('rent', 'Rent'), spentCents: 200000 },
    { category: category('groceries', 'Groceries'), spentCents: 7000 },
    { category: category('gifts', 'Gifts'), spentCents: 3000 },
  ],
}

function renderChart() {
  render(<DonutChart breakdown={breakdown} monthLabel="October 2026" />)
}

const chart = () =>
  screen.getByRole('img', {
    name: 'Spending by category in October 2026: $2,100.00 in total.',
  })
// The slices are decorative parts of the image; read them from the SVG.
const slices = () => Array.from(chart().querySelectorAll('circle'))
const rows = () =>
  within(
    screen.getByRole('list', { name: 'Categories, largest first' }),
  ).getAllByRole('listitem')

describe('DonutChart', () => {
  it('names the chart with the month and total', () => {
    renderChart()

    expect(chart()).toBeInTheDocument()
  })

  it('lists every category largest first with its amount and share', () => {
    renderChart()

    expect(rows().map((row) => row.textContent)).toEqual([
      'Rent$2,000.0095%',
      'Groceries$70.003%',
      'Gifts$30.001%',
    ])
  })

  it('draws one slice per category, in the same order and colours as the legend', () => {
    renderChart()

    expect(slices().map((slice) => slice.style.stroke)).toEqual([
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
    ])
    expect(
      rows().map(
        (row) => row.querySelector<HTMLElement>('span')?.style.background,
      ),
    ).toEqual(['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'])
  })

  it('sizes the biggest slice by its share', () => {
    renderChart()

    const [rent] = slices()
    const length = Number(rent?.getAttribute('stroke-dasharray')?.split(' ')[0])
    expect(length).toBeGreaterThan(90)
    expect(length).toBeLessThan(96)
  })

  it('highlights the matching slice when a legend row gets keyboard focus', async () => {
    renderChart()

    await userEvent.tab()
    await userEvent.tab()

    expect(rows()[1]).toHaveFocus()
    expect(rows()[1]).toHaveAttribute('data-state', 'active')
    expect(slices().map((slice) => slice.dataset.state)).toEqual([
      'dimmed',
      'active',
      'dimmed',
    ])
  })

  it('clears the highlight when focus leaves the legend', async () => {
    renderChart()
    await userEvent.tab()

    await userEvent.tab({ shift: true })

    expect(slices().every((slice) => !slice.dataset.state)).toBe(true)
  })

  it('shows the total in the centre', () => {
    renderChart()

    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('$2,100.00')).toBeInTheDocument()
  })
})
