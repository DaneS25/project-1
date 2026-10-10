import type { Cents } from '@/shared/types'

/**
 * A share of a total as a whole percentage for display, rounded half up
 * with integer maths (so huge amounts don't lose precision): "42%". A
 * non-zero part that would round to 0 shows "<1%". A total of 0 has no
 * share and returns null, so nothing is ever divided by zero.
 */
export function formatShare(
  partCents: Cents,
  totalCents: Cents,
): string | null {
  if (totalCents === 0) return null
  const percent = roundedPercent(partCents, totalCents)
  if (percent === 0n && partCents > 0) return '<1%'
  return `${percent.toString()}%`
}

/**
 * A month-over-month change as a signed whole percentage of the previous
 * month: "+25%", "-10%", "0%". Null when the previous month had no
 * spending, since a change from nothing has no percentage.
 */
export function formatPercentChange(
  changeCents: Cents,
  previousCents: Cents,
): string | null {
  if (previousCents === 0) return null
  const percent = roundedPercent(Math.abs(changeCents), previousCents)
  if (percent === 0n) return changeCents === 0 ? '0%' : '<1%'
  return `${changeCents > 0 ? '+' : '-'}${percent.toString()}%`
}

/** round(100 * part / total), half up, for non-negative integers. */
function roundedPercent(part: Cents, total: Cents): bigint {
  const numerator = BigInt(part) * 200n + BigInt(total)
  return numerator / (BigInt(total) * 2n)
}
