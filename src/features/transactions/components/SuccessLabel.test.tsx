import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SuccessLabel } from './SuccessLabel'

const heart = (container: HTMLElement) =>
  container.querySelector('[data-icon="heart"]')

afterEach(() => {
  delete document.documentElement.dataset.palette
})

describe('SuccessLabel', () => {
  it('uses the check, not a heart, in sunset mode', () => {
    const { container } = render(
      <button type="button">
        <SuccessLabel label="Add transaction" isDone />
      </button>,
    )

    expect(heart(container)).not.toBeInTheDocument()
  })

  it('uses a hidden heart in pink mode and keeps the button name', () => {
    document.documentElement.dataset.palette = 'pink'
    const { container } = render(
      <button type="button">
        <SuccessLabel label="Add transaction" isDone />
      </button>,
    )

    expect(heart(container)).toBeInTheDocument()
    expect(heart(container)?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(
      screen.getByRole('button', { name: 'Add transaction' }),
    ).toBeInTheDocument()
  })
})
