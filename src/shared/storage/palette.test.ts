import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createTestStorage } from '@/shared/store/testStorage'
import { PALETTE_KEY, isPalette, loadPalette, savePalette } from './palette'

describe('loadPalette', () => {
  it('defaults to sunset when nothing is saved', () => {
    expect(loadPalette(createTestStorage().storage)).toBe('sunset')
  })

  it.each(['sunset', 'pink'] as const)('reads a saved %s', (value) => {
    const { storage } = createTestStorage({ [PALETTE_KEY]: value })

    expect(loadPalette(storage)).toBe(value)
  })

  it.each(['', 'Pink', 'rose', '"pink"', 'null'])(
    'falls back to sunset for the invalid value "%s"',
    (value) => {
      const { storage } = createTestStorage({ [PALETTE_KEY]: value })

      expect(loadPalette(storage)).toBe('sunset')
    },
  )

  it('falls back to sunset when storage is blocked', () => {
    const { storage } = createTestStorage({}, { blocked: true })

    expect(loadPalette(storage)).toBe('sunset')
  })
})

describe('savePalette', () => {
  it('saves the palette under its own key', () => {
    const { storage, items } = createTestStorage()

    expect(savePalette('pink', storage)).toEqual({ ok: true })
    expect(items.get(PALETTE_KEY)).toBe('pink')
  })

  it('reports a failed save instead of throwing', () => {
    const { storage } = createTestStorage({}, { failingKeys: [PALETTE_KEY] })

    expect(savePalette('pink', storage)).toMatchObject({ ok: false })
  })
})

describe('isPalette', () => {
  it('accepts only sunset and pink', () => {
    expect(['sunset', 'pink', 'blue', 1].map(isPalette)).toEqual([
      true,
      true,
      false,
      false,
    ])
  })
})

describe('the inline script in index.html', () => {
  // It reads storage before React loads, so it can't import PALETTE_KEY.
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

  it('reads the same key as palette.ts', () => {
    expect(html).toContain(`localStorage.getItem('${PALETTE_KEY}')`)
  })

  it('only applies the pink value', () => {
    expect(html).toContain("palette === 'pink'")
  })
})
