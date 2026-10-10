import { describe, expect, it } from 'vitest'
import { formatAxisAmount } from './format'
import type { MonthTotal } from './insights'
import { budgetRuns, niceScale } from './trend'

describe('niceScale', () => {
  it.each([
    // max cents, step, top
    [200000, 50000, 200000],
    [210000, 100000, 300000],
    [123456, 50000, 150000],
    [9999, 5000, 10000],
    [45, 20, 60],
    [1, 1, 1],
  ])(
    'scales a maximum of %i cents with a step of %i up to %i',
    (max, step, top) => {
      const scale = niceScale(max)
      expect(scale.stepCents).toBe(step)
      expect(scale.topCents).toBe(top)
      expect(scale.topCents).toBeGreaterThanOrEqual(max)
    },
  )

  it('lists ticks from 0 to the top in whole steps', () => {
    expect(niceScale(210000).ticks).toEqual([0, 100000, 200000, 300000])
  })

  it('gives an all-zero chart a $1 axis', () => {
    expect(niceScale(0)).toEqual({
      topCents: 100,
      stepCents: 100,
      ticks: [0, 100],
    })
  })

  it('uses only 1, 2 or 5 times a power of ten', () => {
    for (const max of [7, 333, 98765, 4321000, 77777777]) {
      const { stepCents } = niceScale(max)
      const lead = Number(String(stepCents)[0])
      expect([1, 2, 5]).toContain(lead)
      expect(String(stepCents).slice(1)).toMatch(/^0*$/)
    }
  })
})

describe('budgetRuns', () => {
  const total = (budgetCents: number): MonthTotal => ({
    month: '2026-10',
    spentCents: 0,
    budgetCents,
  })

  it('groups consecutive months that have a budget', () => {
    expect(
      budgetRuns([total(0), total(500), total(500), total(0), total(700)]),
    ).toEqual([
      { from: 1, to: 2 },
      { from: 4, to: 4 },
    ])
  })

  it('has no runs when no month has a budget', () => {
    expect(budgetRuns([total(0), total(0)])).toEqual([])
  })

  it('is one run when every month has a budget', () => {
    expect(budgetRuns([total(1), total(2), total(3)])).toEqual([
      { from: 0, to: 2 },
    ])
  })
})

describe('formatAxisAmount', () => {
  it.each([
    [0, '$0'],
    [100000, '$1,000'],
    [150000000, '$1,500,000'],
    [50, '$0.50'],
    [120, '$1.20'],
  ])('shows %i cents as %s', (cents, text) => {
    expect(formatAxisAmount(cents)).toBe(text)
  })
})
