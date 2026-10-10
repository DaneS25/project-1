import type { Cents } from '@/shared/types'

/** Where a slice sits on the ring, in percent of the circle (0 to 100). */
export type DonutSegment = { start: number; length: number }

/** The gap left between neighbouring slices, in percent of the circle. */
export const SLICE_GAP = 0.8

/**
 * Lays out donut slices for amounts in cents. Each slice's length is its
 * share of the total; floats are fine here because this is only geometry
 * (the amounts and their shown percentages stay exact elsewhere). With more
 * than one slice, a small gap separates neighbours, but a slice never
 * shrinks below a sliver so a tiny amount stays visible.
 */
export function donutSegments(
  amountsCents: readonly Cents[],
  totalCents: Cents,
): DonutSegment[] {
  if (totalCents <= 0) return []
  const gap = amountsCents.length > 1 ? SLICE_GAP : 0
  let start = 0
  return amountsCents.map((amount) => {
    const share = (amount / totalCents) * 100
    const segment = {
      start: start + gap / 2,
      length: Math.max(share - gap, Math.min(share, 0.4)),
    }
    start += share
    return segment
  })
}

/** The chart colour token for the slice at `index` (six, then repeating). */
export function sliceColour(index: number): string {
  return `var(--chart-${String((index % 6) + 1)})`
}
