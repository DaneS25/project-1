import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryName } from './CategoryName'

describe('CategoryName', () => {
  it('shows the emoji before the name, hidden from screen readers', () => {
    render(
      <h3>
        <CategoryName name="Groceries" emoji="🛒" />
      </h3>,
    )

    const heading = screen.getByRole('heading', { name: 'Groceries' })
    expect(heading).toHaveTextContent('🛒Groceries')
    expect(screen.getByText('🛒')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows only the name when there is no emoji', () => {
    render(
      <h3>
        <CategoryName name="Groceries" />
      </h3>,
    )

    expect(screen.getByRole('heading')).toHaveTextContent(/^Groceries$/)
  })
})
