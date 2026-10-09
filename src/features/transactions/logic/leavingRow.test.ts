import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/shared/types'
import { withLeavingRow } from './leavingRow'

const t = (id: string): Transaction => ({
  id,
  amountCents: 100,
  date: '2026-10-09',
  categoryId: 'c1',
})
const ids = (rows: Transaction[]) => rows.map((row) => row.id)

describe('withLeavingRow', () => {
  it('returns the rows unchanged when nothing is leaving', () => {
    expect(ids(withLeavingRow([t('a'), t('b')], null))).toEqual(['a', 'b'])
  })

  it('puts the leaving row back where it was', () => {
    const rows = withLeavingRow([t('a'), t('c')], {
      transaction: t('b'),
      index: 1,
    })

    expect(ids(rows)).toEqual(['a', 'b', 'c'])
  })

  it('handles the first and last positions', () => {
    expect(
      ids(withLeavingRow([t('b')], { transaction: t('a'), index: 0 })),
    ).toEqual(['a', 'b'])
    expect(
      ids(withLeavingRow([t('a')], { transaction: t('b'), index: 1 })),
    ).toEqual(['a', 'b'])
  })

  it('keeps an out-of-range position inside the list', () => {
    expect(
      ids(withLeavingRow([t('a')], { transaction: t('z'), index: 9 })),
    ).toEqual(['a', 'z'])
  })

  it('shows the last row fading out even when the list is now empty', () => {
    expect(ids(withLeavingRow([], { transaction: t('a'), index: 0 }))).toEqual([
      'a',
    ])
  })

  it('never shows a row twice', () => {
    expect(
      ids(withLeavingRow([t('a')], { transaction: t('a'), index: 0 })),
    ).toEqual(['a'])
  })
})
