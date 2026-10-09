import { describe, expect, it } from 'vitest'
import { canAnimateExit } from './motion'

const host = (reduce: boolean) => ({
  matchMedia: (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' && reduce,
  }),
})

describe('canAnimateExit', () => {
  it('allows the exit animation when motion is fine', () => {
    expect(canAnimateExit(host(false))).toBe(true)
  })

  it('skips it when the user prefers reduced motion', () => {
    expect(canAnimateExit(host(true))).toBe(false)
  })

  it('skips it when the preference can’t be detected', () => {
    expect(canAnimateExit({})).toBe(false)
  })
})
