import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('is a plain button by default, so it never submits a form', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault()
    })
    render(
      <form
        onSubmit={(e) => {
          onSubmit(e.nativeEvent)
        }}
      >
        <Button>Cancel</Button>
      </form>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute(
      'type',
      'button',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits when asked to', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault()
    })
    render(
      <form
        onSubmit={(e) => {
          onSubmit(e.nativeEvent)
        }}
      >
        <Button variant="primary" type="submit">
          Save
        </Button>
      </form>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('passes through clicks, labels and refs', async () => {
    const onClick = vi.fn()
    const ref = createRef<HTMLButtonElement>()
    render(
      <Button
        ref={ref}
        variant="outline"
        size="small"
        aria-label="Edit Groceries"
        onClick={onClick}
      >
        Edit
      </Button>,
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Groceries' }),
    )

    expect(onClick).toHaveBeenCalledOnce()
    expect(ref.current).toBe(screen.getByRole('button'))
  })

  it('keeps an extra class for layout alongside its own', () => {
    render(<Button className="extra">Next</Button>)

    expect(screen.getByRole('button', { name: 'Next' })).toHaveClass('extra')
  })
})
