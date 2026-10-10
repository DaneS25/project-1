import type { Cents } from '@/shared/types'
import type { MonthTotal } from './insights'

export type NiceScale = {
  /** The top of the axis, a whole number of steps at or above the maximum. */
  topCents: Cents
  stepCents: Cents
  /** Tick values from 0 to the top, in cents. */
  ticks: Cents[]
}

/**
 * A round axis for amounts up to `maxCents`: steps of 1, 2 or 5 times a
 * power of ten (in cents, so $1, $2, $5, $10, ...), about four of them.
 * Integer maths only. An all-zero chart still gets a $1 axis.
 */
export function niceScale(maxCents: Cents, targetSteps = 4): NiceScale {
  const rough = Math.max(1, Math.ceil(maxCents / targetSteps))
  let magnitude = 1
  while (magnitude * 10 <= rough) magnitude *= 10
  const multiple = [1, 2, 5, 10].find((m) => m * magnitude >= rough) ?? 10
  const stepCents = Math.max(multiple * magnitude, maxCents === 0 ? 100 : 1)
  const steps = Math.max(1, Math.ceil(maxCents / stepCents))
  const ticks = Array.from({ length: steps + 1 }, (_, i) => i * stepCents)
  return { topCents: steps * stepCents, stepCents, ticks }
}

/**
 * Runs of consecutive months that have a budget, as index ranges, so the
 * budget line is drawn only where budgets exist and breaks across months
 * without one.
 */
export function budgetRuns(
  totals: readonly MonthTotal[],
): { from: number; to: number }[] {
  const runs: { from: number; to: number }[] = []
  totals.forEach((total, index) => {
    if (total.budgetCents === 0) return
    const last = runs.at(-1)
    if (last?.to === index - 1) last.to = index
    else runs.push({ from: index, to: index })
  })
  return runs
}
