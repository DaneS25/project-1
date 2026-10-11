import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Panel } from './Panel'

afterEach(() => {
  delete document.documentElement.dataset.palette
})

describe('Panel', () => {
  it('is a region named by its heading', () => {
    render(
      <Panel title="Transactions">
        <p>Content</p>
      </Panel>,
    )

    const region = screen.getByRole('region', { name: 'Transactions' })
    expect(region).toContainElement(screen.getByText('Content'))
    expect(
      screen.getByRole('heading', { level: 2, name: 'Transactions' }),
    ).toBeInTheDocument()
  })

  it('shows the description when given', () => {
    render(
      <Panel title="Transactions" description="Newest first">
        <p>Content</p>
      </Panel>,
    )

    expect(screen.getByText('Newest first')).toBeInTheDocument()
  })

  it('leaves out its pink icon in sunset mode', () => {
    render(
      <Panel title="Categories" pinkIcon="🎀">
        <p>Content</p>
      </Panel>,
    )

    expect(screen.queryByText('🎀')).not.toBeInTheDocument()
  })

  it('shows its pink icon in pink mode without changing the heading name', () => {
    document.documentElement.dataset.palette = 'pink'
    render(
      <Panel title="Categories" pinkIcon="🎀">
        <p>Content</p>
      </Panel>,
    )

    expect(screen.getByText('🎀')).toHaveAttribute('aria-hidden', 'true')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Categories' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Categories' }),
    ).toBeInTheDocument()
  })
})
