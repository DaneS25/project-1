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

  describe('sun flare', () => {
    function renderPrimary(onClick = vi.fn()) {
      render(
        <Button variant="primary" onClick={onClick}>
          Add transaction
        </Button>,
      )
      const button = screen.getByRole('button', { name: 'Add transaction' })
      // jsdom has no layout, so give the button a box to measure.
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ x: 100, y: 50, width: 160, height: 44 }),
      )
      return { button, onClick }
    }

    it('bursts from where the pointer clicked', async () => {
      const { button } = renderPrimary()

      await userEvent.pointer({
        keys: '[MouseLeft]',
        target: button,
        coords: { clientX: 130, clientY: 60 },
      })

      expect(button.style.getPropertyValue('--flare-x')).toBe('30px')
      expect(button.style.getPropertyValue('--flare-y')).toBe('10px')
      expect(button).toHaveAttribute('data-flare')
    })

    it('bursts from the centre when pressed with Enter or Space', async () => {
      const { button } = renderPrimary()
      button.focus()

      await userEvent.keyboard('{Enter}')
      expect(button.style.getPropertyValue('--flare-x')).toBe('80px')
      expect(button.style.getPropertyValue('--flare-y')).toBe('22px')

      button.style.removeProperty('--flare-x')
      await userEvent.keyboard(' ')
      expect(button.style.getPropertyValue('--flare-x')).toBe('80px')
    })

    it('restarts on every click', async () => {
      const { button } = renderPrimary()

      await userEvent.click(button)
      const first = button.dataset.flare
      await userEvent.click(button)

      expect(button.dataset.flare).not.toBe(first)
    })

    it('runs the action straight away, with nothing waiting on the glow', async () => {
      let flareWhenClicked: string | undefined
      const onClick = vi.fn(() => {
        flareWhenClicked = button.dataset.flare
      })
      const { button } = renderPrimary(onClick)

      await userEvent.click(button)

      expect(onClick).toHaveBeenCalledOnce()
      expect(flareWhenClicked).toBeDefined()
    })

    it('is only on primary buttons', async () => {
      render(<Button variant="secondary">Cancel</Button>)
      const button = screen.getByRole('button', { name: 'Cancel' })

      await userEvent.click(button)

      expect(button).not.toHaveAttribute('data-flare')
    })
  })
})
