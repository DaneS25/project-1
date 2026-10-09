import { describe, expect, it } from 'vitest'
import {
  addMonths,
  formatIsoDate,
  formatMonth,
  isIsoDate,
  isMonthKey,
  monthOf,
  toIsoDate,
} from './dates'

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

describe('formatIsoDate', () => {
  it('shows the same calendar day that was stored', () => {
    expect(formatIsoDate('2026-10-09')).toMatch(/9 Oct 2026/)
  })

  it('includes the weekday', () => {
    expect(formatIsoDate('2026-10-09')).toMatch(/^Fri/)
  })

  it('handles the first day of the year', () => {
    expect(formatIsoDate('2026-01-01')).toMatch(/1 Jan 2026/)
  })

  it('throws for a value that is not a real date', () => {
    expect(() => formatIsoDate('2026-02-30')).toThrow(RangeError)
  })
})

describe('isMonthKey', () => {
  it.each(['2026-10', '2026-01', '2026-12', '0001-01'])(
    'accepts %s',
    (value) => {
      expect(isMonthKey(value)).toBe(true)
    },
  )

  it.each([
    '2026-00',
    '2026-13',
    '2026-1',
    '26-10',
    '2026-10-09',
    '',
    'abcd-ef',
  ])('rejects "%s"', (value) => {
    expect(isMonthKey(value)).toBe(false)
  })
})

describe('monthOf', () => {
  it.each([
    ['2026-10-01', '2026-10'],
    ['2026-10-31', '2026-10'],
    ['2026-12-31', '2026-12'],
    ['2027-01-01', '2027-01'],
  ])('puts %s in %s', (date, month) => {
    expect(monthOf(date)).toBe(month)
  })
})

describe('addMonths', () => {
  it.each([
    ['2026-10', 1, '2026-11'],
    ['2026-10', -1, '2026-09'],
    ['2026-12', 1, '2027-01'],
    ['2026-01', -1, '2025-12'],
    ['2026-10', 0, '2026-10'],
    ['2026-10', 15, '2028-01'],
    ['2026-10', -22, '2024-12'],
  ])('moves %s by %i to %s', (month, delta, expected) => {
    expect(addMonths(month, delta)).toBe(expected)
  })

  it('throws for an invalid month', () => {
    expect(() => addMonths('2026-13', 1)).toThrow(RangeError)
  })
})

describe('formatMonth', () => {
  it.each([
    ['2026-10', 'October 2026'],
    ['2027-01', 'January 2027'],
    ['2025-12', 'December 2025'],
  ])('formats %s as "%s"', (month, text) => {
    expect(formatMonth(month)).toBe(text)
  })

  it('throws for an invalid month', () => {
    expect(() => formatMonth('2026-00')).toThrow(RangeError)
  })
})
