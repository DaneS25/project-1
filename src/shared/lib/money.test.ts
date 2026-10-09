import { describe, expect, it } from 'vitest'
import { centsToAmountInput, formatCents, parseAmountToCents } from './money'

/** Parses and returns the cents, failing the test if parsing failed. */
function cents(input: string): number {
  const result = parseAmountToCents(input)
  if (!result.ok)
    throw new Error(`Expected "${input}" to parse: ${result.error}`)
  return result.value
}

function errorFor(input: string) {
  const result = parseAmountToCents(input)
  return result.ok ? null : result.error
}

describe('parseAmountToCents', () => {
  describe('accepts', () => {
    it.each([
      ['12', 1200],
      ['12.5', 1250],
      ['12.50', 1250],
      ['12.', 1200],
      ['.5', 50],
      ['0.01', 1],
      ['$12.50', 1250],
      ['1,234', 123400],
      ['1,234.56', 123456],
      ['12,345,678.90', 1234567890],
      ['007.50', 750],
      ['  42.10  ', 4210],
    ])('"%s" as %i cents', (input, expected) => {
      expect(parseAmountToCents(input)).toEqual({ ok: true, value: expected })
    })
  })

  describe('rejects zero, negative and NaN values', () => {
    it.each(['0', '0.00', '.0', '$0', '-0', '0,000'])('zero: "%s"', (input) => {
      expect(errorFor(input)).toBe('notPositive')
    })

    it.each(['-5', '-0.01', '-$5', '$-5', '-1,234.50'])(
      'negative: "%s"',
      (input) => {
        expect(errorFor(input)).toBe('notPositive')
      },
    )

    it.each([
      'NaN',
      'Infinity',
      '-Infinity',
      'abc',
      '12abc',
      '1e3',
      '0x10',
      '1.2.3',
      '1 000',
      '--5',
      '-$-5',
      '+5',
      '$',
      '.',
      '-',
    ])('not a number: "%s"', (input) => {
      expect(errorFor(input)).toBe('invalid')
    })
  })

  describe('rejects more than two decimal places', () => {
    it.each(['1.234', '0.001', '1.230', '12.999', '1,234.567'])(
      '"%s"',
      (input) => {
        expect(errorFor(input)).toBe('tooManyDecimals')
      },
    )
  })

  describe('rejects thousands separators in odd places', () => {
    it.each([
      '1,23',
      '12,34',
      '1,2345',
      '1234,567',
      ',123',
      '123,',
      '1,,234',
      '12,34,567',
      '1,234,56',
      ',',
      '1,234.5,6',
    ])('"%s"', (input) => {
      expect(errorFor(input)).toMatch(/^(badGrouping|invalid)$/)
    })

    it('reports misplaced commas as a grouping problem', () => {
      expect(errorFor('12,34')).toBe('badGrouping')
    })
  })

  describe('rejects empty or whitespace-only input', () => {
    it.each(['', ' ', '   ', '\t', '\n', ' \t\n '])('%j', (input) => {
      expect(errorFor(input)).toBe('empty')
    })
  })

  describe('rounding edge cases', () => {
    // Each of these is wrong with float maths: Number(input) * 100.
    it.each([
      ['0.29', 29], // 0.29 * 100 = 28.999999999999996
      ['4.35', 435], // 4.35 * 100 = 434.99999999999994
      ['0.07', 7], // 0.07 * 100 = 7.000000000000001
      ['1.15', 115], // 1.15 * 100 = 114.99999999999999
      ['19.99', 1999],
      ['1,005.10', 100510],
    ])('parses "%s" to exactly %i cents', (input, expected) => {
      expect(cents(input)).toBe(expected)
    })

    it('adds 0.1 and 0.2 to exactly 0.3', () => {
      expect(0.1 + 0.2).not.toBe(0.3) // the float problem integer cents avoid
      expect(cents('0.1') + cents('0.2')).toBe(cents('0.3'))
      expect(formatCents(cents('0.1') + cents('0.2'))).toBe('$0.30')
    })

    it('sums many small amounts without drift', () => {
      const total = Array.from({ length: 1000 }, () => cents('0.10')).reduce(
        (sum, value) => sum + value,
        0,
      )

      expect(total).toBe(10000)
      expect(formatCents(total)).toBe('$100.00')
    })
  })

  describe('large amounts near the safe-integer limit', () => {
    // Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991 cents
    it('accepts the largest safe amount exactly', () => {
      expect(cents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER)
      expect(cents('90,071,992,547,409.91')).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('accepts one cent below the limit', () => {
      expect(cents('90071992547409.90')).toBe(Number.MAX_SAFE_INTEGER - 1)
    })

    it.each([
      '90071992547409.92',
      '90071992547410',
      '100000000000000',
      '99999999999999999999999',
    ])('rejects "%s" as too large', (input) => {
      expect(errorFor(input)).toBe('tooLarge')
    })
  })
})

describe('formatCents', () => {
  it.each([
    [0, '$0.00'],
    [1, '$0.01'],
    [99, '$0.99'],
    [100, '$1.00'],
    [1250, '$12.50'],
    [123456, '$1,234.56'],
    [123456789, '$1,234,567.89'],
    [-1, '-$0.01'],
    [-500, '-$5.00'],
  ])('formats %i cents as %s', (value, expected) => {
    expect(formatCents(value)).toBe(expected)
  })

  it('formats the largest safe amount exactly', () => {
    // Float division would print $90,071,992,547,409.90
    expect(formatCents(Number.MAX_SAFE_INTEGER)).toBe('$90,071,992,547,409.91')
    expect(formatCents(-Number.MAX_SAFE_INTEGER)).toBe(
      '-$90,071,992,547,409.91',
    )
  })

  it('round-trips with parseAmountToCents', () => {
    for (const value of [1, 29, 435, 123456, Number.MAX_SAFE_INTEGER]) {
      expect(cents(formatCents(value))).toBe(value)
    }
  })

  it.each([1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'throws for %s, which is not a safe whole number of cents',
    (value) => {
      expect(() => formatCents(value)).toThrow(RangeError)
    },
  )
})

describe('centsToAmountInput', () => {
  it.each([
    [1250, '12.50'],
    [5, '0.05'],
    [100, '1.00'],
    [123456789, '1234567.89'],
    [0, '0.00'],
  ])('turns %i cents into "%s"', (cents, text) => {
    expect(centsToAmountInput(cents)).toBe(text)
  })

  it('round-trips through parseAmountToCents', () => {
    for (const cents of [1, 29, 1250, Number.MAX_SAFE_INTEGER]) {
      expect(parseAmountToCents(centsToAmountInput(cents))).toEqual({
        ok: true,
        value: cents,
      })
    }
  })

  it('throws for a value that is not a non-negative whole number of cents', () => {
    expect(() => centsToAmountInput(-1)).toThrow(RangeError)
    expect(() => centsToAmountInput(1.5)).toThrow(RangeError)
  })
})
