import { useRef, useState } from 'react'
import type { Category, Transaction } from '@/shared/types'
import {
  DRAFT_FIELDS,
  validateTransactionDraft,
  type DraftErrors,
  type TransactionDraft,
} from '../logic/transactionDraft'

/**
 * Draft state shared by the add and edit forms: the typed values, the
 * error per field, and refs so the first invalid field can take focus.
 */
export function useTransactionDraft(initial: TransactionDraft) {
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<DraftErrors>({})
  const amountRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const fieldRefs = {
    amount: amountRef,
    date: dateRef,
    categoryId: categoryRef,
  }

  /** Updates one field and clears its error. */
  function change(field: keyof TransactionDraft, value: string) {
    setDraft({ ...draft, [field]: value })
    if (field !== 'note' && errors[field]) {
      setErrors({ ...errors, [field]: undefined })
    }
  }

  /**
   * Checks the draft. On failure, shows the errors, moves focus to the
   * first invalid field and returns null.
   */
  function validate(
    categories: readonly Category[],
  ): Omit<Transaction, 'id'> | null {
    const result = validateTransactionDraft(draft, categories)
    if (result.ok) {
      setErrors({})
      return result.value
    }
    setErrors(result.error)
    const firstInvalid = DRAFT_FIELDS.find((field) => result.error[field])
    if (firstInvalid) fieldRefs[firstInvalid].current?.focus()
    return null
  }

  return {
    draft,
    setDraft,
    errors,
    amountRef,
    dateRef,
    categoryRef,
    change,
    validate,
  }
}

export type TransactionDraftState = ReturnType<typeof useTransactionDraft>
