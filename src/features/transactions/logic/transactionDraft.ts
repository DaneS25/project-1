import { isIsoDate } from '@/shared/lib/dates'
import { parseAmountToCents, type AmountError } from '@/shared/lib/money'
import type { Category, Result, Transaction } from '@/shared/types'

/** What the user has typed into the transaction form, before validation. */
export type TransactionDraft = {
  amount: string
  date: string
  categoryId: string
  note: string
}

export type DraftField = 'amount' | 'date' | 'categoryId'

/** An error message per invalid field, in the order the fields appear. */
export type DraftErrors = Partial<Record<DraftField, string | undefined>>

/**
 * Checks a draft and turns it into a transaction ready to add (without an
 * id). Amount must be more than zero, date must be a real `YYYY-MM-DD` date
 * and the category must exist. A blank note is left out.
 */
export function validateTransactionDraft(
  draft: TransactionDraft,
  categories: readonly Category[],
): Result<Omit<Transaction, 'id'>, DraftErrors> {
  const errors: DraftErrors = {}

  const amount = parseAmountToCents(draft.amount)
  if (!amount.ok) errors.amount = amountErrorMessage(amount.error)

  const date = draft.date.trim()
  if (date === '') errors.date = 'Enter a date.'
  else if (!isIsoDate(date)) errors.date = 'Enter a real date.'

  if (draft.categoryId === '') {
    errors.categoryId = 'Choose a category.'
  } else if (!categories.some((c) => c.id === draft.categoryId)) {
    errors.categoryId = 'That category no longer exists. Choose another.'
  }

  if (!amount.ok || Object.keys(errors).length > 0) {
    return { ok: false, error: errors }
  }

  const transaction = {
    amountCents: amount.value,
    date,
    categoryId: draft.categoryId,
  }
  const note = draft.note.trim()
  return {
    ok: true,
    value: note === '' ? transaction : { ...transaction, note },
  }
}

function amountErrorMessage(error: AmountError): string {
  switch (error) {
    case 'empty':
      return 'Enter an amount.'
    case 'invalid':
      return 'Enter the amount as a number, like 12.50.'
    case 'badGrouping':
      return 'Check the commas in the amount, like 1,250.00.'
    case 'tooManyDecimals':
      return 'Use no more than 2 decimal places.'
    case 'notPositive':
      return 'Enter an amount more than $0.00.'
    case 'tooLarge':
      return 'That amount is too large.'
    default: {
      const unhandled: never = error
      return unhandled
    }
  }
}
