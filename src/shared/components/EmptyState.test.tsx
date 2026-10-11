import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

afterEach(() => {
  delete document.documentElement.dataset.palette
})

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

  it('shows no emoji in sunset mode', () => {
    render(
      <EmptyState title="Empty" description="Nothing here." pinkEmoji="🧸" />,
    )

    expect(screen.queryByText('🧸')).not.toBeInTheDocument()
  })

  it('shows its emoji, hidden from assistive tech, in pink mode', () => {
    document.documentElement.dataset.palette = 'pink'
    render(
      <EmptyState title="Empty" description="Nothing here." pinkEmoji="🧸" />,
    )

    expect(screen.getByText('🧸')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Empty')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
