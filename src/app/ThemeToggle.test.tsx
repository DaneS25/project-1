import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { StorageLike } from '@/shared/storage/storage'
import { THEME_KEY } from '@/shared/storage/theme'
import { createTestStorage } from '@/shared/store/testStorage'
import { ThemeToggle } from './ThemeToggle'

function renderToggle(storage: StorageLike = createTestStorage().storage) {
  return render(<ThemeToggle storage={storage} />)
}

const choice = (name: string) => screen.getByRole('radio', { name })
const theme = () => document.documentElement.dataset.theme

describe('ThemeToggle', () => {
  it('is a group named Theme with System, Light and Dark', () => {
    renderToggle()

    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('radio').map((r) => r.getAttribute('value')),
    ).toEqual(['system', 'light', 'dark'])
  })

  it('defaults to System and leaves the theme to the device', () => {
    renderToggle()

    expect(choice('System')).toBeChecked()
    expect(theme()).toBeUndefined()
  })

  it.each(['Light', 'Dark'])(
    'choosing %s sets the theme and saves it',
    async (name) => {
      const { storage, items } = createTestStorage()
      renderToggle(storage)

      await userEvent.click(choice(name))

      expect(choice(name)).toBeChecked()
      expect(theme()).toBe(name.toLowerCase())
      expect(items.get(THEME_KEY)).toBe(name.toLowerCase())
    },
  )

  it('going back to System removes the override and saves it', async () => {
    const { storage, items } = createTestStorage({ [THEME_KEY]: 'dark' })
    renderToggle(storage)

    await userEvent.click(choice('System'))

    expect(theme()).toBeUndefined()
    expect(items.get(THEME_KEY)).toBe('system')
  })

  it('restores the saved choice after a reload', async () => {
    const { storage } = createTestStorage()
    const { unmount } = renderToggle(storage)
    await userEvent.click(choice('Dark'))
    unmount()

    renderToggle(storage)

    expect(choice('Dark')).toBeChecked()
    expect(theme()).toBe('dark')
  })

  it('falls back to System for a bad saved value', () => {
    renderToggle(createTestStorage({ [THEME_KEY]: 'sepia' }).storage)

    expect(choice('System')).toBeChecked()
    expect(theme()).toBeUndefined()
  })

  it('still switches theme when storage is blocked', async () => {
    renderToggle(createTestStorage({}, { blocked: true }).storage)

    await userEvent.click(choice('Light'))

    expect(theme()).toBe('light')
  })

  it('moves between choices with the arrow keys', async () => {
    renderToggle()
    await userEvent.click(choice('System'))

    await userEvent.keyboard('{ArrowRight}')

    expect(choice('Light')).toBeChecked()
    expect(choice('Light')).toHaveFocus()
    expect(theme()).toBe('light')
  })
})
