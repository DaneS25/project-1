import { describe, expect, it } from 'vitest'
import type { Category } from '@/shared/types'
import {
  validateTransactionDraft,
  type TransactionDraft,
} from './transactionDraft'

const categories: Category[] = [
  { id: 'cat-1', name: 'Groceries', monthlyBudgetCents: 0 },
]

const validDraft: TransactionDraft = {
  amount: '12.50',
  date: '2026-10-09',
  categoryId: 'cat-1',
  note: '',
}

function errorsFor(changes: Partial<TransactionDraft>) {
  const result = validateTransactionDraft(
    { ...validDraft, ...changes },
    categories,
  )
  return result.ok ? {} : result.error
}

describe('validateTransactionDraft', () => {
  it('turns a valid draft into a transaction in cents', () => {
    expect(validateTransactionDraft(validDraft, categories)).toEqual({
      ok: true,
      value: { amountCents: 1250, date: '2026-10-09', categoryId: 'cat-1' },
    })
  })

  it('keeps a trimmed note', () => {
    const result = validateTransactionDraft(
      { ...validDraft, note: '  Weekly shop  ' },
      categories,
    )
    expect(result).toMatchObject({ ok: true, value: { note: 'Weekly shop' } })
  })

  it('leaves out a note that is only whitespace', () => {
    const result = validateTransactionDraft(
      { ...validDraft, note: '   ' },
      categories,
    )
    expect(result.ok && 'note' in result.value).toBe(false)
  })

  it.each([
    ['', 'Enter an amount.'],
    ['0', 'Enter an amount more than $0.00.'],
    ['0.00', 'Enter an amount more than $0.00.'],
    ['-5', 'Enter an amount more than $0.00.'],
    ['abc', 'Enter the amount as a number, like 12.50.'],
    ['1,2', 'Check the commas in the amount, like 1,250.00.'],
    ['1.234', 'Use no more than 2 decimal places.'],
    ['99999999999999999', 'That amount is too large.'],
  ])('rejects the amount "%s"', (amount, message) => {
    expect(errorsFor({ amount })).toEqual({ amount: message })
  })

  it('requires a date', () => {
    expect(errorsFor({ date: '' })).toEqual({ date: 'Enter a date.' })
  })

  it('rejects a date that is not on the calendar', () => {
    expect(errorsFor({ date: '2026-02-30' })).toEqual({
      date: 'Enter a real date.',
    })
  })

  it('requires a category', () => {
    expect(errorsFor({ categoryId: '' })).toEqual({
      categoryId: 'Choose a category.',
    })
  })

  it('rejects a category that does not exist', () => {
    expect(errorsFor({ categoryId: 'gone' })).toEqual({
      categoryId: 'That category no longer exists. Choose another.',
    })
  })

  it('reports every invalid field at once', () => {
    expect(
      Object.keys(errorsFor({ amount: '', date: '', categoryId: '' })),
    ).toEqual(['amount', 'date', 'categoryId'])
  })
})
