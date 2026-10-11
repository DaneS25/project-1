import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePalette } from './usePalette'

const root = document.documentElement

afterEach(() => {
  delete root.dataset.palette
})

describe('usePalette', () => {
  it('is sunset when <html> has no palette attribute', () => {
    const { result } = renderHook(() => usePalette())

    expect(result.current).toBe('sunset')
  })

  it('is pink when <html> has data-palette="pink"', () => {
    root.dataset.palette = 'pink'

    const { result } = renderHook(() => usePalette())

    expect(result.current).toBe('pink')
  })

  it('treats an unknown palette value as sunset', () => {
    root.dataset.palette = 'neon'

    const { result } = renderHook(() => usePalette())

    expect(result.current).toBe('sunset')
  })

  it('follows the attribute when it changes', async () => {
    const { result } = renderHook(() => usePalette())

    await act(async () => {
      root.dataset.palette = 'pink'
      await Promise.resolve()
    })
    expect(result.current).toBe('pink')

    await act(async () => {
      delete root.dataset.palette
      await Promise.resolve()
    })
    expect(result.current).toBe('sunset')
  })
})
