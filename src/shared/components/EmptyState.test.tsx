import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('shows the title and description', () => {
    render(
      <EmptyState
        title="No transactions yet"
        description="Transactions you add will appear here."
      />,
    )

    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    expect(
      screen.getByText('Transactions you add will appear here.'),
    ).toBeInTheDocument()
  })

  it('hides the decorative icon from assistive tech', () => {
    render(<EmptyState title="Empty" description="Nothing here." />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
