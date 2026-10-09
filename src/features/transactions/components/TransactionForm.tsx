import { useId, useRef, useState, type SubmitEvent } from 'react'
import { EmptyState } from '@/shared/components/EmptyState'
import { formatCents } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import type { IsoDate } from '@/shared/types'
import {
  DRAFT_FIELDS,
  validateTransactionDraft,
  type DraftErrors,
  type DraftField,
  type TransactionDraft,
} from '../logic/transactionDraft'
import { FormField } from './FormField'
import styles from './TransactionForm.module.css'

type TransactionFormProps = {
  /** The date the form starts with. Passed in so tests are deterministic. */
  today: IsoDate
}

type Outcome =
  { kind: 'idle' } | { kind: 'added'; message: string } | { kind: 'rejected' }

/**
 * Form for adding an expense. Draft values stay local until a valid submit;
 * after an add, the amount and note are cleared but the date and category
 * are kept, since several expenses are often entered for the same day.
 */
export function TransactionForm({ today }: TransactionFormProps) {
  const { data, addTransaction } = useAppData()
  const [draft, setDraft] = useState<TransactionDraft>({
    amount: '',
    date: today,
    categoryId: '',
    note: '',
  })
  const [errors, setErrors] = useState<DraftErrors>({})
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })
  const id = useId()
  const amountRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const fieldRefs = {
    amount: amountRef,
    date: dateRef,
    categoryId: categoryRef,
  }

  if (data.categories.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        description="Add a category before adding transactions."
      />
    )
  }

  function handleChange(field: keyof TransactionDraft, value: string) {
    setDraft({ ...draft, [field]: value })
    // Clear the last result once the next entry starts. This also means a
    // repeat of the same add changes the status from empty to the message,
    // so screen readers announce it again.
    if (outcome.kind !== 'idle') setOutcome({ kind: 'idle' })
    if (field !== 'note' && errors[field]) {
      setErrors({ ...errors, [field]: undefined })
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateTransactionDraft(draft, data.categories)
    if (!result.ok) {
      setErrors(result.error)
      setOutcome({ kind: 'idle' })
      const firstInvalid = DRAFT_FIELDS.find((field) => result.error[field])
      if (firstInvalid) fieldRefs[firstInvalid].current?.focus()
      return
    }

    const transaction = result.value
    if (!addTransaction(transaction)) {
      setOutcome({ kind: 'rejected' })
      return
    }
    const category = data.categories.find(
      (c) => c.id === transaction.categoryId,
    )
    setErrors({})
    setDraft({ ...draft, amount: '', note: '' })
    setOutcome({
      kind: 'added',
      message: `Added ${formatCents(transaction.amountCents)} to ${category?.name ?? 'the category'}.`,
    })
    amountRef.current?.focus()
  }

  function describedBy(field: DraftField) {
    return errors[field] ? `${id}-${field}-error` : undefined
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <FormField
          label="Amount"
          controlId={`${id}-amount`}
          errorId={`${id}-amount-error`}
          error={errors.amount}
        >
          <div className={styles.amount}>
            <span className={styles.currency} aria-hidden="true">
              $
            </span>
            <input
              ref={amountRef}
              id={`${id}-amount`}
              className={styles.control}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={draft.amount}
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={describedBy('amount')}
              onChange={(e) => {
                handleChange('amount', e.target.value)
              }}
            />
          </div>
        </FormField>
        <FormField
          label="Date"
          controlId={`${id}-date`}
          errorId={`${id}-date-error`}
          error={errors.date}
        >
          <input
            ref={dateRef}
            id={`${id}-date`}
            className={styles.control}
            type="date"
            value={draft.date}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={describedBy('date')}
            onChange={(e) => {
              handleChange('date', e.target.value)
            }}
          />
        </FormField>
        <FormField
          label="Category"
          controlId={`${id}-category`}
          errorId={`${id}-categoryId-error`}
          error={errors.categoryId}
        >
          <select
            ref={categoryRef}
            id={`${id}-category`}
            className={styles.control}
            value={draft.categoryId}
            aria-invalid={errors.categoryId ? true : undefined}
            aria-describedby={describedBy('categoryId')}
            onChange={(e) => {
              handleChange('categoryId', e.target.value)
            }}
          >
            <option value="">Choose a category</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Note"
          labelSuffix="optional"
          controlId={`${id}-note`}
          errorId={`${id}-note-error`}
          error={undefined}
        >
          <input
            id={`${id}-note`}
            className={styles.control}
            type="text"
            autoComplete="off"
            value={draft.note}
            onChange={(e) => {
              handleChange('note', e.target.value)
            }}
          />
        </FormField>
      </div>
      <div className={styles.actions}>
        <button className={styles.submit} type="submit">
          Add transaction
        </button>
        <p className={styles.status} role="status">
          {outcome.kind === 'added' && outcome.message}
        </p>
      </div>
      {outcome.kind === 'rejected' && (
        <p className={styles.formError} role="alert">
          This transaction couldn&apos;t be added. Check the details and try
          again.
        </p>
      )}
    </form>
  )
}
