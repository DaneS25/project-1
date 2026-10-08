import { describe, expect, it } from 'vitest'
import { parseAppData } from './validate'

const groceries = { id: 'c1', name: 'Groceries', monthlyBudgetCents: 60000 }
const lunch = {
  id: 't1',
  amountCents: 1250,
  date: '2026-10-08',
  categoryId: 'c1',
  note: 'Lunch',
}

function withTransaction(transaction: unknown) {
  return { categories: [groceries], transactions: [transaction] }
}

function withCategory(category: unknown) {
  return { categories: [category], transactions: [] }
}

describe('parseAppData', () => {
  it('accepts valid data', () => {
    const data = { categories: [groceries], transactions: [lunch] }

    expect(parseAppData(data)).toEqual({ ok: true, value: data })
  })

  it('accepts empty lists', () => {
    expect(parseAppData({ categories: [], transactions: [] })).toEqual({
      ok: true,
      value: { categories: [], transactions: [] },
    })
  })

  it('leaves out the note key when a transaction has no note', () => {
    const withoutNote = {
      id: 't1',
      amountCents: 1250,
      date: '2026-10-08',
      categoryId: 'c1',
    }
    const result = parseAppData(withTransaction(withoutNote))
    const transaction = result.ok ? result.value.transactions[0] : undefined

    expect(transaction).toEqual(withoutNote)
    expect(transaction && 'note' in transaction).toBe(false)
  })

  it('drops unknown fields', () => {
    const result = parseAppData({
      categories: [{ ...groceries, colour: 'green' }],
      transactions: [{ ...lunch, extra: true }],
      somethingElse: 1,
    })

    expect(result).toEqual({
      ok: true,
      value: { categories: [groceries], transactions: [lunch] },
    })
  })

  it('accepts a category with a zero budget', () => {
    expect(
      parseAppData(withCategory({ ...groceries, monthlyBudgetCents: 0 })).ok,
    ).toBe(true)
  })

  it.each([
    ['null', null],
    ['an array', []],
    ['missing transactions', { categories: [] }],
    ['categories that is not an array', { categories: {}, transactions: [] }],
  ])('rejects %s', (_label, value) => {
    expect(parseAppData(value).ok).toBe(false)
  })

  it.each([
    ['a zero amount', { ...lunch, amountCents: 0 }],
    ['a negative amount', { ...lunch, amountCents: -100 }],
    ['a fractional amount', { ...lunch, amountCents: 12.5 }],
    ['an amount stored as a string', { ...lunch, amountCents: '1250' }],
    ['an unsafe integer amount', { ...lunch, amountCents: 2 ** 53 }],
    ['an impossible date', { ...lunch, date: '2026-02-30' }],
    ['a date-time instead of a date', { ...lunch, date: '2026-10-08T10:00' }],
    ['an empty id', { ...lunch, id: '' }],
    ['a missing category id', { ...lunch, categoryId: undefined }],
    ['a note that is not a string', { ...lunch, note: 42 }],
    ['a non-object', 'lunch'],
  ])('rejects a transaction with %s', (_label, transaction) => {
    expect(parseAppData(withTransaction(transaction)).ok).toBe(false)
  })

  it.each([
    ['an empty name', { ...groceries, name: '  ' }],
    ['a negative budget', { ...groceries, monthlyBudgetCents: -1 }],
    ['a fractional budget', { ...groceries, monthlyBudgetCents: 0.5 }],
    ['a missing id', { name: 'Groceries', monthlyBudgetCents: 0 }],
  ])('rejects a category with %s', (_label, category) => {
    expect(parseAppData(withCategory(category)).ok).toBe(false)
  })

  it('rejects duplicate category ids', () => {
    const result = parseAppData({
      categories: [groceries, { ...groceries, name: 'Rent' }],
      transactions: [],
    })

    expect(result).toEqual({ ok: false, error: 'Duplicate category id' })
  })

  it('rejects duplicate transaction ids', () => {
    const result = parseAppData({
      categories: [groceries],
      transactions: [lunch, { ...lunch, amountCents: 900 }],
    })

    expect(result).toEqual({ ok: false, error: 'Duplicate transaction id' })
  })

  it('rejects a transaction whose category does not exist', () => {
    const result = parseAppData(withTransaction({ ...lunch, categoryId: 'c9' }))

    expect(result).toEqual({
      ok: false,
      error: 'Transaction t1 references a missing category',
    })
  })
})
