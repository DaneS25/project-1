import { describe, expect, it } from 'vitest'
import { donutSegments, SLICE_GAP, sliceColour } from './donut'

describe('donutSegments', () => {
  it('gives a single amount the whole ring, with no gap', () => {
    expect(donutSegments([500], 500)).toEqual([{ start: 0, length: 100 }])
  })

  it('places slices one after another by share, with a gap between', () => {
    const [a, b] = donutSegments([750, 250], 1000)

    expect(a?.start).toBeCloseTo(SLICE_GAP / 2)
    expect(a?.length).toBeCloseTo(75 - SLICE_GAP)
    expect(b?.start).toBeCloseTo(75 + SLICE_GAP / 2)
    expect(b?.length).toBeCloseTo(25 - SLICE_GAP)
  })

  it('keeps a tiny amount visible as a sliver', () => {
    const [, tiny] = donutSegments([99999, 1], 100000)

    expect(tiny?.length).toBeGreaterThan(0)
  })

  it('draws nothing for a total of 0', () => {
    expect(donutSegments([], 0)).toEqual([])
  })
})

describe('sliceColour', () => {
  it('steps through the six chart colours, then repeats', () => {
    expect([0, 1, 5, 6].map(sliceColour)).toEqual([
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-6)',
      'var(--chart-1)',
    ])
  })
})
