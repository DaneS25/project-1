import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppData, Category, Transaction } from '@/shared/types'
import { spendingByCategory } from '../logic/insights'
import { BudgetChart } from './BudgetChart'
import { CategoryChart } from './CategoryChart'
import { DonutChart } from './DonutChart'
import { TrendChart } from './TrendChart'

/*
 * Task 33's shared behaviour across the charts: text summaries, "Show as
 * table", tooltips (hover, focus, Escape, hoverable), first-view grow-in
 * and drawing at the measured width.
 */

const rent: Category = { id: 'rent', name: 'Rent', monthlyBudgetCents: 0 }
const food: Category = { id: 'food', name: 'Food', monthlyBudgetCents: 60000 }

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
  categories: [rent, food],
  transactions: [
    spend(rent, 150000, '2026-10-01'),
    spend(food, 72500, '2026-10-04'),
    spend(food, 50000, '2026-08-04'),
  ],
}

function renderDonut() {
  const breakdown = spendingByCategory(data, '2026-10')
  if (!breakdown.ok) throw new Error('Expected a breakdown')
  render(<DonutChart breakdown={breakdown.value} monthLabel="October 2026" />)
}

const tooltip = () => screen.queryByRole('tooltip')
const tableButton = () => screen.getByRole('button', { name: 'Show as table' })

describe('chart text summaries', () => {
  it('leads each chart with a one-line summary', () => {
    renderDonut()
    expect(
      screen.getByText('Rent was the largest category at 67% of $2,225.00.'),
    ).toBeVisible()
  })

  it('summarises budget vs actual', () => {
    render(<BudgetChart data={data} month="2026-10" />)
    expect(
      screen.getByText('1 of 1 budgeted category is over budget: Food.'),
    ).toBeVisible()
  })

  it('summarises the trend chart', () => {
    render(<TrendChart data={data} month="2026-10" />)
    expect(
      screen.getByText(
        'October 2026 was the highest of these 6 months at $2,225.00.',
      ),
    ).toBeVisible()
  })
})

