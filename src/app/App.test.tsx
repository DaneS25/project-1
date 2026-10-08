import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '@/app/App'

describe('App', () => {
  it('shows the app heading in the page header', () => {
    render(<App />)

    const header = screen.getByRole('banner')
    expect(
      within(header).getByRole('heading', { level: 1, name: 'Budget' }),
    ).toBeInTheDocument()
  })

  it('shows the monthly summary and transactions sections in the main area', () => {
    render(<App />)

    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('region', { name: 'This month' }),
    ).toBeInTheDocument()
    expect(
      within(main).getByRole('region', { name: 'Transactions' }),
    ).toBeInTheDocument()
  })
})
