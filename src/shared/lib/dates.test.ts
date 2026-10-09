import { describe, expect, it } from 'vitest'
import { isIsoDate, toIsoDate } from './dates'

describe('isIsoDate', () => {
  it.each([
    '2026-10-08',
    '2026-01-31',
    '2026-12-31',
    '2024-02-29',
    '2000-02-29',
  ])('accepts the real date %s', (value) => {
    expect(isIsoDate(value)).toBe(true)
  })

  it.each([
    ['a non-leap 29 February', '2026-02-29'],
    ['29 February in a century year', '1900-02-29'],
    ['31 April', '2026-04-31'],
    ['month 13', '2026-13-01'],
    ['month 00', '2026-00-10'],
    ['day 00', '2026-10-00'],
    ['missing zero padding', '2026-1-5'],
    ['a date-time string', '2026-10-08T00:00:00Z'],
    ['an empty string', ''],
  ])('rejects %s', (_label, value) => {
    expect(isIsoDate(value)).toBe(false)
  })
})

describe('toIsoDate', () => {
  it('formats the local date with zero padding', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('uses the local day just after midnight, not the UTC day', () => {
    expect(toIsoDate(new Date(2026, 9, 9, 0, 30))).toBe('2026-10-09')
  })

  it('produces a date that isIsoDate accepts', () => {
    expect(isIsoDate(toIsoDate(new Date(2024, 1, 29)))).toBe(true)
  })
})