describe('"Show as table"', () => {
  it('is a disclosure button that shows and hides a real table', async () => {
    render(<BudgetChart data={data} month="2026-10" />)
    const button = tableButton()
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('table')).toBeNull()

    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const table = screen.getByRole('table', {
      name: 'Budget vs actual by category in October 2026',
    })
    expect(button).toHaveAttribute(
      'aria-controls',
      table.parentElement?.id ?? 'missing',
    )
    expect(
      within(table)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual([
      'CategorySpentBudgetRemaining',
      'Food$725.00$600.00Over by $125.00',
      'Rent$1,500.00No budget set',
    ])

    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('gives the donut a table of categories, amounts and shares', async () => {
    renderDonut()
    await userEvent.click(tableButton())

    expect(
      within(screen.getByRole('table'))
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['CategorySpentShare', 'Rent$1,500.0067%', 'Food$725.0033%'])
  })
})

describe('month tooltips (trend and category charts)', () => {
  it('opens on keyboard focus at the selected month and moves with the arrows', async () => {
    render(<TrendChart data={data} month="2026-10" />)
    const chart = screen.getByRole('img', { name: /^Spending trend/ })

    await userEvent.tab() // the 6 months button
    await userEvent.tab() // the 12 months button
    await userEvent.tab()
    expect(chart).toHaveFocus()
    expect(tooltip()).toHaveTextContent(
      'October 2026 Spent $2,225.00 Total budget $600.00',
    )
    expect(chart).toHaveAccessibleDescription(
      /^October 2026 Spent \$2,225.00 Total budget \$600.00 Use the Left and Right arrow keys/,
    )

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(tooltip()).toHaveTextContent('August 2026 Spent $500.00')
    await userEvent.keyboard('{Home}')
    expect(tooltip()).toHaveTextContent('May 2026 Spent $0.00')

    await userEvent.keyboard('{Escape}')
    expect(tooltip()).toBeNull()
    await userEvent.keyboard('{End}')
    expect(tooltip()).toHaveTextContent('October 2026')
  })

  it("doesn't let the arrow keys reach the carousel around it", async () => {
    const onKeyDown = vi.fn()
    render(
      <div onKeyDown={onKeyDown}>
        <CategoryChart data={data} month="2026-10" />
      </div>,
    )
    screen.getByRole('img', { name: /^Spending on/ }).focus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(onKeyDown).not.toHaveBeenCalled()
    expect(tooltip()).toHaveTextContent('September 2026 Rent: $0.00')
  })

  it('opens on mouse hover, stays while the pointer is on it, and closes on leaving', async () => {
    const { container } = render(<TrendChart data={data} month="2026-10" />)
    const slots = container.querySelectorAll('rect:not([data-month])')
    const august = slots[3]
    if (!august) throw new Error('No slot for August')

    await userEvent.hover(august)
    const tip = tooltip()
    expect(tip).toHaveTextContent('August 2026 Spent $500.00')

    // Hoverable: moving onto the tooltip keeps it open.
    await userEvent.hover(tip ?? august)
    expect(tooltip()).toHaveTextContent('August 2026')

    // Dismissible without moving the pointer.
    await userEvent.keyboard('{Escape}')
    expect(tooltip()).toBeNull()

    // Leaving the chart closes it.
    await userEvent.hover(august)
    expect(tooltip()).not.toBeNull()
    await userEvent.unhover(august)
    expect(tooltip()).toBeNull()
  })
})

describe('donut tooltip', () => {
  it('opens when a legend row is focused, and Escape closes it', async () => {
    renderDonut()
    await userEvent.tab()
    const row = screen.getAllByRole('listitem')[0]
    expect(row).toHaveFocus()
    expect(tooltip()).toHaveTextContent('Rent $1,500.00, 67%')
    expect(row).toHaveAccessibleDescription('Rent $1,500.00, 67%')

    await userEvent.keyboard('{Escape}')
    expect(tooltip()).toBeNull()
  })

  it('opens on hovering a slice but not a legend row', async () => {
    const { container } = renderDonutWithContainer()
    const slice = container.querySelector('circle')
    if (!slice) throw new Error('No slice')

    await userEvent.hover(slice)
    expect(tooltip()).toHaveTextContent('Rent $1,500.00, 67%')

    await userEvent.hover(screen.getAllByRole('listitem')[1] ?? slice)
    expect(tooltip()).toBeNull()
  })
})

function renderDonutWithContainer() {
  const breakdown = spendingByCategory(data, '2026-10')
  if (!breakdown.ok) throw new Error('Expected a breakdown')
  return render(
    <DonutChart breakdown={breakdown.value} monthLabel="October 2026" />,
  )
}

describe('first-view grow-in and measured width', () => {
  type Callback = (entries: { isIntersecting: boolean }[]) => void
  // jsdom has neither observer; each test installs a fake and removes it.
  afterEach(() => {
    Reflect.deleteProperty(window, 'IntersectionObserver')
    Reflect.deleteProperty(window, 'ResizeObserver')
  })

  it('marks a chart as seen only once it scrolls into view', () => {
    let notify: Callback = () => undefined
    class FakeIntersectionObserver {
      constructor(callback: Callback) {
        notify = callback
      }
      observe = vi.fn()
      disconnect = vi.fn()
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: FakeIntersectionObserver,
    })

    const { container } = render(<TrendChart data={data} month="2026-10" />)
    const root = container.firstElementChild
    expect(root).not.toHaveAttribute('data-seen')

    act(() => {
      notify([{ isIntersecting: true }])
    })
    expect(root).toHaveAttribute('data-seen')
  })

  it('draws at the measured width, so axis text stays 12px on a phone', () => {
    let notify: (entries: { contentRect: { width: number } }[]) => void = () =>
      undefined
    class FakeResizeObserver {
      constructor(callback: typeof notify) {
        notify = callback
      }
      observe = vi.fn()
      disconnect = vi.fn()
    }
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: FakeResizeObserver,
    })

    render(<TrendChart data={data} month="2026-10" />)
    const chart = screen.getByRole('img', { name: /^Spending trend/ })
    expect(chart).toHaveAttribute('viewBox', '0 0 360 200')

    act(() => {
      notify([{ contentRect: { width: 288 } }])
    })
    // One SVG unit is one CSS pixel at any width.
    expect(chart).toHaveAttribute('viewBox', '0 0 288 200')
  })
})
