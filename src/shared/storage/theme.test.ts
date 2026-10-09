import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createTestStorage } from '@/shared/store/testStorage'
import {
  THEME_KEY,
  isThemePreference,
  loadThemePreference,
  saveThemePreference,
} from './theme'

describe('loadThemePreference', () => {
  it('defaults to System when nothing is saved', () => {
    expect(loadThemePreference(createTestStorage().storage)).toBe('system')
  })

  it.each(['system', 'light', 'dark'] as const)('reads a saved %s', (value) => {
    const { storage } = createTestStorage({ [THEME_KEY]: value })

    expect(loadThemePreference(storage)).toBe(value)
  })

  it.each(['', 'Dark', 'blue', '"dark"', 'null'])(
    'falls back to System for the invalid value "%s"',
    (value) => {
      const { storage } = createTestStorage({ [THEME_KEY]: value })

      expect(loadThemePreference(storage)).toBe('system')
    },
  )

  it('falls back to System when storage is blocked', () => {
    const { storage } = createTestStorage({}, { blocked: true })

    expect(loadThemePreference(storage)).toBe('system')
  })
})

describe('saveThemePreference', () => {
  it('saves the choice under its own key', () => {
    const { storage, items } = createTestStorage()

    expect(saveThemePreference('dark', storage)).toEqual({ ok: true })
    expect(items.get(THEME_KEY)).toBe('dark')
  })

  it('reports a failed save instead of throwing', () => {
    const { storage } = createTestStorage({}, { failingKeys: [THEME_KEY] })

    expect(saveThemePreference('light', storage)).toMatchObject({ ok: false })
  })
})

describe('isThemePreference', () => {
  it('accepts only the three choices', () => {
    expect(
      ['system', 'light', 'dark', 'auto', 1].map(isThemePreference),
    ).toEqual([true, true, true, false, false])
  })
})

describe('the inline script in index.html', () => {
  // It reads storage before React loads, so it can't import THEME_KEY.
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

  it('reads the same key as theme.ts', () => {
    expect(html).toContain(`localStorage.getItem('${THEME_KEY}')`)
  })

  it('only applies the Light and Dark values', () => {
    expect(html).toContain("theme === 'light' || theme === 'dark'")
  })
})
