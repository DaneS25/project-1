import { useId } from 'react'
import type { Category } from '@/shared/types'
import type { TransactionDraftState } from '../hooks/useTransactionDraft'
import type { DraftField, TransactionDraft } from '../logic/transactionDraft'
import { FormField } from './FormField'
import styles from './TransactionForm.module.css'

type TransactionFieldsProps = {
  form: TransactionDraftState
  categories: readonly Category[]
  onChange: (field: keyof TransactionDraft, value: string) => void
}

/** The amount, date, category and note fields shared by add and edit. */
export function TransactionFields({
  form,
  categories,
  onChange,
}: TransactionFieldsProps) {
  const id = useId()
  const { draft, errors, amountRef, dateRef, categoryRef } = form

  function describedBy(field: DraftField) {
    return errors[field] ? `${id}-${field}-error` : undefined
  }

  return (
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
              onChange('amount', e.target.value)
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
            onChange('date', e.target.value)
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
            onChange('categoryId', e.target.value)
          }}
        >
          <option value="">Choose a category</option>
          {categories.map((category) => (
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
            onChange('note', e.target.value)
          }}
        />
      </FormField>
    </div>
  )
}
