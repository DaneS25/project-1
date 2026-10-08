import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Panel } from './Panel'

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
})
