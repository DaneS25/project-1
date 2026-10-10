import { describe, expect, it } from 'vitest'
import { formatPercentChange, formatShare } from './format'

describe('formatShare', () => {
  it.each([
    [42, 100, '42%'],
    [1, 3, '33%'],
    [2, 3, '67%'],
    [1, 8, '13%'],
    [100, 100, '100%'],
    [0, 100, '0%'],
  ])('shows %i of %i as %s', (part, total, text) => {
    expect(formatShare(part, total)).toBe(text)
  })

  it('rounds half up', () => {
    expect(formatShare(1, 200)).toBe('1%')
    expect(formatShare(5, 1000)).toBe('1%')
  })

  it('shows a tiny but real share as <1%', () => {
    expect(formatShare(1, 1000)).toBe('<1%')
  })

  it('gives no share of a total of 0', () => {
    expect(formatShare(0, 0)).toBeNull()
  })

  it('stays exact for amounts near the safe-integer limit', () => {
    const max = Number.MAX_SAFE_INTEGER
    expect(formatShare(max - 1, max)).toBe('100%')
    expect(formatShare(Math.floor(max / 2), max)).toBe('50%')
  })
})

describe('formatPercentChange', () => {
  it.each([
    [250, 1000, '+25%'],
    [-600, 1000, '-60%'],
    [0, 1000, '0%'],
    [1000, 1000, '+100%'],
    [1, 1000, '<1%'],
  ])('shows a change of %i on %i as %s', (change, previous, text) => {
    expect(formatPercentChange(change, previous)).toBe(text)
  })

  it('gives no percentage when the previous month had no spending', () => {
    expect(formatPercentChange(500, 0)).toBeNull()
  })
})
