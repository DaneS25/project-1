import type { IsoDate, MonthKey } from '@/shared/types'

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** True if `value` is a real calendar date written as `YYYY-MM-DD`. */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1) return false

  return day <= daysInMonth(year, month)
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Formats a `Date` as `YYYY-MM-DD` in local time. Uses the local date parts,
 * not `toISOString()`, which is UTC and can give yesterday's date in New
 * Zealand.
 */
export function toIsoDate(date: Date): IsoDate {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const displayDate = new Intl.DateTimeFormat('en-NZ', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/**
 * Formats a `YYYY-MM-DD` date for display, e.g. "Fri, 9 Oct 2026". Builds
 * the `Date` from numeric parts in local time; `new Date('2026-10-09')` is
 * read as UTC and can show the wrong day in New Zealand.
 */
export function formatIsoDate(date: IsoDate): string {
  const match = ISO_DATE_PATTERN.exec(date)
  if (!match || !isIsoDate(date)) {
    throw new RangeError(`Expected a YYYY-MM-DD date, got "${date}"`)
  }
  return displayDate.format(
    new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  )
}

const MONTH_KEY_PATTERN = /^\d{4}-(\d{2})$/

/** True if `value` is a real month written as `YYYY-MM`. */
export function isMonthKey(value: string): boolean {
  const month = Number(MONTH_KEY_PATTERN.exec(value)?.[1])
  return month >= 1 && month <= 12
}

/** The `YYYY-MM` month a `YYYY-MM-DD` date falls in, by slicing the text. */
export function monthOf(date: IsoDate): MonthKey {
  return date.slice(0, 7)
}

/**
 * Moves a `YYYY-MM` month by whole months (negative goes back), using
 * integer arithmetic on the year and month, e.g. ("2026-01", -1) → "2025-12".
 */
export function addMonths(month: MonthKey, delta: number): MonthKey {
  const match = MONTH_KEY_PATTERN.exec(month)
  if (!match || !isMonthKey(month) || !Number.isInteger(delta)) {
    throw new RangeError(`Expected a YYYY-MM month and whole months`)
  }
  const index = Number(month.slice(0, 4)) * 12 + Number(match[1]) - 1 + delta
  const year = Math.floor(index / 12)
  const monthNumber = index - year * 12 + 1
  return `${String(year).padStart(4, '0')}-${String(monthNumber).padStart(2, '0')}`
}

const displayMonth = new Intl.DateTimeFormat('en-NZ', {
  month: 'long',
  year: 'numeric',
})

/** Formats a `YYYY-MM` month for display, e.g. "October 2026". */
export function formatMonth(month: MonthKey): string {
  const match = MONTH_KEY_PATTERN.exec(month)
  if (!match || !isMonthKey(month)) {
    throw new RangeError(`Expected a YYYY-MM month, got "${month}"`)
  }
  // Built from numeric parts in local time, on the 1st of the month.
  return displayMonth.format(
    new Date(Number(month.slice(0, 4)), Number(match[1]) - 1, 1),
  )
}
