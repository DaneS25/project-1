import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PALETTE_KEY } from '@/shared/storage/palette'
import type { StorageLike } from '@/shared/storage/storage'
import { createTestStorage } from '@/shared/store/testStorage'
import { PaletteToggle } from './PaletteToggle'

function renderToggle(storage: StorageLike = createTestStorage().storage) {
  return render(<PaletteToggle storage={storage} />)
}

const toggle = () => screen.getByRole('button', { name: 'Pink theme' })
const palette = () => document.documentElement.dataset.palette

describe('PaletteToggle', () => {
  it('defaults to sunset: not pressed and no palette attribute', () => {
    renderToggle()

    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    expect(palette()).toBeUndefined()
  })

  it('turning it on sets the pink palette and saves it', async () => {
    const { storage, items } = createTestStorage()
    renderToggle(storage)

    await userEvent.click(toggle())

    expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    expect(palette()).toBe('pink')
    expect(items.get(PALETTE_KEY)).toBe('pink')
  })

  it('turning it off goes back to sunset and saves it', async () => {
    const { storage, items } = createTestStorage({ [PALETTE_KEY]: 'pink' })
    renderToggle(storage)

    await userEvent.click(toggle())

    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    expect(palette()).toBeUndefined()
    expect(items.get(PALETTE_KEY)).toBe('sunset')
  })

  it('restores the saved palette after a reload', async () => {
    const { storage } = createTestStorage()
    const { unmount } = renderToggle(storage)
    await userEvent.click(toggle())
    unmount()

    renderToggle(storage)

    expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    expect(palette()).toBe('pink')
  })

  it('falls back to sunset for a bad saved value', () => {
    renderToggle(createTestStorage({ [PALETTE_KEY]: 'magenta' }).storage)

    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    expect(palette()).toBeUndefined()
  })

  it('still switches palette when storage is blocked', async () => {
    renderToggle(createTestStorage({}, { blocked: true }).storage)

    await userEvent.click(toggle())

    expect(palette()).toBe('pink')
  })

  it('works from the keyboard', async () => {
    renderToggle()
    await userEvent.tab()
    expect(toggle()).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(palette()).toBe('pink')

    await userEvent.keyboard(' ')
    expect(palette()).toBeUndefined()
  })

  it('leaves the light or dark theme alone', async () => {
    document.documentElement.dataset.theme = 'dark'
    renderToggle()

    await userEvent.click(toggle())

    expect(document.documentElement.dataset.theme).toBe('dark')
    delete document.documentElement.dataset.theme
  })
})
