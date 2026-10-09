import type { Cents, Result } from '@/shared/types'

/** Why an amount the user typed was rejected. */
export type AmountError =
  | 'empty'
  | 'invalid'
  | 'badGrouping'
  | 'tooManyDecimals'
  | 'notPositive'
  | 'tooLarge'

// Optional minus and dollar sign (either order), then digits and commas,
// then an optional decimal point and digits. Anything else is invalid,
// which rules out letters, "NaN", "Infinity", exponents and inner spaces.
const AMOUNT_PATTERN =
  /^(?<minus>-?)\$?(?<minusAfterSign>-?)(?<whole>[\d,]*)(?:\.(?<fraction>\d*))?$/
const GROUPED_THOUSANDS = /^\d{1,3}(?:,\d{3})+$/
const MAX_SAFE_CENTS = BigInt(Number.MAX_SAFE_INTEGER)

/**
 * Parses what the user typed (e.g. "12.5", "$1,234.56") into a positive
 * whole number of cents. Never uses floating-point maths: the dollar and
 * cent digits are combined as integers, so "0.29" is exactly 29.
 */
export function parseAmountToCents(input: string): Result<Cents, AmountError> {
  const text = input.trim()
  if (text === '') return fail('empty')

  const groups = AMOUNT_PATTERN.exec(text)?.groups
  if (!groups) return fail('invalid')
  const { minus, minusAfterSign, whole = '', fraction } = groups
  if (minus && minusAfterSign) return fail('invalid')
  if (whole === '' && !fraction) return fail('invalid')

  if (whole.includes(',') && !GROUPED_THOUSANDS.test(whole)) {
    return fail('badGrouping')
  }
  if (fraction !== undefined && fraction.length > 2) {
    return fail('tooManyDecimals')
  }

  const cents =
    BigInt(whole.replaceAll(',', '') || '0') * 100n +
    BigInt((fraction ?? '').padEnd(2, '0'))
  if (minus || minusAfterSign || cents === 0n) return fail('notPositive')
  if (cents > MAX_SAFE_CENTS) return fail('tooLarge')

  return { ok: true, value: Number(cents) }
}

const nzd = new Intl.NumberFormat('en-NZ', {
  style: 'currency',
  currency: 'NZD',
})

/**
 * Formats cents for display, e.g. 123456 → "$1,234.56" and -500 → "-$5.00".
 * The amount is passed to Intl as an exact decimal string, not cents / 100,
 * so large values aren't rounded by floating-point division.
 */
export function formatCents(cents: Cents): string {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Cents must be a safe integer, got ${String(cents)}`)
  }
  const digits = String(Math.abs(cents)).padStart(3, '0')
  const sign = cents < 0 ? '-' : ''
  const decimal = `${sign}${digits.slice(0, -2)}.${digits.slice(-2)}`
  if (!isDecimalString(decimal)) {
    throw new Error(`Could not format ${String(cents)} cents`)
  }
  return nzd.format(decimal)
}

function isDecimalString(value: string): value is Intl.StringNumericLiteral {
  return /^-?\d+\.\d{2}$/.test(value)
}

function fail(error: AmountError): Result<Cents, AmountError> {
  return { ok: false, error }
}
