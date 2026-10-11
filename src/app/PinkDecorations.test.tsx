import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '@/app/App'
import { PALETTE_KEY } from '@/shared/storage/palette'

const TODAY = '2026-10-11'
const ROLES = ['heading', 'region', 'button', 'img', 'status'] as const

const decorations = () =>
  document.querySelectorAll('[data-decoration="pink"], [data-icon]')

/** How many elements a screen reader can reach, per role. */
const roleCounts = () => ROLES.map((role) => screen.queryAllByRole(role).length)

/** Heading and region names, read before any decoration exists. */
const visibleNames = () =>
  screen.getAllByRole('heading').map((heading) => heading.textContent)

afterEach(() => {
  delete document.documentElement.dataset.palette
})

describe('pink mode decorations', () => {
  it('shows none in sunset mode', () => {
    render(<App today={TODAY} />)

    expect(decorations()).toHaveLength(0)
  })

  it('appear when pink is turned on and go when it is turned off', async () => {
    const user = userEvent.setup()
    render(<App today={TODAY} />)
    const toggle = screen.getByRole('button', { name: 'Pink theme' })

    await user.click(toggle)
    expect(decorations().length).toBeGreaterThan(0)
    expect(document.querySelector('[data-icon="flower"]')).toBeInTheDocument()
    expect(screen.getByText('🎀')).toBeInTheDocument()

    await user.click(toggle)
    expect(decorations()).toHaveLength(0)
  })

  it('are all hidden from assistive tech', () => {
    localStorage.setItem(PALETTE_KEY, 'pink')
    document.documentElement.dataset.palette = 'pink'
    render(<App today={TODAY} />)

    const found = Array.from(decorations())
    expect(found.length).toBeGreaterThan(0)
    for (const element of found) {
      expect(element.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('add nothing to the accessibility tree', () => {
    const { unmount } = render(<App today={TODAY} />)
    const sunsetCounts = roleCounts()
    const names = visibleNames()
    unmount()

    localStorage.setItem(PALETTE_KEY, 'pink')
    document.documentElement.dataset.palette = 'pink'
    render(<App today={TODAY} />)

    expect(roleCounts()).toEqual(sunsetCounts)
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    for (const name of names) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    expect(
      screen.getByRole('region', { name: 'Categories' }),
    ).toBeInTheDocument()
  })
})
